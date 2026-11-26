// 三套前台模板。每套只管「长相」，数据、URL、SEO 都由 build.js 统一处理。
// 函数签名统一为 (ctx, conf, ...)，ctx 是 build.js 传进来的小工具集。

const LIST = [
  {
    key: 'news',
    name: 'DeepSeek大肥鱼风格-资讯模板',
    desc: '深色导航 + 头条区 + 双列资讯流，信息密度高，适合新闻、科技、行业资讯站。',
  },
  {
    key: 'food',
    name: 'DeepSeek大肥鱼风格-美食旅游模板',
    desc: '暖色调、大圆角卡片墙、渐变封面，适合美食探店、旅游攻略、生活方式站。',
  },
  {
    key: 'blog',
    name: 'DeepSeek大肥鱼风格-个人博客模板',
    desc: '窄栏居中、衬线标题、左侧日期，安静克制，适合个人随笔、技术博客。',
  },
];

// ---------------- 资讯 ----------------
const news = {
  key: 'news',
  listClass: 'nw-grid',
  css: `
.tpl-news{--bg:#f1f3f8;--card:#fff;--line:#e3e7ef;--ink:#161c28;--ink2:#55606f;--ink3:#8d97a6;--head:#0b1220;--accent:#1d4ed8}
.tpl-news .top{background:var(--head);border-bottom:0;position:sticky;top:0}
.tpl-news .top .wrap{height:66px;max-width:1180px}
.tpl-news .logo{color:#fff;font-size:20px;letter-spacing:.3px}
.tpl-news .nav{color:#9fb0c9;gap:20px}
.tpl-news .nav a{color:#a8b6cb}
.tpl-news .nav a:hover{color:#fff}
.tpl-news .searchf input{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.18);color:#fff}
.tpl-news .searchf input::placeholder{color:#8e9cb3}
.tpl-news .searchf button{background:transparent;border-color:rgba(255,255,255,.18);color:#cdd8e8}
.tpl-news .wrap{max-width:1180px}
.tpl-news .hero{padding:30px 0 6px}
.tpl-news .hero h1{font-size:26px;letter-spacing:.5px}
.tpl-news .hero p{color:var(--ink2);font-size:14.5px}
.tpl-news .nw-top{display:flex;align-items:center;gap:10px;background:#fff;border-left:4px solid var(--accent);border-radius:10px;padding:16px 22px;margin:18px 0 0;box-shadow:0 1px 2px rgba(16,24,40,.04)}
.tpl-news .nw-top .tagline{font-size:12px;font-weight:700;color:#fff;background:var(--accent);padding:3px 9px;border-radius:4px;letter-spacing:1px;white-space:nowrap}
.tpl-news .nw-top h2{margin:0;font-size:20px;line-height:1.5}
.tpl-news .nw-top h2 a{color:var(--ink)}
.tpl-news .nw-top p{margin:6px 0 0;color:var(--ink2);font-size:14px}
.tpl-news .grid{grid-template-columns:1fr 288px;gap:26px;padding:22px 0 46px}
.tpl-news .nw-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.tpl-news .nw-item{background:#fff;border:1px solid var(--line);border-radius:10px;padding:16px 18px;transition:.15s}
.tpl-news .nw-item:hover{border-color:#c3d1ef;box-shadow:0 6px 18px rgba(16,24,40,.06)}
.tpl-news .nw-item h3{margin:0 0 7px;font-size:17px;line-height:1.55;font-weight:650}
.tpl-news .nw-item h3 a{color:var(--ink)}
.tpl-news .nw-item h3 a:hover{color:var(--accent)}
.tpl-news .nw-item p{margin:0 0 10px;color:var(--ink2);font-size:13.5px;line-height:1.7}
.tpl-news .nw-item .meta{font-size:12.5px;color:var(--ink3);display:flex;gap:12px}
.tpl-news .nw-item .meta .cat{color:var(--accent);font-weight:600}
.tpl-news .side{top:96px}
.tpl-news .box{border-radius:10px;border-color:var(--line);padding:16px 18px}
.tpl-news .box h3{font-size:14px;letter-spacing:.5px;padding-bottom:8px;border-bottom:1px solid var(--line);margin-bottom:12px}
.tpl-news .box .rank{display:flex;gap:8px;padding:4px 0;font-size:13.8px;line-height:1.6}
.tpl-news .box .rank i{font-style:normal;color:#b9c2d0;font-weight:700;font-size:12px;flex:0 0 16px}
.tpl-news .box .rank:nth-child(-n+3) a{color:var(--ink);font-weight:600}
.tpl-news .box .rank a{color:var(--ink2)}
.tpl-news .post{border-radius:10px;padding:34px 40px;margin-top:20px}
.tpl-news .post h1{font-size:28px;line-height:1.45}
.tpl-news .post .lead{background:#f7f9fe;border-left:3px solid var(--accent);padding:12px 16px;color:var(--ink2);font-size:14px;margin:14px 0 22px;border-radius:0 6px 6px 0}
.tpl-news .post .body{font-size:16.5px;line-height:1.95}
.tpl-news .rel{border-radius:10px}
.tpl-news .rel a{color:var(--ink2)}
.tpl-news .foot{margin-top:26px}
`,
  item(ctx, conf, a, lm, tg) {
    return `<div class="nw-item">
      <h3><a href="${ctx.esc(ctx.postPath(conf, a))}">${ctx.esc(a.seo_title || a.title)}</a></h3>
      <p>${ctx.esc(ctx.excerpt(a.content, 110))}…</p>
      <div class="meta"><span class="cat">${ctx.esc(lm.title)}</span><span>${ctx.fmt(a.created)}</span>${tg.length ? `<span>${ctx.esc(tg.map((t) => t.title).join(' / '))}</span>` : ''}</div>
    </div>`;
  },
  home(ctx, conf, sorted) {
    const list = sorted.slice(0, conf.per_page || 20);
    const head = list[0];
    const rest = list.slice(1);
    const top = head
      ? `<div class="nw-top"><span class="tagline">头条</span><div><h2><a href="${ctx.esc(ctx.postPath(conf, head))}">${ctx.esc(head.seo_title || head.title)}</a></h2><p>${ctx.esc(ctx.excerpt(head.content, 120))}…</p></div></div>`
      : '';
    return `<div class="wrap"><div class="hero"><h1>${ctx.esc(conf.site_name)}</h1><p>${ctx.esc(conf.site_desc)}</p></div>
    ${top}
    <div class="grid"><main class="nw-grid">${rest.length ? rest.map((a) => this.item(ctx, conf, a, ctx.lanmuOf(conf, a.cid), ctx.tagsOf(conf, a))).join('') : '<div class="nw-item"><p style="margin:0;color:#999">还没有文章，去写稿工具里发一篇试试。</p></div>'}</main>
    ${this.sidebar(ctx, conf, sorted)}</div></div>`;
  },
  sidebar(ctx, conf, sorted) {
    const counts = {};
    for (const a of sorted) counts[a.cid] = (counts[a.cid] || 0) + 1;
    const cats = (conf.lanmus || [])
      .map((l) => `<a class="tag" href="${ctx.esc(ctx.catPath(conf, l.id))}">${ctx.esc(l.title)} ${counts[l.id] || 0}</a>`)
      .join('');
    const rank = sorted
      .slice(0, 6)
      .map((a, i) => `<div class="rank"><i>${i + 1}</i><a href="${ctx.esc(ctx.postPath(conf, a))}">${ctx.esc(a.seo_title || a.title)}</a></div>`)
      .join('');
    const tags = (conf.tags || []).length
      ? `<div class="box"><h3>标签</h3>${conf.tags.map((t) => `<a class="tag" href="${ctx.esc(ctx.tagPath(t.id))}">${ctx.esc(t.title)}</a>`).join('')}</div>`
      : '';
    return `<aside class="side">
      <div class="box"><h3>栏目</h3>${cats || '<span style="color:#999">暂无栏目</span>'}</div>
      <div class="box"><h3>热门阅读</h3>${rank || '<span style="color:#999">还没有文章</span>'}</div>
      ${tags}
    </aside>`;
  },
  post(ctx, conf, a, lm, tg, related) {
    return `<div class="wrap">
    <div class="crumb"><a href="/">首页</a> / <a href="${ctx.esc(ctx.catPath(conf, a.cid))}">${ctx.esc(lm.title)}</a> / 正文</div>
    <article class="post">
      <h1>${ctx.esc(a.title)}</h1>
      <div class="meta"><span>${ctx.esc(lm.title)}</span><span>${ctx.fmtFull(a.created)}</span>${tg.length ? `<span>${ctx.esc(tg.map((t) => t.title).join(' / '))}</span>` : ''}</div>
      <div class="lead">${ctx.esc(a.seo_desc || ctx.excerpt(a.content, 120))}…</div>
      <div class="body">${a.content || ''}</div>
      ${tg.length ? `<div class="tags">标签：${tg.map((t) => `<a class="tag" href="${ctx.esc(ctx.tagPath(t.id))}">${ctx.esc(t.title)}</a>`).join('')}</div>` : ''}
    </article>
    ${related.length ? `<div class="rel"><h3>${ctx.esc(lm.title)} · 相关文章</h3>${related.map((x) => `<a href="${ctx.esc(ctx.postPath(conf, x))}">${ctx.esc(x.seo_title || x.title)}</a>`).join('')}</div>` : ''}
    </div>`;
  },
  searchItem:
    '<div class="nw-item"><h3><a href="{url}">{title}</a></h3><p>{ex}…</p><div class="meta"><span class="cat">{cat}</span><span>{date}</span></div></div>',
};

// ---------------- 美食旅游 ----------------
const food = {
  key: 'food',
  listClass: 'fd-grid',
  css: `
.tpl-food{--bg:#fffaf3;--card:#fff;--line:#f0e2d3;--ink:#3a2c25;--ink2:#7d6455;--ink3:#a99283;--head:#fff8ef;--accent:#e2603b;--soft:#fdeee3}
.tpl-food .top{background:var(--head);border-bottom:1px solid var(--line)}
.tpl-food .top .wrap{height:74px;max-width:1140px}
.tpl-food .logo{color:#5a3b28;font-family:Georgia,"Songti SC","STSong",serif;font-size:24px;letter-spacing:.5px}
.tpl-food .nav{gap:8px}
.tpl-food .nav a{color:#8a6f5d;padding:6px 13px;border-radius:999px;background:#fff;border:1px solid var(--line);font-size:13px}
.tpl-food .nav a:hover{background:var(--accent);border-color:var(--accent);color:#fff}
.tpl-food .searchf input{border-radius:999px;border-color:#ecd9c8;background:#fff}
.tpl-food .searchf button{border-radius:999px;background:var(--accent);border-color:var(--accent);color:#fff}
.tpl-food .wrap{max-width:1140px}
.tpl-food .hero{margin:26px 0 8px;background:linear-gradient(120deg,#ffe9d6,#fff6ec 55%,#f4f7ff);border:1px solid #f3dfcc;border-radius:20px;padding:34px 38px;position:relative;overflow:hidden}
.tpl-food .hero h1{font-family:Georgia,"Songti SC",serif;font-size:32px;color:#4a3122;margin:0 0 10px}
.tpl-food .hero p{color:#8a6a56;font-size:15px}
.tpl-food .hero .chips{margin-top:14px;display:flex;gap:8px;flex-wrap:wrap}
.tpl-food .hero .chips span{background:#fff;border:1px solid #f0dcc8;color:#a9755a;border-radius:999px;padding:4px 12px;font-size:12.5px}
.tpl-food .grid{grid-template-columns:1fr;padding:10px 0 50px}
.tpl-food .fd-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:22px}
.tpl-food .fd-card{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;transition:.2s;display:flex;flex-direction:column}
.tpl-food .fd-card:hover{transform:translateY(-3px);box-shadow:0 14px 30px rgba(180,120,80,.14)}
.tpl-food .fd-cover{height:118px;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:34px;color:#fff;letter-spacing:2px;background:linear-gradient(135deg,#f2a074,#e2603b)}
.tpl-food .fd-cover.c2{background:linear-gradient(135deg,#f2c27a,#d99442)}
.tpl-food .fd-cover.c3{background:linear-gradient(135deg,#8fc7a7,#4f9b76)}
.tpl-food .fd-cover.c4{background:linear-gradient(135deg,#9bb6e0,#5c7fb5)}
.tpl-food .fd-body{padding:16px 18px 18px;display:flex;flex-direction:column;gap:8px;flex:1}
.tpl-food .fd-card h3{margin:0;font-size:17px;line-height:1.55;font-family:Georgia,"Songti SC",serif;font-weight:600}
.tpl-food .fd-card h3 a{color:#3f2d22}
.tpl-food .fd-card p{margin:0;color:var(--ink2);font-size:13.5px;line-height:1.75;flex:1}
.tpl-food .fd-foot{font-size:12.5px;color:var(--ink3);display:flex;justify-content:space-between;align-items:center;border-top:1px dashed #f0e0cf;padding-top:10px;margin-top:4px}
.tpl-food .fd-foot .more{color:var(--accent);font-weight:600}
.tpl-food .post{border-radius:18px;padding:0;overflow:hidden}
.tpl-food .post .cover{height:150px;display:flex;align-items:center;justify-content:center;font-family:Georgia,serif;font-size:30px;letter-spacing:3px;color:#fff;background:linear-gradient(135deg,#f2a074,#e2603b)}
.tpl-food .post-inner{padding:30px 38px 36px}
.tpl-food .post h1{font-family:Georgia,"Songti SC",serif;font-size:30px;line-height:1.4}
.tpl-food .post .meta{border-bottom:1px dashed #f0e0cf}
.tpl-food .post .body{font-size:16.5px;line-height:2.05;color:#463427}
.tpl-food .post .tags .tag{background:var(--soft);color:#c2552f}
.tpl-food .rel{border-radius:16px;background:#fffdf9}
.tpl-food .box{border-radius:16px;background:#fffdf9}
.tpl-food .foot{background:#fffdf9}
@media(max-width:980px){.tpl-food .fd-grid{grid-template-columns:1fr 1fr}}
`,
  item(ctx, conf, a, lm, tg) {
    const glyph = (lm.title || '食').slice(0, 1);
    const tone = ['', 'c2', 'c3', 'c4'][Math.abs(hash(a.cid)) % 4];
    return `<div class="fd-card">
      <a class="fd-cover ${tone}" href="${ctx.esc(ctx.postPath(conf, a))}">${ctx.esc(glyph)}</a>
      <div class="fd-body">
        <h3><a href="${ctx.esc(ctx.postPath(conf, a))}">${ctx.esc(a.seo_title || a.title)}</a></h3>
        <p>${ctx.esc(ctx.excerpt(a.content, 90))}…</p>
        <div class="fd-foot"><span>${ctx.esc(lm.title)} · ${ctx.fmt(a.created)}</span><a class="more" href="${ctx.esc(ctx.postPath(conf, a))}">阅读全文 →</a></div>
      </div>
    </div>`;
  },
  home(ctx, conf, sorted) {
    const list = sorted.slice(0, conf.per_page || 20);
    const chips = (conf.lanmus || []).map((l) => `<span>${ctx.esc(l.title)}</span>`).join('');
    return `<div class="wrap">
      <div class="hero"><h1>${ctx.esc(conf.site_name)}</h1><p>${ctx.esc(conf.site_desc)}</p><div class="chips">${chips}</div></div>
      <div class="grid"><main class="fd-grid">${list.length ? list.map((a) => this.item(ctx, conf, a, ctx.lanmuOf(conf, a.cid), ctx.tagsOf(conf, a))).join('') : '<div class="fd-card"><div class="fd-body"><p style="margin:0;color:#999">还没有文章，发一篇试试。</p></div></div>'}</main></div>
    </div>`;
  },
  sidebar() {
    return '';
  },
  post(ctx, conf, a, lm, tg, related) {
    return `<div class="wrap">
    <div class="crumb"><a href="/">首页</a> / <a href="${ctx.esc(ctx.catPath(conf, a.cid))}">${ctx.esc(lm.title)}</a> / 正文</div>
    <article class="post">
      <div class="cover">${ctx.esc(lm.title)}</div>
      <div class="post-inner">
        <h1>${ctx.esc(a.title)}</h1>
        <div class="meta"><span>${ctx.esc(lm.title)}</span><span>${ctx.fmtFull(a.created)}</span>${tg.length ? `<span>${ctx.esc(tg.map((t) => t.title).join(' / '))}</span>` : ''}</div>
        <div class="body">${a.content || ''}</div>
        ${tg.length ? `<div class="tags">本篇标签：${tg.map((t) => `<a class="tag" href="${ctx.esc(ctx.tagPath(t.id))}">${ctx.esc(t.title)}</a>`).join('')}</div>` : ''}
      </div>
    </article>
    ${related.length ? `<div class="rel"><h3>同类推荐</h3>${related.map((x) => `<a href="${ctx.esc(ctx.postPath(conf, x))}">${ctx.esc(x.seo_title || x.title)}</a>`).join('')}</div>` : ''}
    </div>`;
  },
  searchItem:
    '<div class="fd-card"><div class="fd-body"><h3><a href="{url}">{title}</a></h3><p>{ex}…</p><div class="fd-foot"><span>{cat} · {date}</span></div></div></div>',
};

// ---------------- 个人博客 ----------------
const blog = {
  key: 'blog',
  listClass: 'bl-list',
  css: `
.tpl-blog{--bg:#fdfdfb;--card:#fff;--line:#e8e6e1;--ink:#242322;--ink2:#6b6862;--ink3:#9a968f;--head:#fdfdfb;--accent:#2f6f5e}
.tpl-blog .top{background:var(--head);border-bottom:1px solid var(--line)}
.tpl-blog .top .wrap{height:76px;max-width:760px}
.tpl-blog .logo{color:#1f1e1d;font-family:Georgia,"Songti SC",serif;font-size:21px;font-weight:600;letter-spacing:1px}
.tpl-blog .nav{gap:18px;font-size:13px}
.tpl-blog .nav a{color:#7b7770}
.tpl-blog .searchf input{width:130px;border-radius:3px;border-color:#e2dfd9;background:#fff}
.tpl-blog .searchf button{border-radius:3px;background:#fff}
.tpl-blog .wrap{max-width:760px}
.tpl-blog .hero{padding:52px 0 20px;text-align:left}
.tpl-blog .hero h1{font-family:Georgia,"Songti SC",serif;font-size:34px;font-weight:600;letter-spacing:.5px}
.tpl-blog .hero p{color:var(--ink2);font-size:14px;letter-spacing:.5px}
.tpl-blog .hero .line{height:1px;background:var(--line);margin-top:22px}
.tpl-blog .grid{grid-template-columns:1fr;padding:10px 0 50px}
.tpl-blog .bl-list{display:flex;flex-direction:column}
.tpl-blog .bl-row{display:grid;grid-template-columns:86px 1fr;gap:18px;padding:22px 0;border-bottom:1px solid var(--line)}
.tpl-blog .bl-date{font-size:12px;color:var(--ink3);letter-spacing:1.5px;text-transform:uppercase;padding-top:4px}
.tpl-blog .bl-date b{display:block;font-size:20px;color:var(--ink2);letter-spacing:0;font-family:Georgia,serif;font-weight:500}
.tpl-blog .bl-row h3{margin:0 0 6px;font-size:19px;line-height:1.6;font-family:Georgia,"Songti SC",serif;font-weight:600}
.tpl-blog .bl-row h3 a{color:var(--ink)}
.tpl-blog .bl-row h3 a:hover{color:var(--accent)}
.tpl-blog .bl-row p{margin:0 0 8px;color:var(--ink2);font-size:14.2px;line-height:1.85}
.tpl-blog .bl-row .meta{font-size:12.5px;color:var(--ink3);display:flex;gap:12px}
.tpl-blog .bl-row .meta a{color:var(--accent)}
.tpl-blog .post{background:transparent;border:0;border-radius:0;padding:34px 0 0}
.tpl-blog .post h1{font-family:Georgia,"Songti SC",serif;font-size:31px;line-height:1.5;font-weight:600;text-align:left}
.tpl-blog .post .meta{border-bottom:1px solid var(--line);padding-bottom:14px;color:var(--ink3)}
.tpl-blog .post .body{font-size:16.5px;line-height:2.05;color:#302e2b}
.tpl-blog .post .body p{margin:0 0 20px}
.tpl-blog .post .tags{border-top:1px solid var(--line);color:var(--ink3)}
.tpl-blog .post .tags .tag{background:#f3f5f3;color:var(--accent)}
.tpl-blog .sign{text-align:right;color:var(--ink3);font-size:13px;margin:26px 0 0;font-family:Georgia,serif;font-style:italic}
.tpl-blog .rel{background:#fff;border:1px solid var(--line);border-radius:4px}
.tpl-blog .foot{background:transparent;border-top:1px solid var(--line);text-align:left}
.tpl-blog .foot .wrap{max-width:760px}
.tpl-blog .box{border-radius:4px}
`,
  item(ctx, conf, a, lm, tg) {
    const d = new Date(a.created || Date.now());
    const p = (x) => String(x).padStart(2, '0');
    return `<div class="bl-row">
      <div class="bl-date">${d.getFullYear()}.${p(d.getMonth() + 1)}<b>${p(d.getDate())}</b></div>
      <div>
        <h3><a href="${ctx.esc(ctx.postPath(conf, a))}">${ctx.esc(a.seo_title || a.title)}</a></h3>
        <p>${ctx.esc(ctx.excerpt(a.content, 120))}…</p>
        <div class="meta"><a href="${ctx.esc(ctx.catPath(conf, a.cid))}">${ctx.esc(lm.title)}</a>${tg.map((t) => `<a href="${ctx.esc(ctx.tagPath(t.id))}">#${ctx.esc(t.title)}</a>`).join('')}</div>
      </div>
    </div>`;
  },
  home(ctx, conf, sorted) {
    const list = sorted.slice(0, conf.per_page || 20);
    return `<div class="wrap">
      <div class="hero"><h1>${ctx.esc(conf.site_name)}</h1><p>${ctx.esc(conf.site_desc)}</p><div class="line"></div></div>
      <div class="grid"><main class="bl-list">${list.length ? list.map((a) => this.item(ctx, conf, a, ctx.lanmuOf(conf, a.cid), ctx.tagsOf(conf, a))).join('') : '<p style="color:#999">还没有文章。</p>'}</main></div>
    </div>`;
  },
  sidebar() {
    return '';
  },
  post(ctx, conf, a, lm, tg, related) {
    return `<div class="wrap">
    <div class="crumb"><a href="/">首页</a> / <a href="${ctx.esc(ctx.catPath(conf, a.cid))}">${ctx.esc(lm.title)}</a> / 正文</div>
    <article class="post">
      <h1>${ctx.esc(a.title)}</h1>
      <div class="meta"><span>${ctx.fmtFull(a.created)}</span><span><a href="${ctx.esc(ctx.catPath(conf, a.cid))}">${ctx.esc(lm.title)}</a></span></div>
      <div class="body">${a.content || ''}</div>
      ${tg.length ? `<div class="tags">${tg.map((t) => `<a class="tag" href="${ctx.esc(ctx.tagPath(t.id))}">#${ctx.esc(t.title)}</a>`).join('')}</div>` : ''}
      <div class="sign">—— 写于 ${ctx.fmt(a.created)}，${ctx.esc(conf.site_name)}</div>
    </article>
    ${related.length ? `<div class="rel"><h3>接着读</h3>${related.map((x) => `<a href="${ctx.esc(ctx.postPath(conf, x))}">${ctx.esc(x.seo_title || x.title)}</a>`).join('')}</div>` : ''}
    </div>`;
  },
  searchItem:
    '<div class="bl-row"><div><h3><a href="{url}">{title}</a></h3><p>{ex}…</p><div class="meta"><span>{cat}</span><span>{date}</span></div></div></div>',
};

function hash(s) {
  let n = 0;
  for (const c of String(s)) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return n;
}

const MAP = { news, food, blog };

function get(key) {
  return MAP[key] || MAP.news;
}

module.exports = { LIST, MAP, get };
