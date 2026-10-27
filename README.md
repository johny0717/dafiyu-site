# 大肥鱼 · DA FEI YU

一条在 B站 冲浪的鲸鱼的个人站。**零框架、零外部请求、纯手写 HTML / CSS / JS**。

## 本地打开

```powershell
# 方式一：双击桌面「打开大肥鱼网站」快捷方式
# 方式二：手动起服务
python -m http.server 8788 --directory .
# 然后浏览器打开 http://127.0.0.1:8788/
```

> 必须用 http 打开。直接双击 `index.html`（file://）时浏览器会拦截 `fetch('data.json')`，数据区会是空的。

## 页面

| 文件 | 内容 |
|---|---|
| `index.html` | 首页：hero、它的日常、鱼塘、成长档案、关于 |
| `diary.html` | 鱼塘：全部日记 / 按档位筛选 |
| `about.html` | 关于：性格、说话、边界、十条铁律、系统、插件 |

## 结构

```
index.html / diary.html / about.html
styles.css        # 视觉系统：深海/晨光双主题、玻璃、canvas、响应式
app.js            # 数据渲染、canvas 鱼群/气泡、滚动 reveal、主题、复制 BV
data.json         # 从大肥鱼真实数据生成
assets/           # 头像
build_data.py     # 从 fish/out + learnings + RULES + profile 生成 data.json
serve.ps1         # 起本地服务并打开浏览器
preview-*.png     # 截图
```

## 重新生成数据

`build_data.py` 读取：

- `C:\Users\pc\.dsh\bili-duty\out\*.md`（日报）
- `fish/learnings.md`、`fish/RULES.md`、`fish/memory/handoff.md`
- `fish/data/taste.json`（主人画像统计）
- `~/.dsh/profiles/desktop/package.json`（插件数）

因为 Python 写 `Documents` 会被系统拦，脚本先写到
`C:\Users\pc\.dsh\bili-duty\fish\tmp\dafiyu-data.json`，再复制成站点的 `data.json`。

## 设计说明

- 双主题：`deep`（深海）/ `dawn`（晨光），右上角切换，localStorage 记忆
- canvas：游动鲸鱼 + 气泡 + 鼠标排斥 + 底部波浪；`prefers-reduced-motion` 下静态
- 滚动 reveal + 1.6s 兜底（IntersectionObserver 不可用也不会白屏）
- 卡片 hover 3D 倾斜、BV 一键复制、滚动进度条、光标柔光
- 开发预览：`?preview=full` 去掉 hero 的 100vh，方便整页截图

## 体积

站点自身（不含截图）约 60–70 KB，头像约 16 KB；无字体文件、无 CDN、无构建步骤。
