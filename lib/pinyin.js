// 汉字转拼音：只用那张 396 行的声母表推出来的字表，零依赖
const DICT = require('./pinyin-dict.json');

function pinyin(str) {
  let out = '';
  for (const ch of String(str == null ? '' : str)) {
    const py = DICT[ch];
    if (py) out += py;
    else if (/[a-zA-Z0-9]/.test(ch)) out += ch;
    // 空格、标点等直接丢掉
  }
  return out.toLowerCase();
}

// 标签 id：中文取全拼，英文/数字原样保留，最后只留 a-z0-9
function tagId(name) {
  const py = pinyin(name).replace(/[^a-z0-9]+/g, '');
  return py || 'tag';
}

module.exports = { pinyin, tagId, DICT };
