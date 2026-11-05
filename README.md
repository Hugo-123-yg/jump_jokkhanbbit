# 跳一跳

独立的纯静态网页小游戏。无需安装依赖，无需构建，也不需要服务器后端。

## 上传 GitHub 并开启网页

1. 解压文件包，新建一个 GitHub 仓库。
2. 把本文件所在目录内的全部文件和 assets 文件夹上传到仓库根目录，保持文件夹结构。根目录应直接看到 index.html。不要只上传 ZIP 文件。
3. 在仓库 Settings → Pages → Build and deployment 中，将 Source 设为 Deploy from a branch。
4. 选择 main 分支（如果上传到了其他分支，就选择该分支），目录选择 /(root)，点击 Save。
5. 发布完成后，打开 Pages 页面显示的地址即可游玩。

[GitHub Pages 官方说明](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

## 本地预览

电脑解压后可直接打开 index.html。若浏览器限制本地图片加载，可在本目录运行以下命令，然后打开 http://localhost:8000：

    python -m http.server 8000

手机通过发布后的网页地址游玩。

## 操作

- 在左右卡片中选择 HANBBIT 或 JJOK，点击“开始游戏”。
- 按住画面蓄力，松手起跳；电脑也可按住、松开空格键。
- 每次成功落地得 1 分。平台距离随机，大小随分数逐渐缩小。
- 14、41、141、414 分触发礼花与“锐因99”彩蛋。
- 左上角箭头返回角色选择；失败后可重玩或换角色。
- 最高分只保存于当前浏览器。
- 支持触控设备实际提供的压力值；所有设备都可通过按住时长蓄力，震动反馈取决于浏览器支持。

## 文件

- index.html：网页入口。
- main.js：独立页面的启动与恢复。
- jump.js：游戏绘制、动画、交互和角色选择。
- jump-rules.js：蓄力、随机间距、平台尺寸、判定和计分。
- jump-dolls.js：两只角色的图片加载与绘制。
- jump.css：界面和手机适配样式。
- assets/：两张透明角色图片。
- .nojekyll：供 GitHub Pages 直接发布静态文件。
