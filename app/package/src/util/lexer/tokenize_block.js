import tokenizeInline from "./tokenize_inline";

//块级语法解析分为三部分：
//高优先级块匹配：先处理「有明确边界标识」的块（代码块、水平线、表格）
//多行文本块处理
//单行文本块处理
function tokenizeBlock(block) {
  //匹配代码块
  const codeRegex = /^```(\w+)?\n([\s\S]*?)\n```$/;
  const codeMatch = block.match(codeRegex);
  //如果全是代码块
  if (codeMatch) {
    const lang = codeMatch[1] || '';  //语言标识（不显示）
    const content = codeMatch[2] || ''; //代码内容
    return [  // 直接提前返回
      { type: 'code_block_open', lang },
      { type: 'text', content },
      { type: 'code_block_close' }
    ];
  }

  //当文本全是水平线提前退出
  const hrRegex = /^(\s*[-*_]\s*){3,}$/;
  if (hrRegex.test(block)) {
    return [{ type: 'horizontal_rule' }];
  }

  // 表格检测
  //是否是多行文本
  if (block.includes('\n')) {
    const lines = block.split('\n');

    //确保至少有 2 行（表头 + 分隔行），否则不构成表格
    if (lines.length >= 2) {
      const head = lines[0];
      const sep = lines[1];
      //分隔符和表头判断
      const isTableSep = /^\s*\|?\s*:?[-|\s]+:?\s*\|?\s*$/.test(sep);
      const looksLikeHead = /^\s*\|.*\|\s*$/.test(head);

      if (isTableSep && looksLikeHead) {
        //从第三行开始查，只有全部内容为表格时return
        let j = 2;
        const rowRegex = /^\s*\|.*\|\s*$/;
        while (j < lines.length && rowRegex.test(lines[j])) j++;
        // 检查剩余行：是否只有空白行(没东西就是[],every也返回true)
        const hasOnlyTable = lines.slice(j).every(l => !l.trim());
        if (hasOnlyTable) {
          //组合+清理首尾多余字符
          const rows = [head, ...lines.slice(2, j)].map(l => l.replace(/^\s*\|/, '').replace(/\|\s*$/, ''));
          const cells = r => r.split(/\s*\|\s*/).map(c => escapeCell(c));
          const thead = cells(rows[0]).map(c => `<th>${c}</th>`).join('');
          const tbody = rows.slice(1).map(r => `<tr>${cells(r).map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
          const html = `<table>\n  <thead>\n    <tr>${thead}</tr>\n  </thead>\n  <tbody>\n${tbody}\n  </tbody>\n</table>`;
          return [{ type: 'html_inline', content: html }];
        }
      }
    }
  }

  //1-6级标题
  const headingRegex = /^\s{0,3}(#{1,6})\s+(.+?)(?:\s*#+\s*)?$/;
  //进入多行文本匹配
  if (block.includes('\n')) {
    const lines = block.split('\n');
    const tokens = [];
    let paragraphBuffer = []; // 段落缓冲区：存储未完成的段落文本
    let quoteBuffer = []; // 引用缓冲区：存储引用内容
    let listStack = []; // 列表栈（存储层级信息：{ ordered: 布尔值, indent: 缩进量 }）
    let listItemStack = []; // 列表项栈（存储当前未闭合的列表项缩进）
    let inFence = false; // 是否在围栏代码块内
    let fenceLang = ''; // 围栏代码块的语言
    let fenceBuf = []; // 围栏代码块内容缓冲区
    let fenceOpenRaw = ''; // 代码围栏起始行原始文本（用于未闭合时回显）
    let curQuoteLevel = 0; // 当前引用嵌套层级(处理的是>的引用)

    // 辅助函数：刷新段落缓冲区（生成段落 Token，p标签）
    const flushParagraph = () => {
      if (!paragraphBuffer.length) return;
      tokens.push({ type: 'paragraph_open' });
      for (let i = 0; i < paragraphBuffer.length; i++) {
        const { text, brAfter } = paragraphBuffer[i];
        tokens.push(...tokenizeInline(text));
        if (i < paragraphBuffer.length - 1 && brAfter) tokens.push({ type: 'br' });
      }
      tokens.push({ type: 'paragraph_close' });
      paragraphBuffer = [];
    };

    // 辅助函数：关闭所有未闭合的引用层级
    const flushQuote = () => {
      //多个 > 表示层级（如 >> 文本 是 2 级引用），需按「先开后关」的顺序关闭（2 级 → 1 级）
      while (curQuoteLevel > 0) {
        tokens.push({ type: 'blockquote_close' });
        curQuoteLevel--;
      }
      quoteBuffer = []; //清空引用缓冲区
    };

    // 辅助函数：关闭所有未闭合的列表/列表项
    const closeList = () => {
      while (listItemStack.length) {
        tokens.push({ type: 'list_item_close' });
        listItemStack.pop();
      }
      while (listStack.length) {
        const ctx = listStack.pop();
        tokens.push({ type: ctx.ordered ? 'ordered_list_close' : 'unordered_list_close' });
      }
    };

    // 辅助函数：确保列表层级正确（处理嵌套列表）
    const ensureListLevel = (ordered, indent) => {
      // 通过缩进值，关闭所有缩进更深的列表
      while (listStack.length && indent < listStack[listStack.length - 1].indent) {
        const ctx = listStack.pop();
        tokens.push({ type: ctx.ordered ? 'ordered_list_close' : 'unordered_list_close' });
      }
      const cur = listStack[listStack.length - 1];
      // 如果此列表是最深的那要新开子列表
      if (!cur || indent > cur.indent) {
        tokens.push({ type: ordered ? 'ordered_list_open' : 'unordered_list_open' });
        listStack.push({ ordered, indent });
        return;
      }
      // 同层级但类型不同，那就先关后开
      if (cur && indent === cur.indent && cur.ordered !== ordered) {
        const ctx = listStack.pop();
        tokens.push({ type: ctx.ordered ? 'ordered_list_close' : 'unordered_list_close' });
        tokens.push({ type: ordered ? 'ordered_list_open' : 'unordered_list_open' });
        listStack.push({ ordered, indent });
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const line = rawLine;
      //统计行首缩进的字符数 （包括空格、制表符\t等）
      const indent = (line.match(/^\s*/) || [''])[0].length;

      // 围栏代码块处理
      //判断当前行是否是开启行(```javascript)
      const fenceOpen = /^```(\w+)?\s*$/.exec(line);
      if (fenceOpen && !inFence) {
        // 刷新所有未完成的缓冲区
        flushQuote();
        closeList();
        flushParagraph();
        inFence = true;  // 切换状态：进入代码围栏内(因为```javascript是不会显示的)
        fenceLang = fenceOpen[1] || ''; // 语言标识（无则为空字符串）
        fenceBuf = [];  // 初始化代码块内容缓冲区：
        fenceOpenRaw = rawLine;
        continue;
      }
      if (inFence) {
        //代码块末尾
        if (/^```[\s;]*$/.test(line)) {
          tokens.push({ type: 'code_block_open', lang: fenceLang });
          tokens.push({ type: 'text', content: fenceBuf.join('\n') });
          tokens.push({ type: 'code_block_close' });
          inFence = false;   // 退出代码围栏
          fenceLang = '';
          fenceBuf = [];
        } else {
          //代码块内部直接push
          fenceBuf.push(line);
        }
        continue;
      }

      //缩进代码块（多行连续处理）（4个空格开头）
      //后面的正则：排除列表项内的缩进文本
      if (/^\s{4}/.test(line) && !/^(?:-|\+|\*|\d+\.)\s+/.test(line.trimStart())) {
        flushQuote();
        closeList();
        flushParagraph();
        const buf = [line.replace(/^\s{4}/, '')];
        let j = i + 1;
        while (j < lines.length) {
          const nl = lines[j];
          if (/^\s{4}/.test(nl) && !/^(?:-|\+|\*|\d+\.)\s+/.test(nl.trimStart())) {
            buf.push(nl.replace(/^\s{4}/, '')); // 满足条件：移除缩进，存入缓冲区
            j++;
          } else {
            break;
          }
        }
        tokens.push({ type: 'code_block_open', lang: '' });
        tokens.push({ type: 'text', content: buf.join('\n') });
        tokens.push({ type: 'code_block_close' });
        i = j - 1;  //回退
        continue;
      }

      //处理空行 
      if (!line.trim()) {
        //遇到空行意味着当前正在收集的「引用」或「段落」已经结束
        flushQuote();
        flushParagraph();
        // 空行视为结束当前列表块
        closeList();
        continue;
      }

      //一级标题特殊写法 例：
      //这是一级标题
      //===     (等号>=1就行)
      //缓冲区中只有「一行待处理文本」
      if (/^\s*=+\s*$/.test(line) && paragraphBuffer.length === 1) {
        const text = paragraphBuffer[0].text.trim();
        paragraphBuffer = [];
        tokens.push({ type: 'heading_1_open' }, ...tokenizeInline(text), { type: 'heading_1_close' });
        continue;
      }

      //二级标题特殊写法 例：
      //这是二级标题
      //---     (杠号>=1就行)
      if (/^\s*-+\s*$/.test(line) && paragraphBuffer.length === 1) {
        const text = paragraphBuffer[0].text.trim();
        paragraphBuffer = [];
        tokens.push({ type: 'heading_2_open' }, ...tokenizeInline(text), { type: 'heading_2_close' });
        continue;
      }

      //水平线
      if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
        flushQuote();
        closeList();
        flushParagraph();
        tokens.push({ type: 'horizontal_rule' });
        continue;
      }

      // 引用：支持嵌套（多个 '>' 表示层级）
      if (/^\s*(>\s*)+/.test(line)) {
        closeList();
        flushParagraph();
        const m = line.match(/^\s*(>\s*)+/);  // 匹配行首的「引用标记部分」（如 `  >>  `）
        const level = (m[0].match(/>/g) || []).length; // 统计 `>` 数量 → 引用层级
        const content = line.slice(m[0].length).trim(); //提取纯文本
        if (level > curQuoteLevel) {
          // 从之前的层级到当前层级，逐个开启新引用（如 cur=1 → level=3，需多开 2 个）
          for (let k = curQuoteLevel; k < level; k++) tokens.push({ type: 'blockquote_open' });
          curQuoteLevel = level;  // 更新当前层级为新层级
        } else if (level < curQuoteLevel) {
          // 从之前的层级到当前层级，逐个关闭多余引用（如 cur=3 → level=1，需关闭 2 个）
          for (let k = curQuoteLevel; k > level; k--) tokens.push({ type: 'blockquote_close' });
          curQuoteLevel = level;
        }
        tokens.push(...tokenizeInline(content));
        tokens.push({ type: 'br' });   // 每行引用后添加换行标记
        continue;
      } else {
        flushQuote();  //当遇到非引用行时，关闭当前所有打开的引用层级（curQuoteLevel变为0）
      }

      //1-6级标题判断
      const m = line.match(headingRegex);
      if (m) {
        flushParagraph();
        closeList();
        const level = m[1].length;  //#数
        const text = m[2] || '';
        tokens.push({ type: `heading_${level}_open` }, ...tokenizeInline(text), { type: `heading_${level}_close` });
        continue;
      }

      // 表格检测（行内）
      if (/^\s*\|.*\|\s*$/.test(line)) {

        const next = lines[i + 1] || '';
        // 下一行是分隔行（如 | --- |）
        if (/^\s*\|?\s*:?[-|\s]+:?\s*\|?\s*$/.test(next)) {
          flushParagraph();
          closeList();
          const head = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '');   // 清理表头：去除首尾竖线和前后空格
          const rows = [];  //存储表格内容行
          let j = i + 2;
          while (j < lines.length && /^\s*\|.*\|\s*$/.test(lines[j])) {
            rows.push(lines[j].replace(/^\s*\|/, '').replace(/\|\s*$/, ''));
            j++;
          }
          const cells = r => r.split(/\s*\|\s*/).map(c => escapeCell(c));
          const thead = cells(head).map(c => `<th>${c}</th>`).join('');
          const tbody = rows.map(r => `<tr>${cells(r).map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
          const html = `<table>\n  <thead>\n    <tr>${thead}</tr>\n  </thead>\n  <tbody>\n${tbody}\n  </tbody>\n</table>`;
          tokens.push({ type: 'html_inline', content: html });
          i = j - 1;  //跳过已处理的行
          continue;
        }
      }

      //列表解析
      const listItem = /^(?:-|\+|\*|\d+\.)\s+(.*)$/.exec(line.trimStart());
      if (listItem) {
        flushParagraph();
        const isOrd = /^\d+\./.test(line.trimStart());   // 判断是否是有序列表
        ensureListLevel(isOrd, indent);
        // 关闭同层或更深层的未闭合项
        while (listItemStack.length && listItemStack[listItemStack.length - 1] >= indent) {
          tokens.push({ type: 'list_item_close' });
          listItemStack.pop();  // 从栈中移除该列表项的缩进记录
        }
        const rawRest = listItem[1];
        const brAfterItem = /\s{2}$/.test(rawRest);
        const itemText = rawRest.replace(/\s+$/, ''); //清除末尾所有空白


        tokens.push({ type: 'list_item_open' });
        //是否是任务列表项
        const task = /^\[(x|X| )\]\s*(.*)$/.exec(itemText);
        if (task) {
          // 是任务列表项：生成复选框 Token
          const checked = /x/i.test(task[1]);
          tokens.push({ type: 'task_checkbox', checked });
          tokens.push(...tokenizeInline(task[2] || ''));
        } else {
          // 普通列表项：直接解析内容为行内 Token
          tokens.push(...tokenizeInline(itemText));
        }
        if (brAfterItem) tokens.push({ type: 'br' }); // 若有双空格结尾，生成强制换行 Token
        listItemStack.push(indent); // 记录当前列表项的缩进量（用于后续层级管理）
        continue;
      }


      const brAfter = /\s{2}$/.test(line);     // 判断行尾是否有双空格（Markdown 强制换行语法）
      const clean = line.replace(/\s+$/, '');  // 清理文本：去除行尾所有空白
      //列表项内的文本追加
      if (listItemStack.length) {
        const lastTok = tokens[tokens.length - 1];
        if (lastTok && lastTok.type !== 'br' && lastTok.type !== 'list_item_open') {
          tokens.push({ type: 'br' });
        }
        tokens.push(...tokenizeInline(clean));
        if (brAfter) tokens.push({ type: 'br' });
        continue;
      }
      //处理普通文本行
      if (!paragraphBuffer.length) {   // 段落缓冲区为空 → 是新段落的第一行
        paragraphBuffer.push({ text: clean, brAfter }); // 存入缓冲区
      } else {  // 段落缓冲区非空 → 当前行是已有段落的续行
        if (paragraphBuffer[paragraphBuffer.length - 1].brAfter) {
          // 上一行有强制换行 → 直接追加到当前段落（强制换行后仍属于同一段落）
          paragraphBuffer.push({ text: clean, brAfter });
        } else {
          // 上一行没有强制换行 → 先刷新缓冲区（生成之前的段落 Token），再开始新段落
          flushParagraph();
          paragraphBuffer.push({ text: clean, brAfter });
        }
      }
    }

    // 未闭合代码块栏作为普通段落文本输出
    if (inFence) {
      // 拼接未闭合代码围栏的原始文本（起始行 + 收集的内容）
      const rawText = `${fenceOpenRaw}\n${fenceBuf.join('\n')}`.replace(/\n+$/, '');
      tokens.push({ type: 'paragraph_open' });
      tokens.push(...tokenizeInline(rawText));
      tokens.push({ type: 'paragraph_close' });
      // 重置代码块相关状态
      inFence = false;
      fenceLang = '';
      fenceBuf = [];
      fenceOpenRaw = '';
    }

    flushQuote();
    closeList();
    flushParagraph();
    return tokens;
  }



  //接下来内容为单行处理
  const headingMatch = block.match(headingRegex);

  if (headingMatch) {
    const level = headingMatch[1].length;
    const text = headingMatch[2] || '';
    return [
      { type: `heading_${level}_open` },
      ...tokenizeInline(text),
      { type: `heading_${level}_close` }
    ];
  }

  //列表处理
  const listRegex = /^(?:-|\+|\*|\d+\.)\s+/;
  if (listRegex.test(block)) {
    const isOrdered = /^\d+\./.test(block);
    const items = [block].filter(line => line.trim() && listRegex.test(line.trimStart()));
    const tokens = [{ type: isOrdered ? 'ordered_list_open' : 'unordered_list_open' }];

    //因为是单行，items数组里只有一个元素
    const text = items[0].replace(/^(?:-|\+|\*|\d+\.)\s+/, '').trim();
    tokens.push(
      { type: 'list_item_open' },
      ...tokenizeInline(text),
      { type: 'list_item_close' }
    );

    tokens.push({ type: isOrdered ? 'ordered_list_close' : 'unordered_list_close' });
    return tokens;
  }

  //引用处理
  const quoteRegex = /^>\s*/;
  if (quoteRegex.test(block.trimStart())) {
    const content = block.replace(/^\s*(?:>\s*)+/, '').trim();
    return [
      { type: 'blockquote_open' },
      ...tokenizeInline(content),
      { type: 'blockquote_close' }
    ];
  }

  return [
    { type: 'paragraph_open' },
    ...tokenizeInline(block),
    { type: 'paragraph_close' }
  ];
}

export default tokenizeBlock;