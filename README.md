# Ambient light for Bilibili

为 Bilibili 桌面播放页添加随视频变化的氛围光。版本 **0.5.3**，Manifest V3，原生 JavaScript，无构建步骤或运行时依赖。

![扩展图标](extension/icons/128.png)

## 功能

- 随视频画面变化的柔和光效，提供柔和、影院、绚彩三个预设。
- 调整强度、30–400% 扩散、柔化、饱和度、平滑和 8–30 fps 采样上限。
- 设置面板中的山峦预览随参数变化；支持可切换的深色页面背景。
- 宽屏模式可选上下黑边、左右黑边、纯色边框识别及等比例填充，四项默认关闭。
- 所有视频处理在本机完成，设置保存于浏览器本地。

## 安装与使用

Chrome Web Store 与 Microsoft Edge Add-ons 的 0.5.2 均已于 2026-10-01 提交审核，状态分别为 Pending review 与 In review。Chrome 已设置审核通过后自动发布。两家商店暂未提供安装链接；[GitHub 0.5.3 修复包](https://github.com/tosya301/ambient-light-for-bilibili/releases/tag/v0.5.3)可用于本地加载，修复评论区分割线与上方颜色不一致的问题。本次 GitHub 更新不改变两家商店已送审的 0.5.2。

本地安装：下载本仓库，在浏览器扩展管理页打开开发者模式，选择“加载已解压的扩展”，加载 **extension** 文件夹，然后刷新 Bilibili 播放页面。

点击页面右下角的“氛围光”或工具栏扩展图标打开设置，阅读本地处理说明并明确同意后才会开启。可在“更多”撤回同意并停止处理。默认快捷键为 **Alt+Shift+A**；可在浏览器的扩展快捷键设置中调整。更新时替换同一目录内的文件，再重新加载扩展并刷新页面，以保留扩展 ID 和设置。

## 支持范围与限制

面向桌面端 `www.bilibili.com/video/` 与 `www.bilibili.com/bangumi/play/`。不支持直播、移动端或第三方嵌入播放器。Bilibili 页面更新或其他主题扩展可能影响显示。

去边仅在 Bilibili 宽屏模式启用，不在网页全屏或原生全屏启用。含字幕、复杂边框或无法读取像素时可能保留原画；不修改视频地址，不绕过受保护媒体或访问限制。

当前实测：34 项 Node 测试通过；0.5.3 评论分割线在复现真实 Shadow DOM 的本地浏览器页面中，深色/浅色、组件重建及关闭还原检查通过；0.5.1 的本地生产代码演示中，同意/撤回交互及 28 项页面自检通过。新版浏览器宿主安装与升级待验证；现有 Chrome 0.5.0 在真实 Bilibili 视频页的动态光效、暂停、开关、设置保存、宽屏、网页全屏及推荐视频切换已观察通过。Edge 宿主、原生全屏、番剧、分 P、画中画和真实稳定边框样本尚待专项验证。采样帧率是上限，不构成设备性能保证。

## 隐私与支持

扩展在本机临时处理当前视频画面；主动开启去边时分析低分辨率像素。设置仅保存在 `chrome.storage.local`。没有视频上传、广告、统计或遥测服务，不读取 Cookie 或账号密码。

| 发行渠道 | 发布者 | 支持邮箱 | 隐私政策 |
| --- | --- | --- | --- |
| Chrome Web Store | Deperenn | txim301@gmail.com | [Chrome 版政策](https://tosya301.github.io/ambient-light-for-bilibili/privacy-chrome.html) |
| Microsoft Edge Add-ons | TXIM301 | txim301@outlook.com | [Edge 版政策](https://tosya301.github.io/ambient-light-for-bilibili/privacy-edge.html) |

[项目与政策页面](https://tosya301.github.io/ambient-light-for-bilibili/)

## 开发与测试

```sh
npm test
npm run demo
```

运行后访问 `http://127.0.0.1:8765/demo/` 查看合成视频演示，访问 `/demo/settings.html` 查看设置界面。演示使用与扩展相同的代码，设置仅暂存内存，不代表浏览器宿主注入或商店安装验收。

```text
extension/    可加载的扩展源码与图标
demo/         本地合成视频演示、界面预览及浏览器检查
tests/        Node 测试
docs/         GitHub Pages 项目与隐私政策页面
branding/     图标原图
```

[历史开发记录](CHANGELOG.md)

## 项目说明

灵感来自 [Ambient light for YouTube](https://chromewebstore.google.com/detail/ambient-light-for-youtube/paponcgjfojgemddooebbgniglhkajkj)。本项目独立实现，与 Bilibili 或原扩展作者无隶属或合作关系。

源码已公开供查看，目前尚未指定开源许可证。图标原图保留 AI 生成来源凭证。
