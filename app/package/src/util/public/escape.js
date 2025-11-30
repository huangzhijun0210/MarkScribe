//字符转义，避免xss攻击和解析错乱
function escapeCell(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default escapeCell;