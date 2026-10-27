# QuantumultX-Rules

Personal Quantumult X filter and rewrite resources, based on sve1r, KeLee, fmz200 and app2smile. TomatoNovel V2.0 is a TEST version; it has been checked against provided captures and synthetic responses, but is not yet proven to remove all on-device ads.

## TomatoNovel files (V2.0, 2026-10-28)

- [TomatoNovel.list](TomatoNovel/TomatoNovel.list): app telemetry and recognizable ad infrastructure, with shared Douyin live CDN excluded.
- [TomatoNovel.conf](TomatoNovel/TomatoNovel.conf): ad URLs, response script, novel-player live video matching.
- [ads-clean.js](TomatoNovel/ads-clean.js): Pangle no-fill response and experimental JSON cleaning. This file is referenced by the rewrite resource and is not a third subscription.

### Subscriptions

Add this as a filter remote resource:

https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/TomatoNovel/TomatoNovel.list

Add this as a rewrite remote resource:

https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/TomatoNovel/TomatoNovel.conf

Set the refresh interval to 86400 seconds (or update manually). Disable any older TomatoNovel filter/rewrite copies to avoid conflicts. Maintain a single general adblocking subscription, a separate HTTPDNS filter if needed, and the selected startup ad rewrite. HTTPS rewriting requires enabled MITM and a trusted QX certificate; HTTP capture can remain off.

### Three observed ad cases

| Beijing time | Evidence | V2.0 method | Verification |
| --- | --- | --- | --- |
| 00:37 | Full-screen e-commerce coupon screenshot; the ad delivery URL was not present in the supplied HAR | Experimental first-party promotion/JSON fields | Not validated on device |
| 00:41 | Live shopping screenshot; HAR shows an HTTP FLV request with ttplayer(...-novel) User-Agent at 00:41:15 | URL-and-header match blocks this request specifically | Matched real HAR in offline test, not validated on device |
| 00:48 | Bottom banner promoting official activity; only domain-discovery /get_domains/v4/ captured | Experimental first-party ad/promo JSON cleanup | Not validated on device |

The 00:41 rule does NOT block every request to douyincdn.com, and it may stop playback without suppressing the full-screen ad container. The domain-discovery endpoint /get_domains/v4/ has intentionally not been blocked. Android FanqieHook ad slot names informed possible JSON keys, but those keys are NOT confirmed in iOS responses.

### Diagnostics, safety and rollback

- A broad main advertising domain list may reject the SDK domain before the JavaScript response script sees anything. The device's QX network activity will show the actual match.
- A regular successful HTTP response is not proof of an ad interface. Do not add unverified blocks based only on timestamps.
- If app content breaks, disable the new TomatoNovel rewrite first, identify the matching rule, and use GitHub commit history to roll back.
- Public GitHub repositories should never contain HAR dumps or screenshots exposing session cookies, OAuth tokens, device identifiers or other credentials.

### Credits and research

- https://github.com/sve1r/Rules-For-Quantumult-X
- https://github.com/Moli-X/Tool/blob/X/Loon/Plugin/Kelee/DragonRead_remove_ads.plugin
- https://github.com/Moli-X/Tool/blob/X/Loon/Plugin/Kelee/BlockAdvertisers.plugin
- https://github.com/fmz200/wool_scripts
- https://github.com/app2smile/rules/blob/master/js/adsense.js
- https://github.com/afwfv/FanqieHook
- https://github.com/crossutility/Quantumult-X/blob/master/rewrite.md

### Changelog

- V2.0: Rewrote the two QX rules, added Pangle JSON no-fill response, experimental promotion clean-up and UA-scoped novel live FLV reject.
- V1.1: Added KeLee exact Fanqie telemetry domains and root Pangle interface.
- V1.0: Removed unconditional Douyin live CDN block, which had interrupted normal Douyin live streams.
