/*
  TomatoNovel QX ad response cleaner V2.0 (2026-10-28)
  Reference: app2smile's Pangle SDK no-fill code; FanqieHook position names.
  This is heuristic: it cannot delete app-side layouts or already cached ads.
  Scope: Pangle get_ads / is.snssdk get_ads or JSON on fqnovel.com.
  No body logging: response payloads may contain sensitive data.
*/
(function () {
  'use strict';
  function finish(payload) { $done(payload || {}); }
  try {
    if (typeof $request === 'undefined' || typeof $response === 'undefined' ||
        typeof $response.body !== 'string' || !$response.body) {
      return finish({});
    }
    var url = String($request.url || '');
    var method = String($request.method || '').toUpperCase();
    var isPangle = /^https?:\/\/(?:[a-z0-9-]+\.)*pangolin-sdk-toutiao\.com\/api\/ad\/union\/sdk\/get_ads(?:\/|\?|$)/i.test(url) ||
      /^https?:\/\/is\.snssdk\.com\/api\/ad\/union\/sdk\/get_ads(?:\/|\?|$)/i.test(url);
    var isFanqie = /^https?:\/\/(?:[a-z0-9-]+\.)*fqnovel\.com\//i.test(url);
    if (!isPangle && !isFanqie) return finish({});

    var data;
    try { data = JSON.parse($response.body); }
    catch (_) { return finish({}); }
    if (data === null || typeof data !== 'object') return finish({});

    // Same error family used in app2smile adsense.js: valid Pangle 'no fill'.
    // Restrict this synthetic response to POST get_ads (not normal app APIs).
    if (isPangle && method === 'POST') {
      var noFill = {
        request_id: data.request_id || '',
        status_code: 20001,
        reason: 112,
        desc: 'no ad available'
      };
      console.log('[TomatoNovel] Pangle no-fill response');
      return finish({ body: JSON.stringify(noFill) });
    }
    if (!isFanqie) return finish({});

    // Android FanqieHook ad slot names are references, not confirmed iOS field names.
    // Only remove exact/clearly ad-specific fields; do not alter story data.
    var adSlots = /^(?:reader_banner|video_reader_ad|reader_text_link_ad|reader_disconnected_ad|reader_ad_for_sati|page_front_ad|page_middle_ad|page_end_ad|topview_reader|topview_main|splash_ad|series_pause_ad|audio_info_flow_ad|audio_patch_ad|listen_ad|interstitial_ad|ad_list|ads_list|ad_materials|ad_creatives|ad_items|ad_data)$/i;
    var adFlags = /^(?:is_ad|has_ad|show_ad|can_show_ad|ad_available|enable_ad|enable_ads)$/i;
    var promotionText = /番茄送你惊喜电商券|去商城使用|完本交稿激励活动|开卷有始[，,\s]*合卷有成/i;
    var changed = 0;
    var MAX_DEPTH = 12;
    var MAX_NODES = 15000;
    var nodes = 0;
    function isPromotion(item) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return false;
      var texts = [];
      var fields = ['title','name','subtitle','sub_title','description','desc','button_text','button_title','btn_text','activity_name','ad_title','text'];
      for (var i = 0; i < fields.length; i++) {
        if (typeof item[fields[i]] === 'string') texts.push(item[fields[i]]);
      }
      return promotionText.test(texts.join(' '));
    }
    function emptySameType(val) {
      if (Array.isArray(val)) return [];
      if (val !== null && typeof val === 'object') return {};
      if (typeof val === 'boolean') return false;
      if (typeof val === 'number') return 0;
      return '';
    }
    function scrub(value, depth) {
      if (depth > MAX_DEPTH || ++nodes > MAX_NODES || !value || typeof value !== 'object') return value;
      if (Array.isArray(value)) {
        for (var i = value.length - 1; i >= 0; i--) {
          if (isPromotion(value[i])) { value.splice(i, 1); changed++; }
          else scrub(value[i], depth + 1);
        }
        return value;
      }
      var keys = Object.keys(value);
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j];
        if (adSlots.test(key)) {
          if (value[key] != null) { value[key] = emptySameType(value[key]); changed++; }
          continue;
        }
        if (adFlags.test(key)) {
          if (value[key] !== false) { value[key] = false; changed++; }
          continue;
        }
        if (value[key] && typeof value[key] === 'object' && isPromotion(value[key])) {
          value[key] = emptySameType(value[key]); changed++;
          continue;
        }
        scrub(value[key], depth + 1);
      }
      return value;
    }
    scrub(data, 0);
    if (changed) {
      console.log('[TomatoNovel] cleaned ' + changed + ' ad/promo fields');
      return finish({body: JSON.stringify(data)});
    }
    finish({});
  } catch (err) {
    console.log('[TomatoNovel] cleaner skipped on error');
    finish({});
  }
})();
