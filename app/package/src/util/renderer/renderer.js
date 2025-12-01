import escape from '../public/escape';
import inlineNodeParse from './inline_node_parse';
import splitBlockquoteBr from './split_blockquote_br'

/**
 * html渲染器：生成html
 * @param {Array} ast - ast简易语法树
 * @returns {string} html字符串
 */
function renderer(ast) {
  let html = '';
  const tagStack = [];  //还没闭合的标签放到栈里
  const quoteStack = [];   //引用的每一行都存入（因为要一行行转为p标签）

  ast.forEach(node => {
    switch (node.type) {
      case 'paragraph_open':
        html += `<${node.tag}>`;
        tagStack.push(node.tag);
        if (node.children) {
          //段落内容都在行内子节点里
          const inlineChild = node.children.find(c => c.type === 'inline');
          if (inlineChild) html += inlineNodeParse(inlineChild.children);
        }
        break;


      case 'paragraph_close':
        html += `</${tagStack.pop()}>\n`;
        break;

      //引用
      case 'blockquote_open':
        html += `<${node.tag}>\n`;
        tagStack.push(node.tag);
        let reNode = null;  //引用剩余节点
        if (node.children) {
          const inlineChild = node.children.find(c => c.type === 'inline');
          if (inlineChild) {
            //按换行br拆分，br后的交给stack，在关闭时进行操作（还有问题：应该优化为open一次处理好+多个br处理时的问题）
            const split = splitBlockquoteBr(inlineChild.children);
            if (split.prefix) html += `<p>${split.prefix}</p>\n`;
            reNode = split.reNode;
          }
        }
        quoteStack.push(reNode);
        break;

      case 'blockquote_close':
        {
          const rem = quoteStack.pop();
          if (rem && rem.length) html += `<p>${inlineNodeParse(rem)}</p>\n`;
          html += `</${tagStack.pop()}>\n`;
        }
        break;

      //有序无序列表
      case 'ordered_list_open':
      case 'unordered_list_open':
        html += `<${node.tag}>\n`;
        tagStack.push(node.tag);
        break;



      case 'ordered_list_close':
      case 'unordered_list_close':
        html += `</${tagStack.pop()}>\n`;
        break;

      //列表项
      case 'list_item_open':
        html += `<${node.tag}>`;
        tagStack.push(node.tag);
        if (node.children) {
          const inlineChild = node.children.find(c => c.type === 'inline');
          if (inlineChild) html += inlineNodeParse(inlineChild.children);
        }
        break;


      case 'list_item_close':
        html += `</${tagStack.pop()}>\n`;
        break;

      //代码块节点
      case 'code_block_open':
        html += `<${node.tag}><code>`;  //<pre><code>
        // 渲染代码内容（保留换行和空格）
        if (node.content) html += escape(node.content);
        tagStack.push(node.tag);
        tagStack.push('code');
        break;


      case 'code_block_close':
        const closeCode = tagStack.pop();
        const closePre = tagStack.pop();
        html += `</${closeCode}></${closePre}>\n`;
        break;

      //1-6级标签
      case 'heading_1_open':
      case 'heading_2_open':
      case 'heading_3_open':
      case 'heading_4_open':
      case 'heading_5_open':
      case 'heading_6_open':
        html += `<${node.tag}>`;
        tagStack.push(node.tag);
        if (node.children) {
          const inlineChild = node.children.find(c => c.type === 'inline');
          if (inlineChild) html += inlineNodeParse(inlineChild.children);
        }
        break;


      case 'heading_1_close':
      case 'heading_2_close':
      case 'heading_3_close':
      case 'heading_4_close':
      case 'heading_5_close':
      case 'heading_6_close':
        html += `</${tagStack.pop()}>\n`;
        break;

      //hr
      case 'horizontal_rule':
        html += `<${node.tag}>\n`;
        break;

      //脚注
      case 'footnote_footer_open':
        html += `<${node.tag}>\n`;
        tagStack.push(node.tag);
        break;


      //关联脚注引用
      case 'footnote_def_open':
        html += `<p id="footnote-${node.slug || escape(String(node.id))}">`;
        tagStack.push('p');
        if (node.children) {
          const inlineChild = node.children.find(c => c.type === 'inline');
          if (inlineChild) html += inlineNodeParse(inlineChild.children);
        }
        break;


      case 'footnote_def_close':
        html += `</${tagStack.pop()}>\n`;
        break;


      case 'footnote_footer_close':
        html += `</${tagStack.pop()}>\n`;
        break;



      //下面是行内节点
      case 'inline':
        html += inlineNodeParse(node.children);
        break;

      case 'text':
        html += escape(node.content).replace(/\n/g, '<br>').replace(/\s{2,}/g, ' ');
        break;

      case 'br':
        html += '<br>';
        break;

      case 'code_inline':
        html += `<code>${escape(node.content)}</code>`;
        break;

      case 'del_inline':
        html += `<del>${escape(node.content)}</del>`;
        break;

      case 'image':
        const imgTitle = node.title ? `title="${escape(node.title)}"` : '';
        html += `<img src="${escape(node.src)}" alt="${escape(node.alt)}" ${imgTitle}>`;
        break;

      //链接
      case 'link_open':
        const linkTitle = node.title ? `title="${escape(node.title)}"` : '';
        const target = /^https?:/i.test(node.href) ? ' target="_blank"' : '';
        html += `<a href="${escape(node.href)}"${target} ${linkTitle}>`;
        tagStack.push(node.tag);
        break;

      case 'link_close':
        html += `</${tagStack.pop()}>`;
        break;

      case 'del_open':
        html += `<del>`;
        tagStack.push('del');
        break;

      case 'del_close':
        html += `</${tagStack.pop()}>`;
        break;

      //原始html
      case 'html_inline':
        html += node.content;
        break;

      //复选框
      case 'task_checkbox':
        html += `<input type="checkbox"${node.checked ? ' checked' : ''} disabled>`;
        break;

      //脚注引用
      case 'footnote_ref':
        html += `<sup><a href="#footnote-${node.slug || escape(String(node.id))}">${escape(String(node.id))}</a></sup>`;
        break;

      case 'strong_open':
        html += `<${node.tag}>`;
        tagStack.push(node.tag);
        break;

      case 'strong_close':
        html += `</${tagStack.pop()}>`;
        break;

      case 'em_open':
        html += `<${node.tag}>`;
        tagStack.push(node.tag);
        break;

      case 'em_close':
        html += `</${tagStack.pop()}>`;
        break;
    }
  });

  // 清理多余空行，返回标准HTML
  return html.trim().replace(/\n{2,}/g, '\n');
}

export default renderer;
