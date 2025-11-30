//http和https正则
function httpAndHttpsUrl(url) {
  const res = (url || '').trim();
  if (/^https?:/i.test(res)) return res.replace(/[,;]+$/g, '');
  return res;
}

export default httpAndHttpsUrl;