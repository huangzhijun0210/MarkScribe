import renderInlineChildren from './inline_node_parse'


//根据换行拆分
function splitBlockquoteBr(children) {
  const index = children.findIndex(c => c.type === 'br');
  if (index === -1) return { prefix: renderInlineChildren(children), reNode: [] };
  const children1 = children.slice(0, index);
  const children2 = children.slice(index + 1);
  return { prefix: renderInlineChildren(children1), reNode: children2 };
}

export default splitBlockquoteBr;