import preprocess from "./preprocess";
import tokenizeBlock from "./tokenize_block";
import tokenizeInline from "./tokenize_inline";
import browserUrl from  '../public/browserUrl'
import escapeCell from '../public/escape'

/**
 * 词法分析器：
 * @param {string} markdown - 原始Markdown文本
 * @returns {Array} Token数组
 */
let refMap = {};  //引用映射
let footnotesMap = {};  //脚注映射
let usedFootnotes = new Set();  //脚注文本

function lexer(markdown) {
  const pre = preprocess(markdown);
  //引用映射存全局,脚注映射存全局，脚注有问题
  refMap = pre.refs || {};
  footnotesMap = pre.footnotes || {};
  //字符串数组
  const content = pre.content;
  //块级Token化(引用的refMap在这里面变成token了)
  const all = tokenizeBlock(content);
  //确保脚注渲染（不重要）
  const footIds = usedFootnotes.size ? Array.from(usedFootnotes) : Object.keys(footnotesMap || {});
  if (footIds.length) {
    all.push({ type: 'footnote_footer_open' });
    // 遍历每个要渲染的脚注 ID
    for (const id of footIds) {
      all.push({ type: 'footnote_def_open', id });
      // 脚注内容转成行内 Token
      all.push(...tokenizeInline(footnotesMap[id] || ''));
      all.push({ type: 'footnote_def_close', id });
    }
    all.push({ type: 'footnote_footer_close' });
  }
  usedFootnotes.clear();
  return all;
}

export default lexer;