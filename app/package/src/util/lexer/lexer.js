import preprocess from "./preprocess";
import tokenizeBlock from "./tokenize_block";
import tokenizeInline from "./tokenize_inline";
import browserUrl from '../public/browserUrl'
import escapeCell from '../public/escape'

/**
 * 词法分析器：
 * @param {string} markdown - 原始Markdown文本
 * @returns {Array} Token数组
 */
function lexer(markdown, options = {}) {
  const pre = preprocess(markdown);
  //引用映射存全局,脚注映射存全局，脚注有问题
  const refMap = pre.refs || {};
  const footnotesMap = pre.footnotes || {};
  const usedFootnotes = new Set();  //正文使用的脚注
  //字符串数组
  const content = pre.content;
  //块级Token化(引用的refMap在这里面变成token了)
  const all = tokenizeBlock(content, refMap, usedFootnotes, options);
  //优先渲染使用的脚注
  const footIds = usedFootnotes.size ? Array.from(usedFootnotes) : Object.keys(footnotesMap || {});


  //给文本去掉特殊字符
  const makeSlug = (s) => {
    //s:脚注内容
    let base = String(s || '').trim().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]+/g, '').toLowerCase();
    return base;
  };

  //脚注的唯一标识 slug
  const slugMap = {};
  for (const id of footIds) {
    const contentText = footnotesMap[id] || '';
    slugMap[id] = makeSlug(contentText);
  }

  //不用管，定义不会渲染
  if (footIds.length) {
    all.push({ type: 'footnote_footer_open' });
    // 遍历每个要渲染的脚注 ID
    for (const id of footIds) {
      all.push({ type: 'footnote_def_open', id, slug: slugMap[id] });
      // 脚注内容转成行内 Token
      all.push(...tokenizeInline(footnotesMap[id] || '', refMap, usedFootnotes, options));
      all.push({ type: 'footnote_def_close', id });
    }
    all.push({ type: 'footnote_footer_close' });
  }

  usedFootnotes.clear();
  return all;
}

export default lexer;
