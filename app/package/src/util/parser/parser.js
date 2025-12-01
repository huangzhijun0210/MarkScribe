import browserUrl from '../public/browserUrl';
import labelType from '../public/labelType';
import inlineType from '../public/inlineType'

/**
 * 语法分析器：修复Token解析逻辑，生成正确AST
 * @param {Array} tokens - 词法分析生成的Token数组
 * @returns {Array} 简化版AST
 */
// ast对象包括{
//   type（节点类型）
//   tag（对应 HTML 标签）
//   nesting（嵌套方向：1 = 打开、-1 = 关闭、0 = 自闭合）
//   children（子节点）
// }

// 代码将 Token 分为 3 类，分别处理：
// 块级节点（Block Node）：占据一整行 / 多整行，有嵌套关系（如段落、标题、列表、代码块）。
// 行内节点（Inline Node）：在块级节点内部，随文本流动（如文本、链接、图片、行内代码）。
// 特殊节点（无嵌套）：独立存在，无开合状态（如水平线 <hr>）。

//ast层次：块级节点 → 行内容器 → 行内节点”
function parser(tokens) {
  const ast = [];
  //用于处理 块级节点的嵌套关系（比如列表包含列表项、块引用包含段落）
  const stack = [];
  //用于处理 行内节点的嵌套关系（比如粗体包含斜体、删除线包含文本）
  const inlineStack = [];
  //当前活跃的「行内容器」（比如段落、标题内部的行内区域），行内节点（文本、链接、代码等）都会挂载到它的 children 中
  let currentInline = null;
  //currentCodeBlock：当前活跃的「代码块」，专门存储代码块的文本内容（代码块内无行内节点，直接拼接文本）。
  let currentCodeBlock = null;


  tokens.forEach(token => {
    switch (token.type) {
      // -------------------------- 块级节点（打开）--------------------------
      case 'paragraph_open':
      case 'blockquote_open':
      case 'ordered_list_open':
      case 'unordered_list_open':
      case 'list_item_open':
      case 'footnote_footer_open':
      case 'footnote_def_open':
      case 'heading_1_open':
      case 'heading_2_open':
      case 'heading_3_open':
      case 'heading_4_open':
      case 'heading_5_open':
      case 'heading_6_open': {
        const node = {
          type: token.type,
          tag: labelType(token.type),
          nesting: 1,
          children: [],
        };

        //行内容器初始化
        if (inlineType(token.type)) {
          currentInline = { type: 'inline', children: [], content: '' };
          inlineStack.length = 0;// 清空行内栈
          node.children.push(currentInline);
        }

        stack.push(node); // 块级节点入栈（用于后续嵌套处理）
        ast.push(node); // 节点加入 AST
        break;
      }

      //代码块打开（单独处理）
      case 'code_block_open': {
        const node = {
          type: token.type,
          tag: 'pre',
          nesting: 1,
          children: [],
          lang: token.lang,
          content: ''
        };
        stack.push(node);
        currentCodeBlock = node;
        ast.push(node);
        break;
      }

      // -------------------------- 块级节点（关闭）--------------------------
      case 'paragraph_close':
      case 'blockquote_close':
      case 'ordered_list_close':
      case 'unordered_list_close':
      case 'list_item_close':
      case 'footnote_footer_close':
      case 'footnote_def_close':
      case 'heading_1_close':
      case 'heading_2_close':
      case 'heading_3_close':
      case 'heading_4_close':
      case 'heading_5_close':
      case 'heading_6_close': {
        stack.pop();
        const closeNode = {
          type: token.type,
          tag: labelType(token.type),
          nesting: -1
        };
        ast.push(closeNode);
        //行内容器改变指向(出栈后要指向父块的行内区域)
        currentInline = stack.length > 0 && inlineType(stack[stack.length - 1].type)
          ? stack[stack.length - 1].children.find(child => child.type === 'inline')
          : null;
        break;
      }

      //代码块关闭（单独处理）
      case 'code_block_close': {
        stack.pop();
        const closeNode = {
          type: token.type,
          tag: 'pre',
          nesting: -1
        };
        ast.push(closeNode);
        //代码块关闭，活跃代码块置空
        currentCodeBlock = null;
        break;
      }

      // -------------------------- 水平线（无嵌套）--------------------------
      case 'horizontal_rule': {
        ast.push({
          type: 'horizontal_rule',
          tag: 'hr',
          nesting: 0
        });
        break;
      }

      // -------------------------- 行内节点 --------------------------
      case 'text': {
        // 代码块文本
        if (currentCodeBlock) {
          currentCodeBlock.content += token.content;
          break;
        }
        // 普通行内文本
        if (currentInline) {
          currentInline.children.push({
            type: 'text',
            content: token.content,
            nesting: 0
          });
          //currentInline.content += token.content;
        }
        break;
      }

      case 'br': {
        if (currentInline) {
          currentInline.children.push({ type: 'br', nesting: 0 });
        }
        break;
      }

      case 'code_inline': {
        if (currentInline) {
          currentInline.children.push({
            type: 'code_inline',
            tag: 'code',
            content: token.content,
            nesting: 0
          });
          //currentInline.content += `\`${token.content}\``;
        }
        break;
      }

      case 'del_inline': {
        if (currentInline) {
          currentInline.children.push({
            type: 'del_inline',
            tag: 'del',
            content: token.content,
            nesting: 0
          });
        }
        break;
      }

      // 删除线文本
      case 'del_markup': {
        if (currentInline) {
          const top = inlineStack[inlineStack.length - 1];
          // 栈顶无对应打开节点 生成打开节点
          if (!top || top.type !== 'del_open') {
            const delOpen = { type: 'del_open', tag: 'del', markup: token.markup, nesting: 1 };
            currentInline.children.push(delOpen);
            inlineStack.push(delOpen);
            //有的话就生成关闭
          } else {
            const delClose = { type: 'del_close', tag: 'del', markup: token.markup, nesting: -1 };
            currentInline.children.push(delClose);
            inlineStack.pop();
          }
        }
        break;
      }

      // 斜体
      case 'em_markup': {
        if (currentInline) {
          const top = inlineStack[inlineStack.length - 1];
          if (!top || top.type !== 'em_open') {
            const emOpen = { type: 'em_open', tag: 'em', markup: token.markup, nesting: 1 };
            currentInline.children.push(emOpen);
            inlineStack.push(emOpen);
          } else {
            const emClose = { type: 'em_close', tag: 'em', markup: token.markup, nesting: -1 };
            currentInline.children.push(emClose);
            inlineStack.pop();
          }
        }
        break;
      }

      // 粗体
      case 'strong_markup': {
        if (currentInline) {
          const top = inlineStack[inlineStack.length - 1];
          if (!top || top.type !== 'strong_open') {
            const strongOpen = { type: 'strong_open', tag: 'strong', markup: token.markup, nesting: 1 };
            currentInline.children.push(strongOpen);
            inlineStack.push(strongOpen);
          } else {
            const strongClose = { type: 'strong_close', tag: 'strong', markup: token.markup, nesting: -1 };
            currentInline.children.push(strongClose);
            inlineStack.pop();
          }
        }
        break;
      }

      case 'image': {
        if (currentInline) {
          currentInline.children.push({
            type: 'image',
            tag: 'img',
            alt: token.alt,
            src: token.src,
            title: token.title,
            nesting: 0
          });
          //currentInline.content += `![${token.alt}](${token.src}${token.title ? ` "${token.title}"` : ''})`;
        }
        break;
      }

      //链接（[文本](href "title")）
      case 'link': {
        if (currentInline) {
          currentInline.children.push({
            type: 'link_open',
            tag: 'a',
            href: token.href, //地址href
            title: token.title, //标题title
            nesting: 1
          });

          //图片格式链接的正则
          const mImg = /^!\[([^\]]*)\]\((\s*[^)"\s]+\s*)(?:["']([^"']*)["'])?\)$/.exec(token.text || '');
          if (mImg) {
            const alt = mImg[1] || '';
            const src = browserUrl((mImg[2] || '').trim());  //清理多余空格
            const title = mImg[3] || '';
            currentInline.children.push({ type: 'image', tag: 'img', alt, src, title, nesting: 0 });
          } else {
            currentInline.children.push({ type: 'text', content: token.text, nesting: 0 });
          }
          currentInline.children.push({ type: 'link_close', tag: 'a', nesting: -1 });
          //currentInline.content += `[${token.text}](${token.href}${token.title ? ` "${token.title}"` : ''})`;
        }
        break;
      }

      //行内html（如<span>文本</span>）
      case 'html_inline': {
        if (currentInline) {
          currentInline.children.push({ type: 'html_inline', content: token.content, nesting: 0 });
        } else {
          ast.push({ type: 'html_inline', content: token.content, nesting: 0 });
        }
        break;
      }

      //任务复选框（-[x] 文本）
      case 'task_checkbox': {
        if (currentInline) {
          currentInline.children.push({ type: 'task_checkbox', checked: token.checked, nesting: 0 });
        }
        break;
      }

      //脚注
      case 'footnote_ref': {
        if (currentInline) {
          currentInline.children.push({ type: 'footnote_ref', id: token.id, slug: token.slug, nesting: 0 });
        }
        break;
      }

    }
  });

  return ast;
}

export default parser;
