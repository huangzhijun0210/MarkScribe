import renderer from '../renderer/renderer';

// 将 parser 生成的 AST（数组）分割为 top-level block 节点组
function splitTopLevelBlocks(ast) {
  const blocks = [];
  let i = 0;
  while (i < ast.length) {
    const node = ast[i];
    // 如果是打开类节点（nesting === 1）则找对应关闭
    if (node && node.nesting === 1) {
      const startType = node.type;
      const group = [node];
      let depth = 1;
      i++;
      while (i < ast.length && depth > 0) {
        const n = ast[i];
        group.push(n);
        if (n.nesting === 1) depth++;
        else if (n.nesting === -1) depth--;
        i++;
      }
      blocks.push(group);
    } else {
      // standalone node (nesting 0) 或无 nesting 信息，作为单独块
      blocks.push([node]);
      i++;
    }
  }
  return blocks;
}

// 生成块的 HTML（使用现有 renderer）
function renderBlockHtml(blockAst) {
  try {
    return renderer(blockAst);
  } catch (e) {
    // fallback: join text
    return blockAst.map(n => n.content || '').join('');
  }
}

// 对 container 中的子节点按块 diff 并最小化 DOM 更新
export function renderToDOM(container, ast) {
  if (!container) return;
  const newBlocks = splitTopLevelBlocks(ast || []);
  const prev = container.__md_blocks || [];

  // 比较并更新
  const maxLen = Math.max(prev.length, newBlocks.length);
  for (let i = 0; i < maxLen; i++) {
    const newBlock = newBlocks[i];
    const prevHtml = prev[i] && prev[i].html;
    const newHtml = newBlock ? renderBlockHtml(newBlock) : null;

    if (newBlock && prevHtml === newHtml) {
      // unchanged, skip
      continue;
    }

    if (newBlock && !prevHtml) {
      // append new DOM element
      const el = document.createElement('div');
      el.className = 'ms-block';
      el.innerHTML = newHtml;
      container.appendChild(el);
      prev[i] = { html: newHtml, el };
      continue;
    }

    if (newBlock && prevHtml && prev[i]) {
      // replace or update existing element
      const existing = prev[i].el;
      if (existing) {
        // simple strategy: replace innerHTML if different
        existing.innerHTML = newHtml;
        prev[i].html = newHtml;
      } else {
        const el = document.createElement('div');
        el.className = 'ms-block';
        el.innerHTML = newHtml;
        // if DOM has node at i, replace, else append
        const child = container.childNodes[i];
        if (child) container.replaceChild(el, child); else container.appendChild(el);
        prev[i] = { html: newHtml, el };
      }
      continue;
    }

    if (!newBlock && prev[i]) {
      // new blocks shorter than prev: remove trailing
      const existing = prev[i].el;
      if (existing && existing.parentNode === container) container.removeChild(existing);
      prev.splice(i, 1);
      i--;
      continue;
    }
  }

  // store new blocks info
  container.__md_blocks = prev.slice(0, newBlocks.length);
}

export default { renderToDOM };
