// 静态站构建器：读 data/articles.json → 生成 public/ 全站 HTML + sitemap + rss
// 只依赖 Node 内置模块，Windows / Linux 都能直接跑
const fs = require('fs');
const path = require('path');
const tplLib = require('./templates');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'public');

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function strip(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function excerpt(html, n) {
  return strip(html).slice(0, n || 150);
}
function fmt(ts) {
  const d = new Date(ts || Date.now());
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function fmtFull(ts) {
  const d = new Date(ts || Date.now());
  const p = (x) => String(x).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
// 栏目 id 直接进 URL：/news/ 、 /news/00000001.html
function slug(s) {
  return (
    String(s == null ? '' : s)
      .trim()
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'lanmu'
  );
}
function catPath(conf, cid) {
  return '/' + slug(cid) + '/';
}
function postPath(conf, a) {
  return '/' + slug(a.cid) + '/' + a.id + '.html';
}
// 标签页：域名/标签id.html（标签 id 是拼音，如 rengongzhineng.html）
function tagPath(id) {
  return '/' + slug(id) + '.html';
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
function writeFile(rel, content) {
  const p = path.join(OUT, rel);
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, content, 'utf8');
}

const CSS = (brand) => `
:root{color-scheme:light;--bg:#f5f7fa;--card:#fff;--line:#e6e9f0;--ink:#1f2430;--ink2:#5b6472;--ink3:#8b95a5;--brand:${brand || '#1d4ed8'};--soft:#eff4ff}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.75 -apple-system,BlinkMacSystemFont,"Segoe UI","Microsoft YaHei",sans-serif}
a{color:var(--ink);text-decoration:none}
a:hover{color:var(--brand)}
.wrap{max-width:1080px;margin:0 auto;padding:0 18px}
.top{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20}
.top .wrap{display:flex;align-items:center;gap:18px;height:62px}
.logo{font-weight:700;font-size:19px;color:var(--brand);white-space:nowrap}
.nav{display:flex;gap:16px;overflow:auto;font-size:14px;color:var(--ink2);margin-left:auto}
.nav a{color:var(--ink2)}
.nav a:hover{color:var(--brand)}
.searchf{margin-left:16px;display:flex;align-items:center;gap:6px}
.searchf input{border:1px solid var(--line);border-radius:999px;padding:6px 12px;font-size:13px;width:150px;outline:none;background:#fff;color:var(--ink);font-family:inherit}
.searchf input:focus{border-color:var(--brand)}
.searchf button{border:1px solid var(--line);background:#fff;border-radius:999px;padding:6px 12px;font-size:13px;cursor:pointer;color:var(--ink2);font-family:inherit}
.searchf button:hover{border-color:var(--brand);color:var(--brand)}
.item h2 mark,.item p mark,.nw-item mark,.fd-card mark,.bl-row mark{background:#fff3bf;color:inherit;padding:0 1px;border-radius:2px}
.searchtip{color:var(--ink3);font-size:13px}
.hero{padding:34px 0 10px}
.hero h1{font-size:28px;margin:0 0 8px}
.hero p{color:var(--ink2);margin:0}
.grid{display:grid;grid-template-columns:1fr 260px;gap:22px;align-items:start;padding:22px 0 44px}
.list{display:flex;flex-direction:column;gap:14px}
.item{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:18px 20px}
.item h2{font-size:18px;margin:0 0 8px;font-weight:650}
.item h2 a{color:var(--ink)}
.item p{margin:0 0 10px;color:var(--ink2);font-size:14.5px}
.meta{font-size:13px;color:var(--ink3);display:flex;gap:14px;flex-wrap:wrap}
.side{position:sticky;top:82px;display:flex;flex-direction:column;gap:16px}
.box{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:16px 18px}
.box h3{font-size:15px;margin:0 0 10px}
.box .tag{display:inline-block;margin:0 6px 6px 0;padding:3px 10px;border-radius:999px;background:var(--soft);color:var(--brand);font-size:13px}
.crumb{font-size:13px;color:var(--ink3);padding:16px 0 0}
.crumb a{color:var(--ink3)}
.post{background:#fff;border:1px solid var(--line);border-radius:14px;padding:30px 34px;margin:14px 0 0}
.post h1{font-size:26px;line-height:1.45;margin:0 0 12px}
.post .meta{border-bottom:1px solid var(--line);padding-bottom:12px;margin-bottom:18px}
.post .body{font-size:16px;line-height:1.9;word-break:break-word}
.post .body img{max-width:100%;height:auto;border-radius:8px}
.post .body h2,.post .body h3{margin:26px 0 10px}
.post .body p{margin:0 0 16px}
.rel{background:#fff;border:1px solid var(--line);border-radius:14px;padding:20px 24px;margin:18px 0 40px}
.rel h3{font-size:15px;margin:0 0 12px}
.rel a{display:block;padding:5px 0;color:var(--ink2);font-size:14.5px}
.post .tags{margin-top:26px;padding-top:16px;border-top:1px solid var(--line);font-size:14px;color:var(--ink3)}
.post .tags .tag{display:inline-block;margin:6px 8px 0 0;padding:3px 12px;border-radius:999px;background:var(--soft);color:var(--brand);font-size:13px}
.card-tags{font-size:13px;color:var(--ink3);display:flex;gap:10px;flex-wrap:wrap}
.card-tags a{color:var(--brand);background:var(--soft);border-radius:999px;padding:2px 9px}
.foot{border-top:1px solid var(--line);background:#fff;padding:22px 0;color:var(--ink3);font-size:13px;text-align:center;margin-top:20px}
.foot a{color:var(--ink3)}
.foot .flinks{margin-bottom:8px}
.foot .flinks a{margin:0 8px;color:var(--ink2)}
.foot .icp{margin-top:6px}
@media(max-width:860px){.grid{grid-template-columns:1fr}.side{position:static;order:-1}.post{padding:22px 18px}.hero h1{font-size:23px}.top .wrap{height:auto;flex-wrap:wrap;padding:10px 18px;gap:8px}.nav{margin-left:0;width:100%}.searchf{margin-left:0;width:100%}.searchf input{flex:1;width:auto}}
`;

function tplOf(conf) {
  return tplLib.get(conf.template);
}

function header(conf) {
  const links = (conf.lanmus || [])
    .map((l) => `<a href="/${esc(slug(l.id))}/">${esc(l.title)}</a>`)
    .join('');
  return `<header class="top"><div class="wrap">
    <a class="logo" href="/">${esc(conf.site_name)}</a>
    <nav class="nav">${links}</nav>
    <form class="searchf" action="/search.html" method="get">
      <input type="text" name="q" placeholder="搜文章" autocomplete="off">
      <button type="submit">搜索</button>
    </form>
  </div></header>`;
}

function footer(conf) {
  const year = new Date().getFullYear();
  const links = (conf.links || []).length
    ? `<div class="flinks">友情链接：${conf.links
        .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="nofollow noopener">${esc(l.title)}</a>`)
        .join('')}</div>`
    : '';
  const icp = conf.icp
    ? `<div class="icp"><a href="https://beian.miit.gov.cn" target="_blank" rel="nofollow noopener">${esc(conf.icp)}</a></div>`
    : '';
  return `<footer class="foot"><div class="wrap">${links}<div>© ${year} ${esc(conf.site_name)}　·　<a href="/sitemap.xml">站点地图</a>　·　<a href="/rss.xml">RSS</a></div>${icp}</div></footer>`;
}

function layout(conf, p) {
  const canonical = conf.domain ? (conf.domain || '').replace(/\/+$/, '') + (p.path || '/') : p.path || '/';
  const tpl = tplOf(conf);
  return `<!doctype html>
<html lang="zh-CN"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc || conf.seo_desc || conf.site_desc)}">
${p.keywords || conf.seo_keywords ? `<meta name="keywords" content="${esc(p.keywords || conf.seo_keywords)}">` : ''}
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="${p.type || 'website'}">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc || conf.seo_desc || conf.site_desc)}">
<link rel="stylesheet" href="${esc(p.css || '/assets/style.css')}">
${p.head || ''}
</head><body class="tpl-${esc(tpl.key)}">
${header(conf)}
${p.body}
${footer(conf)}
${conf.analytics || ''}
</body></html>`;
}

function lanmuOf(conf, cid) {
  return (conf.lanmus || []).find((l) => String(l.id) === String(cid)) || { id: cid, title: '未分类' };
}
function tagOf(conf, id) {
  return (conf.tags || []).find((t) => String(t.id) === String(id)) || null;
}
function tagsOfArticle(conf, a) {
  return (a.tags || []).map((id) => tagOf(conf, id)).filter(Boolean);
}

// 模板函数用的工具集
const ctx = {
  esc,
  excerpt,
  strip,
  fmt,
  fmtFull,
  slug,
  postPath,
  catPath,
  tagPath,
  lanmuOf,
  tagOf,
  tagsOf: tagsOfArticle,
};

function buildIndex(conf, articles) {
  const tpl = tplOf(conf);
  const body = tpl.home.call(tpl, ctx, conf, articles);
  const title = conf.seo_title || `${conf.site_name} - ${conf.site_desc}`;
  writeFile('index.html', layout(conf, { title, desc: conf.seo_desc || conf.site_desc, keywords: conf.seo_keywords, path: '/', body }));
}

// 列表页（栏目 / 标签共用）：hero + 模板自己的列表容器 + 模板自己的侧栏
function listPage(conf, o) {
  const tpl = tplOf(conf);
  const side = tpl.sidebar.call(tpl, ctx, conf, o.all);
  const body = `<div class="wrap"><div class="crumb">${o.crumb}</div>
  <div class="hero"><h1>${esc(o.title)}</h1><p>${esc(o.sub)}</p></div>
  <div class="grid"><main class="${esc(tpl.listClass)}">${
    o.list.length
      ? o.list.map((a) => tpl.item.call(tpl, ctx, conf, a, lanmuOf(conf, a.cid), tagsOfArticle(conf, a))).join('')
      : `<div class="${esc(tpl.listClass.split(' ')[0] === 'nw-grid' ? 'nw-item' : tpl.key === 'food' ? 'fd-card' : 'bl-row')}"><p style="margin:0;color:#999">${esc(o.empty)}</p></div>`
  }</main>${side}</div></div>`;
  return body;
}

function buildCategory(conf, cid, list, all) {
  const lm = lanmuOf(conf, cid);
  const body = listPage(conf, {
    crumb: `<a href="/">首页</a> / ${esc(lm.title)}`,
    title: lm.title,
    sub: `共 ${list.length} 篇`,
    list,
    all,
    empty: '这个栏目还没有文章。',
  });
  writeFile(`${slug(cid)}/index.html`, layout(conf, { title: `${lm.title} - ${conf.site_name}`, desc: `${lm.title}栏目，共 ${list.length} 篇文章。`, path: catPath(conf, cid), body }));
}

function buildPost(conf, a, all) {
  const tpl = tplOf(conf);
  const lm = lanmuOf(conf, a.cid);
  const tg = tagsOfArticle(conf, a);
  const related = all.filter((x) => x.cid === a.cid && x.id !== a.id).slice(0, 6);
  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.seo_title || a.title,
    datePublished: new Date(a.created).toISOString(),
    dateModified: new Date(a.updated || a.created).toISOString(),
    author: { '@type': 'Organization', name: conf.site_name },
    publisher: { '@type': 'Organization', name: conf.site_name },
    mainEntityOfPage: `${(conf.domain || '').replace(/\/+$/, '')}${postPath(conf, a)}`,
  };
  const body = tpl.post.call(tpl, ctx, conf, a, lm, tg, related);
  writeFile(`${slug(a.cid)}/${a.id}.html`, layout(conf, {
    title: `${a.seo_title || a.title} - ${conf.site_name}`,
    desc: a.seo_desc || excerpt(a.content, 140),
    keywords: a.seo_kw || '',
    path: postPath(conf, a),
    type: 'article',
    head: `<script type="application/ld+json">${JSON.stringify(jsonld)}</script>`,
    body,
  }));
  // 顺手留一个旧地址跳转，/a/00000001.html 也能进
  writeFile(`a/${a.id}.html`, redirectPage(conf, postPath(conf, a), a.title));
}

function buildTagPage(conf, tag, list, all) {
  const body = listPage(conf, {
    crumb: `<a href="/">首页</a> / 标签：${esc(tag.title)}`,
    title: tag.title,
    sub: `共 ${list.length} 篇`,
    list,
    all,
    empty: '这个标签下还没有文章。',
  });
  writeFile(`${slug(tag.id)}.html`, layout(conf, {
    title: `${tag.title} - ${conf.site_name}`,
    desc: `标签「${tag.title}」下的文章，共 ${list.length} 篇。`,
    keywords: tag.title,
    path: tagPath(tag.id),
    body,
  }));
}

// 搜索索引：给前端 /search.html 用，纯 JSON，静态托管也能搜
function buildSearchIndex(conf, articles) {
  const rows = articles.map((a) => ({
    u: postPath(conf, a),
    t: a.seo_title || a.title,
    x: excerpt(a.content, 500),
    cu: catPath(conf, a.cid),
    cn: lanmuOf(conf, a.cid).title,
    k: tagsOfArticle(conf, a).map((t) => t.title).join(' '),
    d: fmt(a.created),
  }));
  writeFile('assets/search-index.json', JSON.stringify(rows));
}

function buildSearchPage(conf, articles) {
  const tpl = tplOf(conf);
  const side = tpl.sidebar.call(tpl, ctx, conf, articles);
  const body = `<div class="wrap"><div class="crumb"><a href="/">首页</a> / 搜索</div>
  <div class="hero"><h1>搜索</h1><p id="scount">全站 ${articles.length} 篇文章，标题和正文都能搜</p></div>
  <div class="grid"><main class="${esc(tpl.listClass)}" id="slist"><div class="${esc(tpl.listClass.split(' ')[0] === 'nw-grid' ? 'nw-item' : tpl.key === 'food' ? 'fd-card' : 'bl-row')}"><p style="margin:0;color:#999">在上方搜索框输入关键词，回车看看。</p></div></main>
  ${side}</div></div>
  <script>
  (function(){
    var ITEM = ${JSON.stringify(tpl.searchItem)};
    var q = (new URLSearchParams(location.search).get('q') || '').trim();
    var box = document.querySelector('.searchf input'); if (box) box.value = q;
    var sl = document.getElementById('slist'), sc = document.getElementById('scount');
    function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
    function rx(t){ return t.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\$&'); }
    function mark(text, toks){
      var e = esc(text);
      if (!toks.length) return e;
      var re = new RegExp('(' + toks.map(rx).join('|') + ')', 'gi');
      return e.replace(re, '<mark>$1</mark>');
    }
    function fill(a, toks){
      return ITEM.replace('{url}', esc(a.u)).replace('{title}', mark(a.t, toks)).replace('{ex}', mark(a.x, toks))
        .replace('{cat}', esc(a.cn)).replace('{date}', esc(a.d));
    }
    if (!q) { sc.textContent = '全站文章检索，标题和正文都能搜'; return; }
    fetch('/assets/search-index.json').then(function(r){ return r.json(); }).then(function(list){
      var toks = q.toLowerCase().split(/\\s+/).filter(Boolean);
      var rows = list.filter(function(a){
        var hay = (a.t + ' ' + a.x + ' ' + a.k).toLowerCase();
        return toks.every(function(t){ return hay.indexOf(t) >= 0; });
      });
      var total = rows.length;
      rows = rows.slice(0, 60);
      sc.textContent = total ? ('找到 ' + total + ' 篇' + (total > 60 ? '，显示前 60 篇' : '')) : '没有匹配的文章';
      if (!total) {
        sl.innerHTML = '<div class="${esc(tpl.listClass.split(' ')[0] === 'nw-grid' ? 'nw-item' : tpl.key === 'food' ? 'fd-card' : 'bl-row')}"><p style="margin:0;color:#999">没找到和「' + esc(q) + '」相关的文章，换个词试试。</p></div>';
        return;
      }
      sl.innerHTML = rows.map(function(a){ return fill(a, toks); }).join('');
    }).catch(function(){ sc.textContent = '搜索索引没加载出来，检查 /assets/search-index.json'; });
  })();
  </script>`;
  writeFile('search.html', layout(conf, {
    title: `搜索 - ${conf.site_name}`,
    desc: '站内搜索',
    path: '/search.html',
    head: `<meta name="robots" content="noindex,follow">`,
    body,
  }));
}

// 三套模板的预览页：后台点「预览」直接看效果（noindex，不进 sitemap）
function buildPreviews(conf, articles) {
  for (const meta of tplLib.LIST) {
    const tpl = tplLib.get(meta.key);
    const c2 = Object.assign({}, conf, { template: meta.key });
    writeFile(`assets/style-${meta.key}.css`, CSS(conf.brand) + tpl.css);
    const body = tpl.home.call(tpl, ctx, c2, articles);
    writeFile(
      `preview-${meta.key}.html`,
      layout(c2, {
        title: `模板预览：${meta.name} - ${conf.site_name}`,
        desc: meta.desc,
        path: `/preview-${meta.key}.html`,
        css: `/assets/style-${meta.key}.css`,
        head: '<meta name="robots" content="noindex,nofollow">',
        body,
      })
    );
  }
}

function buildSitemap(conf, articles) {
  const base = (conf.domain || '').replace(/\/+$/, '');
  const urls = ['/', ...(conf.lanmus || []).map((l) => catPath(conf, l.id)), ...(conf.tags || []).filter((t) => articles.some((a) => (a.tags || []).includes(t.id))).map((t) => tagPath(t.id)), ...articles.map((a) => postPath(conf, a))];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${esc(base + u)}</loc><lastmod>${fmt(Date.now())}</lastmod></url>`).join('\n')}
</urlset>`;
  writeFile('sitemap.xml', xml);
}

function buildRss(conf, articles) {
  const base = (conf.domain || '').replace(/\/+$/, '');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(conf.site_name)}</title>
<link>${esc(base + '/')}</link>
<description>${esc(conf.site_desc)}</description>
${articles.slice(0, 20).map((a) => `  <item><title>${esc(a.seo_title || a.title)}</title><link>${esc(base + postPath(conf, a))}</link><description>${esc(excerpt(a.content, 200))}</description><pubDate>${new Date(a.created).toUTCString()}</pubDate></item>`).join('\n')}
</channel></rss>`;
  writeFile('rss.xml', xml);
}

function buildRobots(conf) {
  const base = (conf.domain || '').replace(/\/+$/, '');
  writeFile('robots.txt', `User-agent: *\nAllow: /\nDisallow: /search.html\nDisallow: /assets/search-index.json\nSitemap: ${base}/sitemap.xml\n`);
}

function notFound(conf) {
  const body = `<div class="wrap"><div class="hero"><h1>404 · 页面不存在</h1><p>回<a href="/">首页</a>看看。</p></div></div>`;
  writeFile('404.html', layout(conf, { title: `404 - ${conf.site_name}`, desc: '页面不存在', path: '/404.html', body }));
}

// 旧地址 /c/xxx.html、/a/xxx.html 保留成跳转页，老链接和被收录的 URL 不至于断
function redirectPage(conf, to, label) {
  const abs = conf.domain ? (conf.domain || '').replace(/\/+$/, '') + to : to;
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="robots" content="noindex,follow"><meta http-equiv="refresh" content="0;url=${esc(to)}">
<link rel="canonical" href="${esc(abs)}"><title>${esc(label)}</title></head>
<body><p style="font:16px/1.8 sans-serif;padding:24px">页面已移动到 <a href="${esc(to)}">${esc(to)}</a></p>
<script>location.replace(${JSON.stringify(to)})</script></body></html>`;
}

function buildLegacyRedirects(conf, articles) {
  for (const l of conf.lanmus || []) {
    if (slug(l.id) === 'index') continue;
    writeFile(`c/${slug(l.id)}.html`, redirectPage(conf, catPath(conf, l.id), l.title));
  }
  for (const a of articles) {
    writeFile(`a/${a.id}.html`, redirectPage(conf, postPath(conf, a), a.title));
  }
}

function buildAssets(conf) {
  writeFile('assets/style.css', CSS(conf.brand) + tplOf(conf).css);
}

// 全量构建：清空 public 再生成，最稳（文章多时也只是重写文本）
function buildAll(conf, articles) {
  if (fs.existsSync(OUT)) fs.rmSync(OUT, { recursive: true, force: true });
  ensureDir(OUT);
  buildAssets(conf);
  const sorted = articles.slice().sort((a, b) => (b.created || 0) - (a.created || 0));
  buildIndex(conf, sorted);
  for (const l of conf.lanmus || []) buildCategory(conf, l.id, sorted.filter((a) => String(a.cid) === String(l.id)), sorted);
  for (const a of sorted) buildPost(conf, a, sorted);
  for (const t of conf.tags || []) buildTagPage(conf, t, sorted.filter((a) => (a.tags || []).includes(t.id)), sorted);
  buildLegacyRedirects(conf, sorted);
  buildSearchIndex(conf, sorted);
  buildSearchPage(conf, sorted);
  buildPreviews(conf, sorted);
  buildSitemap(conf, sorted);
  buildRss(conf, sorted);
  buildRobots(conf);
  notFound(conf);
  return { pages: 2 + (conf.lanmus || []).length + (conf.tags || []).length + sorted.length };
}

// 增量构建：只重写这一篇 + 首页/栏目/sitemap/rss，发一篇不用等全站
function buildIncremental(conf, articles, changed) {
  const sorted = articles.slice().sort((a, b) => (b.created || 0) - (a.created || 0));
  buildAssets(conf);
  // 换了栏目就把它在旧栏目目录里的旧页删掉，免得留下过期副本
  if (changed._oldCid && slug(changed._oldCid) !== slug(changed.cid)) {
    try {
      fs.unlinkSync(path.join(OUT, slug(changed._oldCid), `${changed.id}.html`));
    } catch (e) {}
  }
  buildPost(conf, changed, sorted);
  buildIndex(conf, sorted);
  for (const l of conf.lanmus || []) buildCategory(conf, l.id, sorted.filter((a) => String(a.cid) === String(l.id)), sorted);
  for (const t of conf.tags || []) buildTagPage(conf, t, sorted.filter((a) => (a.tags || []).includes(t.id)), sorted);
  for (const l of conf.lanmus || []) {
    if (slug(l.id) === 'index') continue;
    writeFile(`c/${slug(l.id)}.html`, redirectPage(conf, catPath(conf, l.id), l.title));
  }
  buildSearchIndex(conf, sorted);
  buildSearchPage(conf, sorted);
  buildPreviews(conf, sorted);
  buildSitemap(conf, sorted);
  buildRss(conf, sorted);
  buildRobots(conf);
}

module.exports = { buildAll, buildIncremental, esc, strip, excerpt, fmt, CSS, slug, catPath, postPath, tagPath, tplLib };
