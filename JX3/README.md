# 剑网3无界：Quantumult X 登录和更新兼容

来源：可莉 Loon 插件 SeasunJX3_remove_ads.plugin（Moli-X/Tool）。原插件包含：

- [General] real-ip=*-update.xoyocdn.com, xg-flow.xoyo.com
- [Rewrite] 精确拒绝 WebCareerTab.txt 登录活动资源
- [MitM] hostname=jx3comm.xoyocdn.com

**重点：原插件解决登录/更新问题的功能是 real-ip，不只是广告 Rewrite。**

## QX 使用

1. 订阅 JX3.list 到 [filter_remote]（更新服务器 DIRECT）。
2. 在当前 QX 配置的 [general] **已有** dns_exclusion_list 后追加：
   `*-update.xoyocdn.com, xg-flow.xoyo.com`
   注意：QX 的 dns_exclusion_list 域名通配符通常写作 `*.xoyocdn.com`，为了覆盖所有 `*-update.xoyocdn.com` 主机，建议实际填写 `*.xoyocdn.com, xg-flow.xoyo.com`。这个条目属于主配置，不能通过 [filter_remote] 或 [rewrite_remote] 自动写入。
3. 登录和更新能正常使用之后，再选择订阅 JX3.conf 到 [rewrite_remote] 去除热门活动推送。
4. 如仍卡在登录页，暂时关掉 JX3.conf，并用网络活动检查是否为 MITM 证书校验、其他 REJECT 或连接失败。

```ini
[general]
# 示例：请与现有条目合并，不要覆盖已有 dns_exclusion_list。
dns_exclusion_list = <保留已有域名>, *.xoyocdn.com, xg-flow.xoyo.com

[filter_remote]
https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/JX3/JX3.list, tag=剑三更新登录直连, update-interval=86400, opt-parser=false, enabled=true

[rewrite_remote]
https://raw.githubusercontent.com/sndjdndi/QuantumultX-Rules/main/JX3/JX3.conf, tag=剑三热门活动去广告, update-interval=86400, opt-parser=false, enabled=true
```

注意：只有 Xoyocdn 后缀匹配可能仍不足以满足某些游戏版本其他服务器的要求。若不启用 QX 时游戏正常，而按照以上步骤后仍无法登录，请查看实际连接和拦截记录；不要猜测主机名并大范围放行。

文档参考：https://github.com/crossutility/Quantumult-X/blob/master/sample.conf
原插件：https://github.com/Moli-X/Tool/blob/X/Loon/Plugin/Kelee/SeasunJX3_remove_ads.plugin
