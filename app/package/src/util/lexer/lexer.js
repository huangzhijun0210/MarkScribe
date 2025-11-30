import preprocess from "./preprocess";
import tokenizeBlock from "./tokenize_block";
import tokenizeInline from "./tokenize_inline";
import preprocess from "./preprocess";
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

export default function lexer(markdown) {
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

//此函数作用把原markdown去掉多余换行和空白字符转换为字符串数组
function preprocess(input) {
  //这里处理脚注和引用部分可以不看，基本用处不大

  //\r\n(回车+换行)，\r(Mac回车),
  //这里实现 换行符跨平台统一，清理多余空行
  const normalized = input.replace(/\r\n|\r/g, '\n').replace(/\n{3,}/g, '\n\n');
  //换行符拆分成数组字符串
  const lines = normalized.split('\n');
  //kept：用于存储 “非引用、非脚注” 的普通内容行（最终会拼接成纯文本）
  //refs：用于存储 引用定义（格式：{ 小写key: { href: 链接, title: 标题 } }）
  //footnotes：用于存储 脚注定义（格式：{ 脚注id: 脚注内容 }）
  const kept = [];
  const refs = {};
  const footnotes = {};
  //引用正则，例：[百度]: https://baidu.com "百度首页"
  const refDef = /^\[([^\]]+)\]:\s*(.+?)(?:\s+"([^"]+)")?\s*$/;
  //脚注正则，例：[^1]: 这是脚注内容
  const footDef = /^\[\^([^\]]+)\]:\s*(.+)$/;
  for (const line of lines) {
    const m = line.match(refDef);
    const f = line.match(footDef);
    //如果此行是引用
    if (m) {
      //m[1]：引用的 key（比如 百度） 将 key 转为小写
      const key = m[1].toLowerCase();
      //往 refs 对象中存储：key 为小写的引用键，值为包含 href（捕获组 2，链接）和 title（捕获组 3，标题，无则设为空字符串）的对象
      refs[key] = { href: m[2], title: m[3] || '' };
    } else if (f) { //如果此行是脚注
      //f[1]： 脚注的 id（比如 1）
      const id = f[1];
      //f[2]：脚注的内容（比如 这是脚注内容）
      //footnotes对象中存内容
      footnotes[id] = f[2];
    } else {
      //普通内容行 直接push
      kept.push(line);
    }
  }

  return { content: kept.join('\n'), refs, footnotes };
}

export default lexer;