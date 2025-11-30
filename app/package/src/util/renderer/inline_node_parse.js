import browserUrl from '../public/browserUrl'

/**
 * 辅助函数：渲染行内子节点
 */
function inlineNodeParse(children) {
  let html = '';
  const tagStack = [];

  children.forEach(child => {
    switch (child.type) {
      case 'text':
        html += browserUrl(child.content).replace(/\n/g, '<br>').replace(/\s{2,}/g, ' ');
        break;

      case 'del_inline':
        html += `<del>${browserUrl(child.content)}</del>`;
        break;

      case 'br':
        html += '<br>';
        break;

      case 'code_inline':
        html += `<code>${browserUrl(child.content)}</code>`;
        break;

      case 'image':
        const imgTitle = child.title ? `title="${browserUrl(child.title)}"` : '';
        html += `<img src="${browserUrl(child.src)}" alt="${browserUrl(child.alt)}" ${imgTitle}>`;
        break;

      case 'link_open':
        const linkTitle = child.title ? `title="${browserUrl(child.title)}"` : '';
        const target = /^https?:/i.test(child.href) ? ' target="_blank"' : '';
        html += `<a href="${browserUrl(child.href)}"${target} ${linkTitle}>`;
        tagStack.push('a');
        break;

      case 'link_close':
        html += `</${tagStack.pop()}>`;
        break;

      case 'html_inline':
        html += child.content;
        break;

      case 'task_checkbox':
        html += `<input type="checkbox"${child.checked ? ' checked' : ''} disabled>`;
        break;

      case 'footnote_ref':
        html += `<sup><a href="#footnote-${browserUrl(String(child.id))}">${browserUrl(String(child.id))}</a></sup>`;
        break;

      case 'strong_open':
        html += `<strong>`;
        tagStack.push('strong');
        break;

      case 'strong_close':
        html += `</${tagStack.pop()}>`;
        break;

      case 'em_open':
        html += `<em>`;
        tagStack.push('em');
        break;

      case 'em_close':
        html += `</${tagStack.pop()}>`;
        break;

      case 'del_open':
        html += `<del>`;
        tagStack.push('del');
        break;
        
      case 'del_close':
        html += `</${tagStack.pop()}>`;
        break;
    }
  });

  return html;
}

export default inlineNodeParse;