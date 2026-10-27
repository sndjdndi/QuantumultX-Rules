# Quantumult X personal rules

## TomatoNovel

- `TomatoNovel/TomatoNovel.list` - narrowly scoped filter rules
- `TomatoNovel/TomatoNovel.conf` - ad URL rewrite rules with MITM hostname declaration

Source adapted from [sve1r/Rules-For-Quantumult-X](https://github.com/sve1r/Rules-For-Quantumult-X). Original authors retain attribution.

### 2026-10-27 v1.0
- Removed `pull-*.douyincdn.com` and `p*-webcast-sign.douyinpic.com` REJECT entries after QX logs showed Douyin livestream pull requests being blocked.
- Reduced cross-app, shared-domain blocking and removed unverified IP-CIDR entries.
- Kept targeted ad SDK URLs for chapter-end / in-app ad testing.
- Occasional bottom ads are not yet confirmed fixed. Enable one TomatoNovel filter and one rewrite only; inspect QX network activities for remaining ads.
- A proxy client must support these rules, and HTTPS rewrite requires MITM certificate configured and trusted.

### QX
Import `.list` under `[filter_remote]` and `.conf` under `[rewrite_remote]`, then refresh subscriptions. Do not keep the old sve1r TomatoNovel lists enabled alongside these.
