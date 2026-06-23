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
anniversary-100/
├── index.html
├── css/style.css
├── js/fireworks.js     # 烟花粒子引擎
├── js/main.js          # 密码门 + 星空 + 计数器 + 心形雨 + 音乐
├── assets/             # 可放 song.mp3、照片
└── README.md
```

## 🔒 密码说明

密码校验在前端纯 JS 里完成（GitHub Pages 是静态站点）。这只是一道软门——任何懂 F12 的人都能在源码里看到密码。它**不是真正的安全机制**，是「我们之间的小仪式」。

---

愿往后每一夜的星空，都有你与我同看。— ♥
