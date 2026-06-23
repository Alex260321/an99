# 100天纪念日 ✦

A romantic, password-protected fireworks page made for our 100-day anniversary.
Pure HTML / CSS / Canvas-2D — no build step, drops straight onto GitHub Pages.

> 默认密码：**`20260321`**

## ✨ 页面有什么

- **密码门** — 输入对的那一天，门才会推开
- **Canvas 烟花引擎**（6 种绽放形态）：peony 牡丹 / chrysanthemum 菊 / willow 垂柳 / ring 圆环 / star 五角星 / **heart 爱心**
- **星空背景** — 闪烁星 + 玫瑰&紫罗兰星云 + 偶尔划过的流星
- 朦胧月亮、漂浮爱心 / 花瓣 / 彩蝶
- 实时计数器：**已携手 X 天 X 时 X 分 X 秒**
- 点击屏幕任意位置 → 在那里炸开一朵随机烟花
- 可选背景音乐：把 mp3 放到 `assets/song.mp3` 后点右下角 ♪

## 🚀 部署到 GitHub Pages

```bash
cd anniversary-100
git init -b main
git add .
git commit -m "100天纪念日"
git remote add origin https://github.com/<your-username>/<repo>.git
git push -u origin main
```

然后到仓库 **Settings → Pages**：
- Source: **Deploy from a branch**
- Branch: **main** / **/ (root)**

等一两分钟，访问 `https://<your-username>.github.io/<repo>/` 即可。

## 🛠 如何定制

| 想改什么 | 改哪里 |
| --- | --- |
| 解锁密码 | `js/main.js` 顶部的 `PASSWORD` |
| 在一起的起始日期 | `js/main.js` 顶部的 `START_DATE` |
| 标题 / 副标题 / 落款 | `index.html` 中的 `.title` `.subtitle` `.line` `.sig` |
| 主题颜色（粉/玫瑰/紫/金…） | `css/style.css` 顶部的 `:root` 变量 |
| 烟花形状 / 配色 | `js/fireworks.js` 中的 `PALETTES` 与 `spawnXxx` |
| 背景音乐 | 放一首 mp3 到 `assets/song.mp3`，在页面右下角点 ♪ |

## 📁 文件结构

```
an99/
├── index.html
├── css/style.css
├── js/fireworks.js          # 烟花粒子引擎
├── js/main.js               # 密码门 + 星空 + 计数器 + 心形雨 + 照片 + 音乐
├── assets/
│   ├── music.mp4            # 背景音乐（任意 mp3/mp4/m4a 都行）
│   └── photos/
│       ├── 1.jpg            # 1~10 顺序播放（jpg/jpeg/png/webp 自动识别）
│       ├── 2.jpg
│       └── ... 10.jpg
└── README.md
```

## 🖼 照片轮播怎么用

在 GitHub 网页上把 1~10 张照片传到 `assets/photos/`，文件名分别是：

```
assets/photos/1.heic     ← iPhone 默认格式
assets/photos/2.jpg
...
assets/photos/10.jpg
```

- 扩展名支持 **`.heic / .heif / .jpg / .jpeg / .png / .webp`**，混用也行（JS 自动探测）。
  - HEIC 在 Chrome/Firefox 上不能原生显示，页面会**自动用 [heic2any](https://github.com/alexcorvi/heic2any)（CDN 加载）转码成 JPEG** 再展示；Safari 直接原生显示。
  - 第一次加载某张 HEIC 大约要 1-2 秒解码（之后会缓存，不再重复）；建议单张 < 5 MB。
- 不必凑齐 10 张，缺哪张 JS 自动跳过。
- 一张 ≈ 7 秒（淡入 1s + 停留 5s + 淡出 1s），按 1→N 循环。
- 大小写敏感（GitHub Pages 不会大小写折叠），iPhone 导出的 `.HEIC`、`.JPG` 也支持。

## 🎵 背景音乐怎么用

把音频文件放在 `assets/`，下面这些路径任选其一（JS 会按顺序找第一个能播的）：

```
assets/music.mp4   ← 推荐 (YouTube 下来的 .mp4 容器直接放，无需转码)
assets/music.mp3
assets/song.mp3
assets/song.m4a
```

如果一个都没找到，会自动 fallback 到一个**隐藏的 YouTube iframe**（视频 ID 写死在 `js/main.js` 的 `YT_VIDEO_ID`），仍然能播——所以即便你不上传文件，页面也有声音。

> 浏览器策略：解锁密码后会**尝试自动播放**，因为表单提交属于用户手势链；如果浏览器仍拦截，点右下角 ♪ 就能播。

## 🔒 密码说明

密码校验在前端纯 JS 里完成（GitHub Pages 是静态站点）。这只是一道软门——任何懂 F12 的人都能在源码里看到密码。它**不是真正的安全机制**，是「我们之间的小仪式」。

---

愿往后每一夜的星空，都有你与我同看。— ♥
