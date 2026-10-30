# StreamUI-Plugin-Laplace

StreamUICore 的独立 LAPLACE Event Bridge 插件。负责桥接连接、可选本地桥接进程及弹幕标准化。需要 Windows x64、.NET 10 SDK 和原生 Contracts SDK major 1。

## 构建与使用

克隆到 Core/plugins/laplace，然后执行：

~~~powershell
powershell.exe -NoProfile -File build.ps1 -SdkPath <Core>/sdk/native
~~~

在“插件配置 → LAPLACE 弹幕”填写 Event Bridge 地址、端口与 Token，开启连接。使用本地桥接时启用相应开关；LAPLACE 采集端仍需向该桥接发送事件。

## 公开能力

- plugin.laplace.status：{state,error,localBridge,events,lastEventAt}。
- plugin.laplace.chat.message、chat.gift、chat.superchat：标准化消息。

消息为 {id,kind,platform,timestamp,user,text,gift,payment}。user 包含 id、name、level、medalName、medalLevel；gift 包含 name、count；payment 包含 amount、currency。时间为毫秒，金额未知为 null。插件去重但不定义文案、排队、打字或视觉效果，这些由场景组件完成。

新页面可从 plugins[].topics.status 取得连接状态。私有 Token 不发布到公开状态。

本地桥接下载、校验和生命周期由本插件负责，Core 不包含弹幕代码。scripts/event-bridge.mjs 提供可选的命令行桥接辅助工具。

## 验证与更新

~~~powershell
powershell.exe -NoProfile -File tests/test.ps1 -SdkPath <Core>/sdk/native
~~~

测试使用本机模拟 Event Bridge，验证 Token、心跳、去重和标准化。仓库保留源码和构建配置，不提交 DLL、deps.json、bin、obj、.local。更新前退出 Core，在安装目录合并 Git 更新、构建，再启动。用户设置和插件数据保存在独立数据目录；legacySettingsKey 只在没有插件设置文件时导入旧连接配置。
