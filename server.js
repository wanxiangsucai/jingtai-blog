// 万象静态博客系统：收文章 → 存 JSON → 生成静态 HTML。零依赖，直接 node server.js
// 后台 /admin?token=密钥 ：网站设置 / 栏目 / 文章 / 友情链接 全在这
const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const build = require('./lib/build');
const { tagId } = require('./lib/pinyin');

const ROOT = __dirname;
const PUB = path.join(ROOT, 'public');
const ADMIN_DIR = path.join(ROOT, 'admin');
const CONF_FILE = path.join(ROOT, 'config.json');
const DATA_FILE = path.join(ROOT, 'data', 'articles.json');

function readJson(p, def) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return def;
  }
}
function saveJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 1), 'utf8');
}

let conf = readJson(CONF_FILE, {});
let data = readJson(DATA_FILE, { articles: [] });
if (!Array.isArray(data.articles)) data.articles = [];
conf.lanmus = conf.lanmus || [];
conf.links = conf.links || [];
conf.tags = conf.tags || [];
conf.template = conf.template || 'news';
// 标签 id 是拼音，占用了核心页面名的加后缀避开
const RESERVED_TAG_ID = ['index', '404', 'admin', 'assets', 'sitemap', 'rss', 'robots', 'api', 'page'];
function uniqueTagId(name, keepId) {
  let base = keepId || tagId(name);
  if (RESERVED_TAG_ID.includes(base)) base += '-tag';
  let id = base;
  let n = 2;
  while (conf.tags.some((t) => String(t.id) === id)) id = `${base}-${n++}`;
  return id;
}
// 把「逗号隔开的标签名」或数组解析成标签 id 数组；没见过的标签自动建
function resolveTags(input) {
  let names = [];
  if (Array.isArray(input)) names = input;
  else if (typeof input === 'string') names = input.split(/[,，;；|]+/);
  const ids = [];
  for (const raw of names) {
    const name = String(raw == null ? '' : raw).trim();
    if (!name) continue;
    let t = conf.tags.find((x) => String(x.title).toLowerCase() === name.toLowerCase());
    if (!t) t = conf.tags.find((x) => String(x.id) === tagId(name));
    if (!t) {
      t = { id: uniqueTagId(name), title: name };
      conf.tags.push(t);
      saveJson(CONF_FILE, conf);
    }
    if (!ids.includes(t.id)) ids.push(t.id);
  }
  return ids;
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function json(res, obj, code) {
  send(res, code || 200, JSON.stringify(obj));
}
function readBody(req) {
  return new Promise((resolve) => {
    let buf = '';
    req.on('data', (c) => (buf += c));
    req.on('end', () => resolve(buf));
  });
}
function auth(req, u, body) {
  if (!conf.token) return true;
  const h = req.headers['x-token'] || '';
  const a = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  return h === conf.token || a === conf.token || (u && u.searchParams.get('token') === conf.token) || (body && body.token === conf.token);
}
function lanmuTitle(cid) {
  const l = conf.lanmus.find((x) => String(x.id) === String(cid));
  return l ? l.title : '未分类';
}
function nextId() {
  const max = data.articles.reduce((m, a) => Math.max(m, parseInt(a.id, 10) || 0), 0);
  return String(max + 1).padStart(8, '0');
}
function rebuildAll() {
  conf = readJson(CONF_FILE, conf);
  conf.lanmus = conf.lanmus || [];
  conf.links = conf.links || [];
  return build.buildAll(conf, data.articles);
}
function saveArticle(p, existing) {
  const title = String(p.title || p.seo_title || '').trim();
  if (!title) throw new Error('标题为空');
  const content = String(p.content || '').trim();
  if (!content) throw new Error('正文为空');
  const cid = String(p.cid || p.lanmu_id || conf.lanmus[0] && conf.lanmus[0].id || 'default');
  const now = Date.now();
  if (existing) {
    const oldCid = existing.cid;
    existing.title = title;
    existing.seo_title = String(p.seo_title || title);
    existing.seo_kw = String(p.seo_kw || '');
    existing.seo_desc = String(p.seo_desc || build.excerpt(content, 150));
    existing.content = content;
    existing.cid = cid;
    if (p.tags !== undefined) existing.tags = resolveTags(p.tags);
    existing.updated = now;
    existing._oldCid = oldCid;
    saveJson(DATA_FILE, data);
    build.buildIncremental(conf, data.articles, existing);
    delete existing._oldCid;
    return existing;
  }
  const art = {
    id: nextId(),
    cid,
    title,
    seo_title: String(p.seo_title || title),
    seo_kw: String(p.seo_kw || ''),
    seo_desc: String(p.seo_desc || build.excerpt(content, 150)),
    content,
    tags: resolveTags(p.tags),
    created: now,
    updated: now,
  };
  data.articles.push(art);
  saveJson(DATA_FILE, data);
  build.buildIncremental(conf, data.articles, art);
  return art;
}

function publish(p) {
  return saveArticle(p, null);
}

function adminHtml() {
  const f = path.join(ADMIN_DIR, 'index.html');
  return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '后台页面缺失：admin/index.html';
}

const server = http.createServer(async (req, res) => {
  const base = `http://${req.headers.host || '127.0.0.1'}`;
  const u = new URL(req.url, base);
  const p = decodeURIComponent(u.pathname);

  // ---- 只读接口 ----
  if (p === '/api/ping') return json(res, { ok: true, site: conf.site_name });
  if (p === '/api/lanmus' || (p === '/' && req.method === 'GET' && u.searchParams.get('action') === 'lanmus')) {
    return json(res, { code: 0, lanmus: conf.lanmus.map((l) => ({ id: String(l.id), title: l.title })) });
  }
  if (p === '/api/list') {
    const page = parseInt(u.searchParams.get('page') || '1', 10);
    const size = parseInt(u.searchParams.get('size') || '20', 10);
    const list = data.articles.slice().sort((a, b) => b.created - a.created);
    return json(res, { code: 0, total: list.length, list: list.slice((page - 1) * size, page * size) });
  }
  if (p === '/api/settings') {
    if (!auth(req, u, null)) return json(res, { code: 1, msg: '密钥不对' }, 401);
    return json(res, { code: 0, settings: conf });
  }
  if (p === '/api/article') {
    const a = data.articles.find((x) => String(x.id) === String(u.searchParams.get('id')));
    if (!a) return json(res, { code: 1, msg: '没找到这篇' }, 404);
    return json(res, { code: 0, article: a });
  }
  if (p === '/api/tags') {
    return json(res, { code: 0, tags: conf.tags.map((t) => ({ id: String(t.id), title: t.title })) });
  }
  if (p === '/api/templates') {
    return json(res, {
      code: 0,
      current: conf.template,
      templates: require('./lib/templates').LIST.map((t) => ({
        key: t.key,
        name: t.name,
        desc: t.desc,
        active: t.key === conf.template,
        preview: `/preview-${t.key}.html`,
      })),
    });
  }
  // 后台填标签名时问一下该用什么 id（拼音）
  if (p === '/api/tagid') {
    const name = (u.searchParams.get('name') || '').trim();
    if (!name) return json(res, { code: 1, msg: '标签名不能为空' });
    return json(res, { code: 0, id: uniqueTagId(name) });
  }

  // ---- 后台页 ----
  if (p === '/admin' || p === '/admin/') {
    return send(res, 200, adminHtml(), 'text/html; charset=utf-8');
  }
  if (p.startsWith('/admin-assets/')) {
    const full = path.join(ADMIN_DIR, path.normalize(p.replace('/admin-assets/', '')).replace(/^([\\/])+/, ''));
    if (full.startsWith(ADMIN_DIR) && fs.existsSync(full)) {
      return send(res, 200, fs.readFileSync(full), MIME[path.extname(full).toLowerCase()] || 'application/octet-stream');
    }
  }

  // ---- 写接口（需密钥）----
  if (req.method === 'POST') {
    let body = {};
    const raw = await readBody(req);
    try {
      body = JSON.parse(raw || '{}');
    } catch (e) {
      return json(res, { code: 1, msg: '请求体不是 JSON' });
    }
    if (!auth(req, u, body)) return json(res, { code: 1, msg: '密钥不对，请检查后端 config.json 的 token' }, 401);

    try {
      if (p === '/api/publish' || p === '/') {
        const art = publish(body);
        return json(res, { code: 0, msg: '发布成功', id: art.id, url: build.postPath(conf, art) });
      }
      if (p === '/api/article/save') {
        const exist = body.id ? data.articles.find((x) => String(x.id) === String(body.id)) : null;
        const art = saveArticle(body, exist);
        return json(res, { code: 0, msg: exist ? '已保存并重建' : '已发布', id: art.id, url: build.postPath(conf, art) });
      }
      if (p === '/api/delete') {
        const n = data.articles.length;
        data.articles = data.articles.filter((a) => String(a.id) !== String(body.id));
        if (data.articles.length === n) return json(res, { code: 1, msg: '没找到这篇' });
        saveJson(DATA_FILE, data);
        rebuildAll();
        return json(res, { code: 0, msg: '已删除，全站已重建' });
      }
      if (p === '/api/settings/save') {
        const keys = ['site_name', 'site_desc', 'seo_title', 'seo_keywords', 'seo_desc', 'domain', 'analytics', 'icp', 'brand', 'per_page'];
        for (const k of keys) if (body[k] !== undefined) conf[k] = body[k];
        if (conf.domain) conf.domain = String(conf.domain).trim().replace(/\/+$/, '');
        conf.per_page = parseInt(conf.per_page, 10) || 20;
        saveJson(CONF_FILE, conf);
        rebuildAll();
        return json(res, { code: 0, msg: '设置已保存，全站已重建' });
      }
      if (p === '/api/lanmu/save') {
        const id = String(body.id || '').trim();
        const title = String(body.title || '').trim();
        const oldId = body.oldId ? String(body.oldId) : '';
        if (!id || !title) return json(res, { code: 1, msg: '栏目 id 和名称都要填' });
        const dup = conf.lanmus.find((l) => String(l.id) === id && String(l.id) !== oldId);
        if (dup) return json(res, { code: 1, msg: '栏目 id 已存在：' + id });
        if (oldId) {
          const cur = conf.lanmus.find((l) => String(l.id) === oldId);
          if (!cur) return json(res, { code: 1, msg: '要修改的栏目不存在' });
          cur.id = id;
          cur.title = title;
          data.articles.forEach((a) => {
            if (String(a.cid) === oldId) a.cid = id;
          });
          saveJson(DATA_FILE, data);
        } else {
          conf.lanmus.push({ id, title });
        }
        saveJson(CONF_FILE, conf);
        rebuildAll();
        return json(res, { code: 0, msg: '栏目已保存，全站已重建' });
      }
      if (p === '/api/lanmu/del') {
        const id = String(body.id);
        conf.lanmus = conf.lanmus.filter((l) => String(l.id) !== id);
        saveJson(CONF_FILE, conf);
        rebuildAll();
        return json(res, { code: 0, msg: '栏目已删除（该栏目下的文章保留，显示为未分类）' });
      }
      if (p === '/api/tag/save') {
        const title = String(body.title || '').trim();
        const id = String(body.id || '').trim().replace(/[^\w\u4e00-\u9fa5-]+/g, '-').toLowerCase();
        const oldId = body.oldId ? String(body.oldId) : '';
        if (!title) return json(res, { code: 1, msg: '标签名要填' });
        if (!id) return json(res, { code: 1, msg: '标签 id 要填（可以点「用拼音生成」）' });
        if (RESERVED_TAG_ID.includes(id)) return json(res, { code: 1, msg: '标签 id 不能叫 ' + id });
        if (oldId) {
          const cur = conf.tags.find((t) => String(t.id) === oldId);
          if (!cur) return json(res, { code: 1, msg: '要修改的标签不存在' });
          if (id !== oldId) {
            const dup = conf.tags.find((t) => String(t.id) === id);
            if (dup) return json(res, { code: 1, msg: '标签 id 已存在：' + id });
            cur.id = id;
            data.articles.forEach((a) => {
              if (a.tags) a.tags = a.tags.map((x) => (String(x) === oldId ? id : x));
            });
            saveJson(DATA_FILE, data);
          }
          cur.title = title;
        } else {
          if (conf.tags.some((t) => String(t.id) === id)) return json(res, { code: 1, msg: '标签 id 已存在：' + id });
          conf.tags.push({ id, title });
        }
        saveJson(CONF_FILE, conf);
        rebuildAll();
        return json(res, { code: 0, msg: '标签已保存，全站已重建', id });
      }
      if (p === '/api/tag/del') {
        const id = String(body.id);
        const had = conf.tags.some((t) => String(t.id) === id);
        if (!had) return json(res, { code: 1, msg: '没找到这个标签' });
        conf.tags = conf.tags.filter((t) => String(t.id) !== id);
        data.articles.forEach((a) => {
          if (a.tags) a.tags = a.tags.filter((x) => String(x) !== id);
        });
        saveJson(DATA_FILE, data);
        saveJson(CONF_FILE, conf);
        rebuildAll();
        return json(res, { code: 0, msg: '标签已删除，全站已重建' });
      }
      if (p === '/api/template/save') {
        const key = String(body.template || body.key || '').trim();
        const LIST = require('./lib/templates').LIST;
        if (!LIST.some((t) => t.key === key)) return json(res, { code: 1, msg: '没有这套模板：' + key });
        conf.template = key;
        saveJson(CONF_FILE, conf);
        rebuildAll();
        const t = LIST.find((x) => x.key === key);
        return json(res, { code: 0, msg: `已切换到「${t.name}」，全站已重建`, template: key });
      }
      if (p === '/api/link/save') {
        const title = String(body.title || '').trim();
        const url = String(body.url || '').trim();
        if (!title || !url) return json(res, { code: 1, msg: '名称和网址都要填' });
        conf.links.push({ title, url });
        saveJson(CONF_FILE, conf);
        rebuildAll();
        return json(res, { code: 0, msg: '友链已添加' });
      }
      if (p === '/api/link/del') {
        const i = parseInt(body.index, 10);
        if (!(i >= 0 && i < conf.links.length)) return json(res, { code: 1, msg: '没找到这条友链' });
        conf.links.splice(i, 1);
        saveJson(CONF_FILE, conf);
        rebuildAll();
        return json(res, { code: 0, msg: '友链已删除' });
      }
      if (p === '/api/rebuild') {
        const r = rebuildAll();
        return json(res, { code: 0, msg: `已重建 ${r.pages} 个页面` });
      }
    } catch (e) {
      return json(res, { code: 1, msg: e.message });
    }
  }

  // ---- 静态文件 ----
  if (p === '/search' || p === '/search/') {
    res.writeHead(301, { Location: '/search.html' + (u.search || '') });
    return res.end();
  }
  let file = p === '/' ? '/index.html' : p;
  const hasSlash = p.endsWith('/') && p !== '/';
  if (hasSlash) file += 'index.html';
  const full = path.join(PUB, path.normalize(file).replace(/^([\\/])+/, ''));
  if (!full.startsWith(PUB) || !fs.existsSync(full) || fs.statSync(full).isDirectory()) {
    // /news 这种没带尾斜杠的，目录存在就 301 到 /news/
    const dirTry = path.join(PUB, path.normalize(p).replace(/^([\\/])+/, ''));
    if (!hasSlash && p !== '/' && dirTry.startsWith(PUB) && fs.existsSync(dirTry) && fs.statSync(dirTry).isDirectory()) {
      res.writeHead(301, { Location: p + '/' });
      return res.end();
    }
    const nf = path.join(PUB, '404.html');
    if (fs.existsSync(nf)) return send(res, 404, fs.readFileSync(nf), MIME['.html']);
    return send(res, 404, '404', 'text/plain; charset=utf-8');
  }
  const ext = path.extname(full).toLowerCase();
  send(res, 200, fs.readFileSync(full), MIME[ext] || 'application/octet-stream');
});

if (!fs.existsSync(path.join(PUB, 'index.html'))) build.buildAll(conf, data.articles);

const port = parseInt(process.env.PORT || conf.port || 8850, 10);
server.listen(port, () => {
  console.log(`万象静态博客系统已启动：http://127.0.0.1:${port}  后台 /admin?token=${conf.token}`);
});
