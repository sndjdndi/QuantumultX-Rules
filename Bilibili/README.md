# Bilibili Quantumult X (v1.0, 2026-11-11)

Goal: closer to the selective KeLee/kokoryh Loon Bilibili plugin while avoiding the comment/detail failures experienced with the Moyu full BiliBiliAds.conf. Focus on stable QX JSON API responses; do not blindly translate Loon binary/gRPC scripts.

## Files

- **Bilibili.conf** — DEFAULT QX rewrite subscription: splash, recommendation feed, story feed, tab game promotion, search cards, PGC activity material, live home/room and narrow ad endpoints. Does **not** change gRPC/Protobuf video detail or comments.
- **bilibili-json.js** — first-party original response script for explicitly scoped JSON endpoints. If response isn't recognized or isn't JSON, leaves it untouched.
- **Bilibili-Proto-Optional.conf** — ADVANCED OPTIONAL QX-specific Protobuf enhancement. Upstream third-party script sourced from ZenmoFeiShi and pinned to an audited GitHub commit; not needed for the main rule. Three general endpoints enabled, two video detail/player handlers commented out due to higher compatibility risk.

## QX installation

Disable both Moyu **BiliBiliAds.conf** and **BiliBiliAdsLite.conf** before testing (if installed). Keep one general ad filter (AWAvenue or AdRules); MITM certificate must be installed, trusted, and enabled. HTTP capture need not be on.

Put this line under [rewrite_remote]:

https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/Bilibili/Bilibili.conf, tag=B站去广告-稳定版, update-interval=86400, opt-parser=false, enabled=true

Do NOT subscribe to JavaScript directly. Refresh remote rewrites. This rule includes its MITM hostnames: app.bilibili.com, api.bilibili.com, api.live.bilibili.com, line3-h5-mobile-api.biligame.com.

Optional Protobuf file, enable ONLY if additional dynamic/popular filtering is wanted:

https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/Bilibili/Bilibili-Proto-Optional.conf, tag=B站Protobuf增强-可选, update-interval=86400, opt-parser=false, enabled=false

QX may not apply binary rewriting to every gRPC-over-HTTP/2 request, depending on client version and network behavior. It is deliberately separate so it can be switched off without affecting normal app operation. NEVER enable Mojyu full and these rules at once.

## Compatibility and expectations

- COMMENT/MainList, View/View and playback are **untouched in the default module**. Comment page stability is prioritized over very aggressive advertising removal.
- The default module therefore will not remove **every** ad embedded in gRPC video details; this is a deliberate compatibility tradeoff.
- JSON ad filtering retains non-ad video cards; it never replaces entire feed or comments with empty objects.
- If comments fail, temporarily turn OFF the optional Protobuf module first, and inspect QX network activity for another active rule/MITM conflict. If the optional module is off, the main module does not rewrite comments.
- Testing so far: 8 isolated JSON-response simulations passed; real-device results remain unconfirmed. Real-version differences may require updates. No user HAR/cookies are committed to this public repo.

## Provenance

Reference plugins/research:
- KeLee / kokoryh Loon plugin: https://github.com/Moli-X/Tool/blob/X/Loon/Plugin/Kelee/Bilibili_remove_ads.plugin
- kokoryh scripts: https://github.com/Moli-X/Tool/tree/X/Loon/Plugin/Kelee/Script
- app2smile QX approach: https://github.com/app2smile/rules/blob/master/module/bilibili-qx.conf
- ZenmoFeiShi QX optional Protobuf: https://github.com/ZenmoFeiShi/Qx
- Quantumult X rewrite docs: https://github.com/crossutility/Quantumult-X/blob/master/rewrite.md

Keep author attributions and relevant licenses when reusing upstream code. This repo does not redistribute any copied third-party bundled Protobuf implementation.
