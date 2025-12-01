import browserUrl from '../public/browserUrl'

//处理行内语法
function tokenizeInline(text, refMap, usedFootnotes) {
  if (!text || typeof text !== 'string' || text.trim() === '') return [];
  const tokens = [];
  let position = 0; // 当前扫描位置(文本每个字符)
  const length = text.length;
  const openEmphasis = [];   // 强调标记栈(处理样式嵌套，比如又是加粗又是斜体)：管理未闭合的加粗/斜体（如 ['strong', 'em'] 表示先加粗后斜体）
  const inlinePatterns = [
    // 行内语法正则规则数组（优先级从高到低，前面的规则先匹配）
    { regex: /`([^`]+)`/g, type: 'code_inline' }, // 行内代码
    { regex: /!\[([^\]]*)\]\[([^\]]*)\]/g, type: 'ref_image' }, // 引用式图片
    { regex: /\[([^\]]+)\]\[([^\]]*)\]/g, type: 'ref_link' }, // 引用式链接
    { regex: /~~/g, type: 'del_markup' }, // 删除线标记
    { regex: /!\[([^\]]*)\]\((\s*[^)"\s]+\s*)(?:["']([^"']*)["'])?\)/g, type: 'image' }, // 行内图片
    { regex: /\[([^\]]*)\]\((\s*[^)"\s]+\s*)(?:["']([^"']*)["'])?\)/g, type: 'link' }, // 行内链接
    { regex: /\[\^([^\]]+)\]/g, type: 'footnote_ref' }, // 脚注引用
    { regex: /(?<![!\\])\[(?!\^)([^\]]+)\](?!\()/g, type: 'ref_shortcut' }, // 快捷引用链接
    { regex: /<\/?[a-zA-Z][\w-]*(?:\s+[^<>]*?)?>/g, type: 'html_tag' }, // 内嵌 HTML 标签
    { regex: /(\*\*|__)/g, type: 'strong_markup' }, // 加粗标记
    { regex: /(\*|_)/g, type: 'em_markup' }, // 斜体标记
    { regex: /\\([\*_`\[\]()#+-])/g, type: 'escape' } // 转义字符
  ];


  while (position < length) {
    // 优先处理行内代码：从当前反引号到该行最后一个反引号
    if (text.charCodeAt(position) === 96) { // '`' 96是反引号
      const end = text.lastIndexOf('`');
      if (end > position) {
        tokens.push({ type: 'code_inline', content: text.slice(position + 1, end) });
        position = end + 1;
        continue;
      }
    }

    //1.遍历所有正则规则，2.找到当前位置最优先需要匹配的语法（最左+最长）
    let best = null; // 存储最匹配的结果
    for (const pattern of inlinePatterns) {
      //重置正则起始位置(全局匹配会从上次的lastIndex开始，这里是重置)
      pattern.regex.lastIndex = position;
      const m = pattern.regex.exec(text);
      if (m) {
        // 匹配的条件：1.当前行没有匹配到，2.当前匹配更靠左，3同位置长度长的优先
        if (!best || m.index < best.match.index || (m.index === best.match.index && m[0].length > best.match[0].length)) {
          best = { match: m, pattern }; //更新最新匹配
        }
      }
    }

    // 最优匹配的结果和对应的规则
    let match = best ? best.match : null;
    let pattern = best ? best.pattern : null;

    //匹配的起始位置 > 当前扫描位置（说明两者之间有间隙，把间隙的文本加入）
    if (match && match.index > position) {
      tokens.push({ type: 'text', content: text.slice(position, match.index) });
      position = match.index;
      continue;
    }

    //处理加粗和斜体在同一位置同时命中的冲突
    if (match && match.index === position) {
      const s2 = text.startsWith('**', position) || text.startsWith('__', position);
      const s1 = text.startsWith('*', position) || text.startsWith('_', position);

      //如果又是加粗开头又是斜体开头
      if (s2 && s1) {
        // 3. 获取栈顶的未闭合强调类型
        const top = openEmphasis[openEmphasis.length - 1];


        if (top === 'em') {
          pattern = { type: 'em_markup' };
          //因为*和_都可以所以这里用slice
          match = [text.slice(position, position + 1), '*'];
          match.index = position;
        }
        //优先加粗
        else if (!openEmphasis.length) {
          pattern = { type: 'strong_markup' };
          match = [text.slice(position, position + 2), '**'];
          match.index = position;
        }
        else if (top === 'strong') {
          pattern = { type: 'strong_markup' };
          match = [text.slice(position, position + 2), '**'];
          match.index = position;
        }
      }
    }

    //这段文本没匹配到正则，是纯文本
    if (!match) {
      tokens.push({ type: 'text', content: text.slice(position) });
      break;
    }

    //匹配的起始位置
    const matchStart = match.index;
    //匹配长度
    const matchLen = match[0].length;
    const matchEnd = matchStart + matchLen;
    //提取正则的捕获组内容（match[1]及后续）
    const groups = match.slice(1);
    switch (pattern.type) {
      case 'code_inline':
        tokens.push({ type: 'code_inline', content: groups[0] || '' });
        break;
      case 'ref_image': {
        //引用图片格式：![alt][key]:https://xxx.com/logo.png 
        // 从 groups 提取 alt、key，查引用表 refMap，生成图片 Token；查不到则当作纯文本
        const alt = groups[0] || '';
        // /![alt][logo]或![logo][]
        const key = (groups[1] || alt).toLowerCase();
        //去引用表里查
        const ref = refMap[key];
        if (ref) tokens.push({ type: 'image', alt, src: browserUrl(ref.href), title: ref.title });
        else tokens.push({ type: 'text', content: match[0] });
        break;
      }
      case 'ref_link': {  //引用式链接[text][key]
        const textLabel = groups[0] || '';
        const key = (groups[1] || textLabel).toLowerCase();
        const ref = refMap[key];
        if (ref) tokens.push({ type: 'link', text: textLabel, href: browserUrl(ref.href), title: ref.title });
        else tokens.push({ type: 'text', content: match[0] });
        break;
      }
      case 'ref_shortcut': {  //快捷引用链接（[text]，key=text）
        const label = groups[0] || '';
        const key = label.toLowerCase();
        const ref = refMap[key];
        if (ref) tokens.push({ type: 'link', text: label, href: browserUrl(ref.href), title: ref.title });
        else tokens.push({ type: 'text', content: match[0] });
        break;
      }
      case 'del_markup':
        tokens.push({ type: 'del_markup', markup: '~~' });
        break;
      case 'image':// 行内图片（![alt](src "title")）
        tokens.push({ type: 'image', alt: groups[0] || '', src: browserUrl((groups[1] || '').trim()), title: groups[2] || '' });
        break;
      case 'link':  // 行内链接（[text](href "title")）
        tokens.push({ type: 'link', text: groups[0] || '', href: browserUrl((groups[1] || '').trim()), title: groups[2] || '' });
        break;
      case 'footnote_ref':   // 脚注引用（[^id]）
        usedFootnotes.add(groups[0]);
        tokens.push({ type: 'footnote_ref', id: groups[0] });
        break;
      case 'html_tag':
        tokens.push({ type: 'html_inline', content: match[0] });
        break;
      case 'strong_markup': // 加粗标记（**或__）
        tokens.push({ type: 'strong_markup', markup: groups[0] || '**' });
        // 维护强调状态栈：如果栈顶是 strong，说明是关闭标记（弹栈）；否则是开启标记（压栈）
        if (openEmphasis[openEmphasis.length - 1] === 'strong') openEmphasis.pop(); else openEmphasis.push('strong');
        break;
      case 'em_markup':
        tokens.push({ type: 'em_markup', markup: groups[0] || '*' });
        if (openEmphasis[openEmphasis.length - 1] === 'em') openEmphasis.pop(); else openEmphasis.push('em');
        break;
      case 'escape': // 转义字符（\*等）
        tokens.push({ type: 'text', content: groups[0] });
        break;
    }
    //把扫描位置移到匹配结束的位置
    position = matchEnd;
  }
  return tokens;
}

export default tokenizeInline;