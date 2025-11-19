import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';

export function mdToHtml(md, options = {}) {
  let processor = unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeStringify);

  // 阶段 4 可注入更多插件
  if (options.plugins) {
    options.plugins.forEach(p => processor = processor.use(p));
  }

  return processor.processSync(md).toString();
}

// 跑通测试
if (import.meta.vitest) {
  const { test, expect } = import.meta.vitest;
  test('# hello → <h1>hello</h1>', () => {
    expect(mdToHtml('# hello').trim()).toBe('<h1>hello</h1>');
  });
}