import { useState, Suspense } from 'react';
import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { ConfigProvider, Switch, Space, theme } from 'antd';
import { routes } from './router';
import styles from './scss/app.module.scss';
export default function App() {
  const [dark, setDark] = useState(false);
  return (
    <div className={styles.appStyles} >
      <BrowserRouter>
        <header className={styles.head} style={{background: dark ? '#222' : '#fff'}}>
          <nav>
            <Space size="large">
              {routes.map(r => (
                <NavLink key={r.path} to={r.path} className={styles.navLink}  style={{color: dark ? '#ffffffff' : ''}}>
                  {r.name}
                </NavLink>
              ))}
            </Space>
          </nav>
          <div>
            <Switch checked={dark} onChange={setDark} checkedChildren="🌙" unCheckedChildren="☀️" />
          </div>
        </header>
        <div style={{ display: 'flex', height: '100vh', paddingTop: 64, boxSizing: 'border-box' ,background: dark ? '#222' : '#fff'}} >
            <main style={{ flex: 1, padding: 24, height: 'calc(100vh - 64px)', overflow: 'auto', minWidth: 0 }}>
            <Suspense fallback={<div>加载中...</div>}>
              <Routes>
                {routes.map(r => (
                  <Route key={r.path} path={r.path} element={r.element && r.element.type ? React.createElement(r.element.type, { dark }) : r.element} />
                ))}
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </div>
  );
}