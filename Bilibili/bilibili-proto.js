/*
 * Bilibili QX protobuf cleaner V2.0 (2026-11-12)
 * Original, narrowly scoped wire-format implementation.
 * Functional behavior researched from public kokoryh/KeLee Loon plugin's
 * View / RelatesFeed / AIRelateAsync / Player message field handling.
 * DOES NOT import, redistribute or execute Loon-only script bundles.
 * Unknown protobuf fields and all comment APIs are preserved.
 */
(function () {
  "use strict";
  var MAX = 1024 * 1024;

  function log(s) { try { console.log("[BiliQX-Proto] " + s); } catch (_) {} }
  function done(o) { $done(o || {}); }
  function uint8(o) {
    if (o instanceof ArrayBuffer) return new Uint8Array(o);
    if (o instanceof Uint8Array) return o;
    if (o && ArrayBuffer.isView && ArrayBuffer.isView(o)) return new Uint8Array(o.buffer, o.byteOffset, o.byteLength);
    return null;
  }
  function cat(arr) {
    var n = 0, i, out, pos = 0;
    for (i = 0; i < arr.length; i++) n += arr[i].length;
    out = new Uint8Array(n);
    for (i = 0; i < arr.length; i++) { out.set(arr[i], pos); pos += arr[i].length; }
    return out;
  }
  function readV(b, p, end) {
    var x = 0, shift = 0, i;
    for (i = 0; i < 10 && p < end; i++) {
      var v = b[p++];
      if (shift <= 49) x += (v & 127) * Math.pow(2, shift);
      if ((v & 128) === 0) return { value: x, next: p };
      shift += 7;
    }
    throw new Error("Invalid varint");
  }
  function encV(v) {
    var a = [];
    if (!(v >= 0 && Number.isSafeInteger(v))) throw new Error("Invalid integer");
    do { var n = v % 128; v = Math.floor(v / 128); a.push(n | (v ? 128 : 0)); } while (v);
    return new Uint8Array(a);
  }
  function fields(b) {
    var p = 0, out = [], end = b.length;
    while (p < end) {
      var start = p, t = readV(b, p, end), tag = t.value;
      p = t.next;
      var no = Math.floor(tag / 8), wire = tag % 8;
      if (no < 1 || no > 100000 || !Number.isSafeInteger(tag)) throw new Error("Invalid tag");
      var bodyStart = p, value;
      if (wire === 0) { var v = readV(b, p, end); value = v.value; p = v.next; }
      else if (wire === 1) p += 8;
      else if (wire === 2) {
        var length = readV(b, p, end); p = length.next;
        if (!(length.value >= 0 && length.value <= MAX)) throw new Error("Invalid length");
        bodyStart = p; p += length.value;
      } else if (wire === 5) p += 4;
      else throw new Error("Unsupported wire type");
      if (p > end) throw new Error("Truncated message");
      out.push({ no: no, wire: wire, start: start, end: p, from: bodyStart, to: p, value: value });
    }
    return out;
  }
  function patch(b, callback) {
    var f = fields(b), chunks = [], changed = false;
    for (var i = 0; i < f.length; i++) {
      var field = f[i], original = b.subarray(field.start, field.end);
      var next = callback(field, b);
      if (next === null) { changed = true; continue; }
      if (next instanceof Uint8Array) { chunks.push(next); changed = true; continue; }
      chunks.push(original);
    }
    return changed ? cat(chunks) : b;
  }
  function nest(b, f, callback) {
    if (f.wire !== 2) return;
    var original = b.subarray(f.from, f.to), edited = callback(original);
    if (edited === original) return;
    return cat([encV(f.no * 8 + 2), encV(edited.length), edited]);
  }
  function val(b, f, expected) { return f.no === expected && f.wire === 0 ? f.value : null; }
  function hasNonempty(b, no) {
    return fields(b).some(function (f) { return f.no === no && f.wire === 2 && f.to > f.from; });
  }
  function scalar(b, no) {
    var list = fields(b), i;
    for (i = 0; i < list.length; i++) if (list[i].no === no && list[i].wire === 0) return list[i].value;
    return -1;
  }
  // KeLee: commercial related cards of types 4,5,6,7,11, commercial stock
  // or cards bearing a commercial uniqueId are excluded.
  function commercialCard(b) {
    var type = scalar(b, 1);
    if ([4, 5, 6, 7, 11].indexOf(type) !== -1) return true;
    if (hasNonempty(b, 11)) return true;
    var list = fields(b);
    for (var i = 0; i < list.length; i++)
      if (list[i].no === 12 && list[i].wire === 2 && hasNonempty(b.subarray(list[i].from, list[i].to), 6)) return true;
    return false;
  }
  function cards(b) {
    return patch(b, function (f, buf) {
      if (f.no === 1 && f.wire === 2 && commercialCard(buf.subarray(f.from, f.to))) return null;
    });
  }
  function moduleItem(b) {
    var type = scalar(b, 1);
    // Same commercial/promotional module types filtered by the public Loon implementation.
    if ([18, 29, 37, 55, 63].indexOf(type) !== -1) return null;
    if (type === 28) {
      return patch(b, function (f, buf) {
        if (f.no === 22) return nest(buf, f, cards);
      });
    }
    return b;
  }
  function modules(b) {
    return patch(b, function (f, buf) {
      if (f.no !== 2 || f.wire !== 2) return;
      var obj = buf.subarray(f.from, f.to), cleaned = moduleItem(obj);
      if (cleaned === null) return null;
      if (cleaned !== obj) return nest(buf, f, function () { return cleaned; });
    });
  }
  function tab(b) {
    return patch(b, function (f, buf) {
      if (f.no === 1) return nest(buf, f, function (m) {
        return patch(m, function (x, inner) {
          if (x.no === 2) return nest(inner, x, modules);
        });
      });
    });
  }
  function newView(b) {
    return patch(b, function (f, buf) {
      if (f.no === 7) return null; // cm: commercial ad message
      if (f.no === 3) return nest(buf, f, function (u) { return patch(u, function (x) { if (x.no === 7) return null; }); });
      if (f.no === 5) return nest(buf, f, tab);
    });
  }
  function oldRelateAd(b) { return hasNonempty(b, 28); }
  function oldView(b) {
    return patch(b, function (f, buf) {
      if ([23, 30, 31, 41, 50].indexOf(f.no) !== -1) return null;
      if (f.no === 4) return nest(buf, f, function (u) { return patch(u, function (x) { if (x.no === 9) return null; }); });
      if (f.no === 10 && f.wire === 2 && oldRelateAd(buf.subarray(f.from, f.to))) return null;
    });
  }
  function oldRelates(b) {
    return patch(b, function (f, buf) {
      if (f.no === 1 && f.wire === 2 && oldRelateAd(buf.subarray(f.from, f.to))) return null;
    });
  }
  function newRelates(b) {
    return patch(b, function (f, buf) {
      if (f.no === 1 && f.wire === 2 && commercialCard(buf.subarray(f.from, f.to))) return null;
    });
  }
  function asyncRelates(b) {
    return patch(b, function (f, buf) {
      if (f.no === 1) return null; // cm
      if (f.no === 2) return nest(buf, f, function (asyncModule) {
        return patch(asyncModule, function (x, inner) {
          if (x.no === 1) {
            var item = inner.subarray(x.from, x.to), edited = moduleItem(item);
            if (edited === null) return null;
            if (edited !== item) return nest(inner, x, function () { return edited; });
          }
        });
      });
    });
  }
  function player(b) {
    return patch(b, function (f, buf) {
      if (f.no === 9) return nest(buf, f, function (view) {
        return patch(view, function (x) { if (x.no === 2) return null; }); // prompt_bar
      });
    });
  }
  function pgcPlayer(b) {
    return patch(b, function (f, buf) {
      if (f.no === 5) return nest(buf, f, function (view) {
        return patch(view, function (x) { if (x.no === 8) return null; }); // try_watch_prompt_bar
      });
    });
  }
  function oldProgress(b) { return patch(b, function (f) { if (f.no === 1) return null; }); }

  var handlers = {
    "bilibili.app.view.v1.View/View": oldView,
    "bilibili.app.view.v1.View/RelatesFeed": oldRelates,
    "bilibili.app.view.v1.View/ViewProgress": oldProgress,
    "bilibili.app.viewunite.v1.View/View": newView,
    "bilibili.app.viewunite.v1.View/RelatesFeed": newRelates,
    "bilibili.app.viewunite.v1.View/AIRelateAsync": asyncRelates,
    "bilibili.app.playerunite.v1.Player/PlayViewUnite": player,
    "bilibili.pgc.gateway.player.v2.PlayURL/PlayView": pgcPlayer
  };
  try {
    var m = /^https:\/\/(app\.bilibili\.com|grpc\.biliapi\.net)\/([^?#]+)$/i.exec(String($request && $request.url || ""));
    if (!m || !Object.prototype.hasOwnProperty.call(handlers, m[2])) return done({});
    var b = uint8($response && $response.bodyBytes);
    if (!b || b.length < 5 || b.length > MAX) return done({});
    var compressed = b[0], n = b[1] * 16777216 + b[2] * 65536 + b[3] * 256 + b[4];
    if (compressed !== 0 && compressed !== 1) return done({});
    if (n !== b.length - 5) return done({}); // prevent corrupt multi-frame responses
    var payload = b.subarray(5), compress = null;
    if (compressed === 1) {
      // Only use verified QX host utility if BOTH directions exist.
      if (typeof $utils === "undefined" || !$utils ||
          typeof $utils.ungzip !== "function" || typeof $utils.gzip !== "function") {
        log("Compressed gRPC response left untouched");
        return done({});
      }
      var unpacked = uint8($utils.ungzip(payload));
      if (!unpacked) return done({});
      payload = unpacked;
      compress = function (u) { return uint8($utils.gzip(u)); };
    }
    if (payload.length > MAX) return done({});
    var cleaned = handlers[m[2]](payload);
    if (cleaned === payload) return done({});
    if (cleaned.length > MAX) return done({});
    var outBody = compress ? compress(cleaned) : cleaned;
    if (!outBody || outBody.length > MAX) return done({});
    var out = new Uint8Array(5 + outBody.length), l = outBody.length;
    out[0] = compressed;
    out[1] = (l >>> 24) & 255; out[2] = (l >>> 16) & 255;
    out[3] = (l >>> 8) & 255; out[4] = l & 255;
    out.set(outBody, 5);
    log("Removed commercial fields from " + m[2] + " (" + (payload.length - cleaned.length) + " bytes)");
    done({ bodyBytes: out.buffer });
  } catch (e) {
    log("Parse failed, passed through unchanged: " + String(e && e.message || "unknown"));
    done({});
  }
})();