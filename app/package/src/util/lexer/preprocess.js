

/**
 * 预处理函数，此函数作用把原markdown去掉多余换行和空白字符转换为字符串数组
 */
function preprocess(input, options = {}) {
  const normalized = options.breaks
  ? input.replace(/\r\n|\r/g, '\n')
         .replace(/\n{3,}/g, '\n\n')
         .replace(/\\n/g, '<br>')          // 注意反斜杠转义
  : input.replace(/\r\n|\r/g, '\n')
         .replace(/\n{3,}/g, '\n\n');
  const lines = normalized.split('\n');

  const kept = []; // 存放保留的核心内容（非引用、非脚注的行）
  const refs = {}; // 存放链接引用定义（key: 引用名小写，value: {href: 链接, title: 标题}）
  const footnotes = {}; // 存放脚注定义（key: 脚注ID，value: 脚注内容）
  const refDef = /^\[([^\]]+)\]:\s*(.+?)(?:\s+"([^"]+)")?\s*$/; //引用正则
  const footStart = /^\[\^([^\]]+)\]:\s*(.*)$/; //脚注正则


  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(refDef);
    if (m) {
      const key = m[1].toLowerCase();
      refs[key] = { href: m[2], title: m[3] || '' };
      continue;
    }
    const f = line.match(footStart);
    if (f) {
      const id = f[1];
      let content = f[2] || '';
      let j = i + 1;
      //只要下一行不是停止行，就拼接脚注内容
      while (j < lines.length && !isStopLine(lines[j])) {
        content += `\n${lines[j]}`;
        j++;
      }
      footnotes[id] = content;
      i = j - 1;
      continue;
    }
    kept.push(line);
  }

  return { content: kept.join('\n'), refs, footnotes };
}

export default preprocess;
