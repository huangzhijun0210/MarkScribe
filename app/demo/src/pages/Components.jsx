import { useRef,useState } from 'react';
import Toolbar from '../components/Toolbar';
import styles from '../scss/components.module.scss'

export default function Components({ dark }) {
  const [markdown, setMarkdown] = useState('# Hello MarkScribe!');
  const textareaRef = useRef(null);

  const compiledHtml = `<h1>${markdown.replace(/^#\s*/, '')}</h1>`;

  return (
    <div className={styles.compLayout}  style={{ background: dark ? '#222' : '#fff', color: dark ? '#eee' : '#222' }}>
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
          >{markdown}
          </div>
        </div>
      </div>
      

    </div>
  );
}