# Bilibili Quantumult X v2.0 — KeLee-style video ad filtering (2026-11-12)

## Single subscription (no separate "enhancement" subscription)

Use this **one** remote rewrite in Quantumult X:

https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/Bilibili/Bilibili.conf

The rewrite automatically invokes both:
- `bilibili-json.js`: existing homepage, splash, PGC promotion and live-room ad processing.
- `bilibili-proto.js`: **new independent Protobuf wire-format parser** for video under-player ads and recommendations.

Do **not** manually import JS files. The previous `Bilibili-Proto-Optional.conf` file has already been removed.

## Why v1.1 could still show ads below videos

v1.1 only subscribed to `View/View` and `PlayViewUnite` on `app.bilibili.com`, while KeLee's publicly collected Loon plugin also handles legacy View, `RelatesFeed`, `AIRelateAsync`, and `grpc.biliapi.net` routes. Bilibili apps can fetch video-page commercial cards from related feeds instead of embedding them in the first detail response.

## v2.0 scope

The independent QX protobuf parser closely mirrors the **observable field-filtering approach** of the publicly collected kokoryh/KeLee Loon implementation:

- Legacy `app.view.v1.View/View`: clear commercial `cms`, `cm_config`, `cm_ipad`, `special_cell_new`, `label`, embedded `ReqUser.elec_plus_btn`, and commercial entries in `relates`.
- `app.view.v1.View/RelatesFeed`: remove card entries with commercial marker `cm`.
- `app.view.v1.View/ViewProgress`: remove promotional `video_guide`.
- New `app.viewunite.v1.View/View`: clear `cm` and `ReqUser.elec_plus_btn`, remove recognized commercial/promotional module types 18, 29, 37, 55, 63, and clean module type 28's related commercial cards.
- `app.viewunite.v1.View/RelatesFeed`: filter related cards of types 4, 5, 6, 7, 11; remove entries with commercial `cm_stock` or `basic_info.unique_id`.
- `app.viewunite.v1.View/AIRelateAsync`: clear `cm` and filter commercial modules.
- `app.playerunite.v1.Player/PlayViewUnite`: remove `view_info.prompt_bar`.
- `pgc.gateway.player.v2.PlayURL/PlayView`: remove `view_info.try_watch_prompt_bar`.

These cover both `app.bilibili.com` and `grpc.biliapi.net` URL patterns. The main QX rewrite includes only five precise MITM hostnames, **no wildcard Bilibili domains and no grpc host REJECT**.

Unrecognized binary/protobuf fields remain byte-for-byte untouched; corrupt/unsupported/oversize/compressed-without-utilities responses pass through without modification. **Reply/comment endpoints, barrage/danmaku endpoints, login, playback streams and media CDNs are not targeted.**

## Important platform limitation

This is **not** a literal 1:1 clone of the Loon plugin, because:
- KeLee/kokoryh's Loon scripts explicitly reject Quantumult X in their JavaScript runtime and use Loon-specific binary HTTP/2 APIs and request retry logic;
- KeLee publicly noted that some Bilibili ads delivered over `grpc.biliapi.net` (HTTP/2) were not inspectable by Quantumult X's MITM implementation. QX behavior can change by version, so check actual QX traffic.
- The website's protected plugin distribution cannot be treated as a reusable source code bundle. This repository's protobuf parser is independently implemented from publicly visible message field behavior and does not redistribute Loon's bundle.

The presence of URL regexes for `grpc.biliapi.net` **does not guarantee** QX can decrypt those gRPC responses. Only an actual per-request rewrite hit proves execution.

## Install / test

1. Disable all other Bilibili remote rewrites (Moyu full/Lite, older Bilibili copies) to avoid conflicts. Retain only this single Bilibili.conf.
2. Refresh the remote rewrite subscription in QX, confirm the trusted MITM certificate, then fully terminate and reopen Bilibili.
3. Test a normal video, its under-player ad, related video carousel, comments and playback. Also open several different videos because ad material may be served on different endpoints.
4. In QX network activity, inspect matching paths (`View/View`, `RelatesFeed`, `AIRelateAsync`) and log messages starting `[BiliQX-Proto]`. Absence of script logs does not prove a server-side ad delivery request has been intercepted.
5. If video details or comments break, temporarily turn OFF this Bilibili rewrite and restore the last known working GitHub commit. Use GitHub history to roll back.

**Simulation tests passed**: View ad fields, legacy View, related feed, playback prompt, comment bypass, untouched unknown data, malformed input and unsupported compressed messages. This does not substitute for real-device testing.

If the small under-video ad persists, a screenshot of the precise ad placement and QX's corresponding request path (never cookies/tokens/session values) is needed for diagnosis. Do not add generic domain rejections based solely on ad timing.

## Sources/credits

- [Publicly collected KeLee/kokoryh Loon plugin](https://github.com/Moli-X/Tool/blob/X/Loon/Plugin/Kelee/Bilibili_remove_ads.plugin)
- [KeLee warning regarding QX HTTP/2 MITM](https://t.me/s/ibilibili/153)
- [Public app2smile QX examples](https://github.com/app2smile/rules/blob/master/module/bilibili-qx.conf)
- [ZenmoFeiShi QX protobuf work](https://github.com/ZenmoFeiShi/Qx/blob/main/bili_view_ad_rewrite.snippet)
