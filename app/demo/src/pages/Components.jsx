import { useRef, useState, useEffect } from 'react';
import Toolbar from '../components/Toolbar';
import styles from '../scss/components.module.scss'
import { MarkScribe, blockPatcher } from '@markscribe/core';

export default function Components({ dark }) {
  const md = new MarkScribe();
  const [markdown, setMarkdown] = useState('# Hello MarkScribe!');
  const textareaRef = useRef(null);

  const compiledHtml = `<h1>${markdown.replace(/^#\s*/, '')}</h1>`;
  const previewRef = useRef(null);

  // use block patcher to update preview when markdown changes
  usePreview(md, markdown, previewRef);

  return (
    <div className={styles.compLayout} style={{ background: dark ? '#222' : '#fff', color: dark ? '#eee' : '#222' }}>
      <div className={styles.com}>
        <div className={styles.compEditor}>
          <div className={styles.Toolbar}><Toolbar textRef={textareaRef} /></div>
          <textarea
            ref={textareaRef}
            value={markdown}
            onChange={e => setMarkdown(e.target.value)}
            className={styles.compTextarea}
            style={{ background: dark ? '#222' : '#fff', color: dark ? '#eee' : '#222', borderColor: dark ? '#444' : '#ddd' }}
          />
        </div>
        <div className={`${styles.compSource} ${dark ? styles.dark : ''}`}>
          <div
            className={styles.compTextarea}
            style={{
              background: dark ? '#222' : '#fff',
              color: dark ? '#eee' : '#222',
              borderColor: dark ? '#444' : '#ddd',
            }}
          >
            <div ref={previewRef} className={styles.renderHtml} />
          </div>
        </div>
      </div>


    </div>
  );
}

// effect: render markdown to AST and patch DOM on changes
function usePreview(mdInstance, markdown, previewRef) {
  useEffect(() => {
    if (!previewRef.current) return;
    try {
      const tokens = mdInstance.lexer(markdown);
      const ast = mdInstance.parser(tokens);
      blockPatcher.renderToDOM(previewRef.current, ast);
    } catch (e) {
      // fallback: full render
      previewRef.current.innerHTML = mdInstance.render(markdown);
    }
  }, [mdInstance, markdown, previewRef]);
}

// hook usage
// helper hook is defined above (usePreview)