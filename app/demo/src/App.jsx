import { mdToHtml } from '@markscribe/core';

function App() {
  console.log(mdToHtml('# hello')); // ← 这里打印
  return <div>看控制台</div>;
}
export default App;