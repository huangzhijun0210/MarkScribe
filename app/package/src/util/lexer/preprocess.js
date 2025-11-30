

/**
 * 预处理函数，此函数作用把原markdown去掉多余换行和空白字符转换为字符串数组
 */
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

export default preprocess;