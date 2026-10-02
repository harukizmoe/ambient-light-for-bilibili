# Ambient light for Bilibili

为 Bilibili 桌面播放页添加随视频变化的氛围光。基础版本 **0.5.3**，Manifest V3，原生 JavaScript，无构建步骤或运行时依赖。

![扩展图标](extension/icons/128.png)

## 0.5.3.3 稍后再看修复（GitHub 预发布）

当前扩展版本为 `0.5.3.3`，基于 GitHub `v0.5.3.2`（`391ef5f`）。新增 `/list/watchlater/` 详情播放页支持，复用普通点播的光效设置、深色背景、透明组件、宽屏／全屏及可选自动去边。稍后再看队列、分 P 与选中项透光，封面和当前项高亮保留；连续换片、播放器替换、离开和返回时自动处理。

重新加载本目录的 `extension` 后刷新详情播放页即可沿用已有设置。首页按钮打开的迷你浮窗与最终详情播放页是不同页面，本次适配后者。权限和注入域名不变，安装包见 [GitHub Release](https://github.com/tosya301/ambient-light-for-bilibili/releases/tag/v0.5.3.3)。

使用下方本地预览服务器可打开 [稍后再看验证页](http://127.0.0.1:8768/demo/watchlater.html)，开启氛围光后运行点播功能和稍后再看专项自检。该页面使用合成视频及真实组件结构，不是 B 站内容副本。

本次验证：43 项 Node 测试和 47 项本地浏览器检查通过；真实页面已检查路由与组件结构，更新后的扩展注入仍需重新加载后验收。详情见 [QA.txt](QA.txt)。

## 0.5.3.2 直播预览版（基于 0.5.3）

直播适配基线提交 `753b8b2`，已发布扩展版本 `0.5.3.2`，界面标记 `0.5.3 · LIVE 2`。通过 [GitHub Release](https://github.com/tosya301/ambient-light-for-bilibili/releases/tag/v0.5.3.2) 提供源码与安装包，保留预发布标记。

直播复用原有 256px 低分辨率采样、帧率上限和过渡平滑，将光投射到导航、标题、聊天区和礼物栏背后。只调整底板，不改变视频、头像、勋章、礼物图或聊天内容。直播保留完整画面，自动去边仍仅用于点播宽屏。

- 支持 `https://live.bilibili.com/数字房间号`；首页、分区和活动页不启用。
- 只取 `#live-player` 中可见的视频，排除礼物和预览播放器；换清晰度或重建播放器后自动重新绑定。
- 暂停保留光色并停绘，隐藏页面停绘；视频结束/移除时恢复底板，重连后继续。
- 网页全屏检测实际固定布局；原生容器全屏沿用原逻辑。画面铺满窗口时没有外侧投光空间，会待机。
- 保留 0.5.3 设置与同意门禁。权限仍仅 `storage`，内容脚本新增直播域名。
- SC 轮播底板、下方动态与直播卡片、公告／荣誉／简介区域透明；保留金额标签、图片和操作菜单，修正深色公告文字。

本地预览：`python3 -m http.server 8768 --bind 127.0.0.1`，打开 [合成直播演示](http://127.0.0.1:8768/demo/live.html)。首次点击右下角“氛围光”并开启；选择“绚彩”，扩散设为 400%，可观察接近参考图的整页效果。演示使用真实生产脚本与持续变化的合成视频，不代表真实 CDN/浏览器扩展注入验收。

本地安装：加载本目录的 `extension` 文件夹。若另有旧版扩展启用，测试时先禁用旧版，避免两份脚本同时运行。刷新直播页后开启氛围光。回退时禁用此实验版，恢复旧版并刷新。

已安装本地实验版：替换原加载目录内的文件，重新加载扩展，再刷新直播页。SC 与下方卡片的静态样式验证页为 [live-surfaces.html](http://127.0.0.1:8768/demo/live-surfaces.html)。

验证证据与尚未验证项见 [QA.txt](QA.txt)。

## 功能

- 随视频画面变化的柔和光效，提供柔和、影院、绚彩三个预设。
- 调整强度、30–400% 扩散、柔化、饱和度、平滑和 8–30 fps 采样上限。
- 设置面板中的山峦预览随参数变化；支持可切换的深色页面背景。
- 宽屏模式可选上下黑边、左右黑边、纯色边框识别及等比例填充，四项默认关闭。
- 所有视频处理在本机完成，设置保存于浏览器本地。

## 安装与使用

下载 [GitHub 0.5.3.3 稍后再看修复版](https://github.com/tosya301/ambient-light-for-bilibili/releases/tag/v0.5.3.3)的 `Ambient-light-for-Bilibili-0.5.3.3.zip`，解压后可本地加载。包含此前的点播、数字直播间适配及透明界面修复。Chrome Web Store 与 Microsoft Edge Add-ons 的 0.5.2 已于 2026-10-01 提交审核；本次只更新 GitHub，未重新提交商店。

本地安装：下载本仓库，在浏览器扩展管理页打开开发者模式，选择“加载已解压的扩展”，加载 **extension** 文件夹，然后刷新 Bilibili 播放页面。

点击页面右下角的“氛围光”或工具栏扩展图标打开设置，阅读本地处理说明并明确同意后才会开启。可在“更多”撤回同意并停止处理。默认快捷键为 **Alt+Shift+A**；可在浏览器的扩展快捷键设置中调整。更新时替换同一目录内的文件，再重新加载扩展并刷新页面，以保留扩展 ID 和设置。

## 支持范围与限制

面向桌面端 `www.bilibili.com/video/`、`www.bilibili.com/bangumi/play/`；0.5.3.3 增加 `www.bilibili.com/list/watchlater/` 详情播放页。直播为预览支持；不支持移动端或第三方嵌入播放器。Bilibili 页面更新或其他主题扩展可能影响显示。

去边仅在 Bilibili 宽屏模式启用，不在网页全屏或原生全屏启用。含字幕、复杂边框或无法读取像素时可能保留原画；不修改视频地址，不绕过受保护媒体或访问限制。

历史验证（0.5.3.2）：39 项 Node 测试通过；直播适配阶段完成 28 项本地点播与 19 项本地合成直播浏览器检查，0.5.3.2 另验证 SC、下方卡片透光、深浅色和关闭还原。真实直播页已检查组件结构，用户确认本地版本可用；这些记录不代表已完成全部浏览器宿主场景验收。Edge 宿主、原生全屏、清晰度切换、其他房间皮肤及实际设备性能仍待专项验证。详见 [QA.txt](QA.txt)。

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
