/*
 * Bilibili Quantumult X JSON ad cleaner v1.0 (2026-11-11)
 * Based on the observable API and filtering ideas of kokoryh/KeLee and app2smile.
 * Explicitly excludes video detail and comment APIs. Keeps unknown response fields.
 */
(function () {
  "use strict";

  function done(value) { $done(value || {}); }
  try {
    if (!$request || !$response || typeof $response.body !== "string" || !$response.body) {
      return done({});
    }

    var url = String($request.url || "");
    var match = /^https:\/\/(app\.bilibili\.com|api\.bilibili\.com|api\.live\.bilibili\.com)(\/[^?#]*)(?:\?|$)/i.exec(url);
    if (!match) return done({});
    var host = match[1].toLowerCase();
    var path = match[2];
    var obj;
    try { obj = JSON.parse($response.body); } catch (ignored) { return done({}); }
    if (!obj || typeof obj !== "object" || !obj.data || typeof obj.data !== "object") {
      return done({});
    }

    var d = obj.data;
    var count = 0;
    function has(obj, key) { return Object.prototype.hasOwnProperty.call(obj, key); }
    function set(obj, key, value) {
      if (!obj || !has(obj, key)) return;
      if (JSON.stringify(obj[key]) !== JSON.stringify(value)) {
        obj[key] = value;
        count++;
      }
    }
    function isAd(item) {
      if (!item || typeof item !== "object") return false;
      if (item.ad_info != null || item.adInfo != null || item.is_ad === true || item.is_ad === 1) return true;
      if (item.type === "ad" || item.type === "AD" || item.card_type === "ad") return true;
      var goto = String(item.card_goto || "");
      if (/^(?:ad_|vertical_ad_)/i.test(goto)) return true;
      if (item.card_type === "small_cover_v10" && goto === "game") return true;
      return false;
    }
    function cleanItems(items) {
      if (!Array.isArray(items)) return items;
      return items.filter(function (item) {
        if (isAd(item)) { count++; return false; }
        if (item && Array.isArray(item.banner_item)) {
          var before = item.banner_item.length;
          item.banner_item = item.banner_item.filter(function (v) { return !isAd(v); });
          if (before !== item.banner_item.length) count += before - item.banner_item.length;
          if ((item.card_type === "banner_v8" || item.card_goto === "banner") && before > 0 && !item.banner_item.length) {
            count++;
            return false;
          }
        }
        return true;
      });
    }
    function pruneNamedLists(parent) {
      if (!parent || typeof parent !== "object") return;
      ["items", "cards", "card_list", "banners"].forEach(function (key) {
        if (Array.isArray(parent[key])) parent[key] = cleanItems(parent[key]);
      });
    }
    function pruneLiveData(data, level) {
      if (!data || typeof data !== "object" || level > 2) return;
      pruneNamedLists(data);
      ["ad_info", "ad_banner", "ad_material", "advertisement"].forEach(function (key) {
        if (has(data, key) && data[key] != null) {
          data[key] = Array.isArray(data[key]) ? [] : null;
          count++;
        }
      });
      ["room_info", "module_info", "data", "extra"].forEach(function (key) {
        if (data[key] && typeof data[key] === "object") pruneLiveData(data[key], level + 1);
      });
    }

    // Splash: retain the API shape, remove only the actual ad lists.
    if (host === "app.bilibili.com" && /^\/x\/v2\/splash\/(?:show|list|event\/list2)$/.test(path)) {
      if (has(d, "show")) set(d, "show", []);
      if (has(d, "event_list")) set(d, "event_list", []);
      if (has(d, "list")) set(d, "list", [{}]);
      if (has(d, "keep_ids")) set(d, "keep_ids", []);

    // Recommended and story feeds: filter marked ads only; keep normal videos and feeds.
    } else if (host === "app.bilibili.com" && /^\/x\/v2\/feed\/index(?:\/story)?$/.test(path)) {
      pruneNamedLists(d);

    // Top bar: remove only the clearly promotional Game Center entry, keep bottom tabs.
    } else if (host === "app.bilibili.com" && path === "/x/resource/show/tab/v2") {
      if (Array.isArray(d.top)) {
        var length = d.top.length;
        d.top = d.top.filter(function (entry) { return entry && entry.name !== "游戏中心"; });
        if (length !== d.top.length) {
          count += length - d.top.length;
          d.top.forEach(function (entry, index) {
            if (typeof entry.pos === "number") entry.pos = index + 1;
          });
        }
      }

    // PGC promotional overlay: keep response metadata and suppress only the ad material.
    } else if (host === "api.bilibili.com" && path === "/pgc/activity/deliver/material/receive") {
      if (has(d, "container")) set(d, "container", []);
      if (has(d, "closeType")) set(d, "closeType", "close_win");
      if (has(d, "showTime")) set(d, "showTime", "");

    // PGC channel page: drop only ad-linked era banners.
    } else if (host === "api.bilibili.com" && path === "/pgc/page/channel") {
      if (Array.isArray(d.modules)) {
        d.modules.forEach(function (module) {
          if (!module || module.type !== "BANNER" || !module.module_data || !Array.isArray(module.module_data.items)) return;
          var old = module.module_data.items.length;
          module.module_data.items = module.module_data.items.filter(function (item) {
            var link = String((item && item.url) || "");
            return !/^https:\/\/www\.bilibili\.com\/blackboard\/era\//i.test(link) && !isAd(item);
          });
          count += old - module.module_data.items.length;
        });
      }

    // Live home/room: avoid changing room identity, playback, and comments.
    } else if (host === "api.live.bilibili.com" && /^\/xlive\/(?:app-interface\/v2\/index\/feed|app-room\/v1\/index\/getInfoBy(?:Room|User))$/.test(path)) {
      pruneLiveData(d, 0);

    // Search suggestions: only remove elements explicitly identified as advertisements.
    } else if (host === "app.bilibili.com" && path === "/x/v2/search/square") {
      pruneNamedLists(d);

    } else {
      return done({});
    }

    if (count > 0) {
      console.log("[BiliQX] removed " + count + " ad/promotional item(s) from " + path);
      return done({ body: JSON.stringify(obj) });
    }
    done({});
  } catch (e) {
    console.log("[BiliQX] skipped unrecognized response");
    done({});
  }
})();