# 万象静态博客系统 v1.6

给「批量SEO文章生成」配套的静态博客接收端：写稿工具发一篇 → 这边存下来 → 立刻生成整站 HTML。零依赖，只要有 Node 就能跑。

URL 结构：栏目页 `域名/news/`，文章页 `域名/news/00000001.html`（按栏目 id 分目录），标签页 `域名/rengongzhineng.html`（标签 id 用拼音），搜索页 `域名/search.html?q=关键词`。

前台三套模板可切：资讯 / 美食旅游 / 个人博客，后台点一下就全站换皮。

> 产品名是「万象静态博客系统」。在写稿工具的站点管理里，网站类型仍然选「静态站系统」——那是适配器的类型名，改名会让已绑定的站点失效，所以保持不变。

**接口参数、config 字段、部署与排错，全在 [`使用说明.md`](使用说明.md)，那份比这份全。**

## 跑起来

```bash
cd static-site-system
node server.js          # 默认 8850 端口，改 config.json 的 port 或设 PORT 环境变量
```

- 站点：http://127.0.0.1:8850
- 后台：http://127.0.0.1:8850/admin?token=你 config.json 里的 token
- 产物：`public/` 整个目录丢到任何静态托管（Nginx / OSS / Firebase / Cloudflare Pages）就能上线

## 写稿工具里怎么接

站点管理 → 新建站点：

| 字段 | 填什么 |
|---|---|
| 网站类型 | 静态站系统 |
| 接口地址 | `http://127.0.0.1:8850`（装服务器上就填 `http://服务器IP:8850`） |
| 百度推送 token / 静态站密钥 | `config.json` 里的 `token` |

保存 → 同步栏目 → 测试发布。通了以后，批量生成时选这个站点，文章会一篇篇自动落地并重建页面。

## 目录

```
static-site-system/
├─ server.js            接口 + 静态文件服务 + 后台入口
├─ admin/index.html     后台界面（概览/网站设置/模板/栏目/标签/文章/友链）
├─ config.json          站点设置 + 模板 + 栏目 + 标签 + 友链 + 端口/密钥
├─ lib/build.js         页面生成器（拼页面、sitemap、rss）
├─ lib/templates.js     三套前台模板（资讯 / 美食旅游 / 个人博客）
├─ lib/pinyin.js        汉字转拼音（标签 id 用）
├─ lib/pinyin-dict.json 简体常用字拼音表（7499 字，脱声调）
├─ data/articles.json   文章库（唯一数据源）
├─ 使用说明.md          完整说明书 + 接口参数手册
└─ public/              构建产物（自动生成，可随时删了重建）
```

## 后台能干什么

打开 `http://127.0.0.1:8850/admin?token=你的密钥`，左侧七个入口：

- **概览**：文章数 / 栏目数 / 标签数 / 友链数 / 域名状态，最近发布列表，写稿工具对接参数
- **网站设置**：网站名称、站点副标题、SEO 标题 / 关键词 / 描述、网站域名、统计代码（整段 script 原样插到每页 `</body>` 前）、备案号、品牌色、首页每页条数
- **模板管理**：三套预设模板卡片，点「预览」在新窗口看效果，点「切换到这套」立刻全站换皮（首页/栏目/文章/标签/搜索一起换）
- **栏目管理**：新增 / 修改（可改 id，会连带改文章的栏目归属）/ 删除（栏目下文章保留，显示未分类）
- **标签管理**：新增（填名字会自动算出拼音 id）/ 修改（改名或改 id，改 id 会连带改文章的标签归属）/ 删除（同时从文章上摘掉）
- **文章管理**：搜索、写一篇（支持 HTML 正文、标签逗号隔开）、修改、删除、查看；保存即重建首页/栏目页/标签页/文章页/sitemap/rss
- **友情链接**：添加 / 删除，同时出现在每页页脚与首页侧栏

后台所有写操作都要密钥（`X-Token` 头或 `?token=`），密钥来自 `config.json` 的 `token`。

## 接口

| 方法 | 地址 | 说明 |
|---|---|---|
| GET | `/api/ping` | 探活 |
| GET | `/api/lanmus` | 栏目列表 `{"code":0,"lanmus":[{"id":"news","title":"新闻动态"}]}` |
| GET | `/api/tags` | 标签列表 `{"code":0,"tags":[{"id":"rengongzhineng","title":"人工智能"}]}` |
| GET | `/api/tagid?name=人工智能` | 按名字算标签 id（返回 `rengongzhineng`，重名会自动加 `-2`） |
| POST | `/api/publish` | 发文，JSON：`token / title / seo_title / seo_kw / seo_desc / content / cid / tags`；`tags` 传 `"人工智能,SEO"` 这样的逗号字符串，没建过的标签自动建，返回 `{"code":0,"url":"/news/00000001.html"}` |
| GET | `/api/list?page=1&size=20` | 文章列表 |
| GET | `/api/article?id=00000001` | 单篇详情 |
| POST | `/api/article/save` | 新增或修改文章（带 `id` 就是改），改完立刻重建 |
| POST | `/api/delete` | 删文章，`{"token":"…","id":"00000001"}`，删完全站重建 |
| GET | `/api/settings` | 读站点设置（需密钥） |
| POST | `/api/settings/save` | 存站点设置并全站重建 |
| POST | `/api/lanmu/save` | 新增/修改栏目：`{"id":"news","title":"新闻动态"}`，改就用 `{"oldId":"旧id","id":"新id","title":"…"}` |
| POST | `/api/lanmu/del` | 删栏目 `{"id":"news"}` |
| POST | `/api/tag/save` | 新增/修改标签：`{"id":"rengongzhineng","title":"人工智能"}`，改就用 `{"oldId":"旧id","id":"新id","title":"…"}` |
| POST | `/api/tag/del` | 删标签 `{"id":"rengongzhineng"}`，文章上的这个标签一起去掉 |
| POST | `/api/link/save` | 加友链 `{"title":"…","url":"…"}` |
| POST | `/api/link/del` | 删友链 `{"index":0}` |
| GET | `/api/templates` | 模板列表 + 当前用的哪套（`{"code":0,"current":"news","templates":[…]}`） |
| POST | `/api/template/save` | 切换模板 `{"template":"food"}`，立刻全站重建，写进 `config.json` |
| POST | `/api/rebuild` | 手动全量重建 |

也兼容「自定义接口」那套约定：`GET /?action=lanmus`、`POST /` 直接发 JSON 也能收。

## 生成出来的页面

- `/` 首页（最新文章 + 栏目/最新发布侧栏）
- `/news/` 栏目页，路径就是栏目 id（目录里是 `news/index.html`）
- `/news/00000001.html` 文章页，按栏目 id 分目录存放（面包屑、相关文章、文章标签、Article JSON-LD）
- `/rengongzhineng.html` 标签页，标签 id 直接当文件名
- `/search.html?q=关键词` 站内搜索页（顶部搜索框提交到它）
- `/assets/search-index.json` 搜索索引（标题/正文摘要/标签/栏目/日期），页面靠它纯前端搜
- `/assets/style.css` 样式（品牌色取 `config.json` 的 `brand`）
- `/sitemap.xml`、`/rss.xml`、`/robots.txt`、`/404.html`
- 旧的 `/c/news.html`、`/a/00000001.html` 保留成 302 跳转页（`noindex`），老链接不会断

`/news`（不带尾斜杠）会自动 301 到 `/news/`。放到 Nginx / OSS 上时，注意开启「目录自动找 index.html」和尾斜杠跳转，和本地行为一致。

每页都有独立 title / description / keywords / canonical / og，sitemap 里的域名取 `config.json` 的 `domain`，**上线前把 domain 填成真实域名**（不填会输出相对路径）。

## 栏目

`config.json` 的 `lanmus`：

```json
"lanmus": [
  { "id": "news", "title": "新闻动态" },
  { "id": "tech", "title": "技术笔记" }
]
```

`id` 会进 URL，改动等于换 URL，定下来尽量别改；改名只改 `title`。新增栏目后点后台「重建」即可。

## 标签

`config.json` 的 `tags`，文章上用 `tags` 数组记住归属：

```json
"tags": [
  { "id": "rengongzhineng", "title": "人工智能" },
  { "id": "seo", "title": "SEO" }
]
```

- id 规则：中文取全拼（人工智能 → `rengongzhineng`），英文/数字原样保留（`SEO` → `seo`）；重名自动加 `-2`
- 页面：`域名/标签id.html`，跟栏目页同一套模板（面包屑、标题、共几篇、文章列表、侧栏）
- 发文带标签：接口 `tags` 传 `"人工智能,SEO,工具推荐"`（中英文逗号都认）；没建过的标签会自动建好
- 后台「标签管理」可以增、改（改名或改 id）、删；文章页正文下面会显示标签，首页/栏目页侧栏有标签云

## 搜索

每页右上角有个搜索框，提交到 `/search.html?q=关键词`。

- 搜索是**纯前端**：页面加载 `/assets/search-index.json`，在浏览器里过滤，静态托管（OSS/Cloudflare Pages/Firebase）也能用，不依赖 Node
- 匹配范围：标题、正文摘要（每篇取正文前 500 字）、标签名；多个关键词用空格隔开是「同时包含」
- 命中的词会高亮（`<mark>`），结果最多显示 60 条，超出提示只显示前 60
- 搜索页带 `noindex`，不进 sitemap，`robots.txt` 里也 Disallow 了，不会污染收录
- 文章一改，索引随重建自动更新

## 模板

`config.json` 的 `template` 决定全站长相，三个值：

| key | 名称 | 长相 |
|---|---|---|
| `news` | DeepSeek大肥鱼风格-资讯模板 | 深色导航、头条条带、双列资讯流、热门排行侧栏、文章页带导语条 |
| `food` | DeepSeek大肥鱼风格-美食旅游模板 | 暖色、圆角大片封面、三列卡片墙、无侧栏 |
| `blog` | DeepSeek大肥鱼风格-个人博客模板 | 760px 窄栏、衬线标题、左侧日期列、文末「—— 写于 …」签名 |

- 三套模板都在 `lib/templates.js`，每套只写长相：`item` 列表项、`home` 首页、`sidebar` 侧栏、`post` 内容页、`searchItem` 搜索结果项、`listClass`、`css`
- 首页、栏目页、文章页、标签页、搜索页全部走模板，换模板这五种页面一起变
- 预览：`/preview-news.html`、`/preview-food.html`、`/preview-blog.html`（带 `noindex`，不进 sitemap）
- 想加第四套：在 `LIST` 和 `MAP` 各加一条，后台自动多一张卡