# Bilibili Quantumult X unified rewrite V1.1 — 2026-11-11

Only ONE QX remote rewrite subscription is needed:

https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/Bilibili/Bilibili.conf

The companion JavaScript at `Bilibili/bilibili-json.js` is referenced automatically. The video-specific third-party Protobuf JavaScript is referenced automatically from a fixed GitHub commit (see below). **Do not separately subscribe to any JavaScript file.**

## Change from V1.0

- Combined former Bilibili.conf and Bilibili-Proto-Optional.conf into one remote rewrite file.
- Enabled the two previously commented, targeted video detail/player response rules:
  - `https://app.bilibili.com/bilibili.app.viewunite.v1.View/View`
  - `https://app.bilibili.com/bilibili.app.playerunite.v1.Player/PlayViewUnite`
- These attempt to remove recognized under-player advertising/promotional modules; not guaranteed to remove every ad version.
- Retained splash, recommended feeds, dynamic/popular/search, live room and narrow PGC advertising cleanup.
- No comment (`Reply/MainList`, `DetailList`) or barrage (`DM/DmView`) endpoint is rewritten.
- Kept the four known MITM hostnames, avoiding generic wildcards and grpc.biliapi.net interception by default.
- The old optional enhancement file is retired. If the user already has BOTH old subscriptions in QX, DISABLE/DELETE the older enhancement subscription.

## Install

In QX `[rewrite_remote]`:

```ini
https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/Bilibili/Bilibili.conf, tag=B站去广告V1.1, update-interval=86400, opt-parser=false, enabled=true
```

Before testing, disable other Bilibili rewrites such as Moyu BiliBiliAdsLite / BiliBiliAds and the former `Bilibili-Proto-Optional.conf`. Refresh QX remote rewrites. Ensure MITM is on, certificate installed/trusted, and cold restart Bilibili.

## Compatibility and limitations

**Important**: QX may not successfully intercept all Bilibili HTTP/2 gRPC traffic. The upstream Zenmo QX author noted that processing video details could disrupt comments or barrage. This unified test version deliberately limits processing to exactly two video interfaces under `app.bilibili.com`; no full-domain `grpc.biliapi.net` REJECT. The JavaScript has been tested with synthetic gRPC frames and URL regex tests, but not yet verified on the user's phone. See QX network activity to confirm actual rule matches, and test video playback, details, comments, barrage and recommendations.

If video detail or comments stop loading, disable Bilibili.conf temporarily. In the next repository revision, the two lines under `[8] NEW in v1.1` can be commented out without affecting the other rules. GitHub commit history also allows rollback to v1.0.

If the small ad under a video remains, capture or screenshot the actual panel and the associated request path (without sharing cookies or tokens). Different placements, including the pause ad launched in 2026, may be delivered by different interfaces; appearance alone cannot prove the network origin.

## Sources and attribution

- [KeLee/kokoryh Loon Bilibili plugin](https://github.com/Moli-X/Tool/blob/X/Loon/Plugin/Kelee/Bilibili_remove_ads.plugin) for conceptual endpoint reference, not copied Loon binary script.
- [ZenmoFeiShi/Qx](https://github.com/ZenmoFeiShi/Qx/blob/main/bili_view_ad_rewrite.snippet) for QX Protobuf video detail logic. Script pinned to [commit 5df3cafc4684](https://github.com/ZenmoFeiShi/Qx/tree/5df3cafc468419e7b58b0f4a1b75df0786ab1c67).
- [app2smile/rules](https://github.com/app2smile/rules/blob/master/module/bilibili-qx.conf) for QX integration ideas.
- [Quantumult X rewrite documentation](https://github.com/crossutility/Quantumult-X/blob/master/rewrite.md)

No third-party bundled scripts or user capture data have been copied into this repository.
