import { lazy } from 'react';
const Guide    = lazy(() => import('../pages/Guide'));
const Parser   = lazy(() => import('../pages/Parser'));
const Renderer = lazy(() => import('../pages/Renderer'));
const Comp     = lazy(() => import('../pages/Components'));
const Team     = lazy(() => import('../pages/Team'));
const Profile  = lazy(() => import('../pages/Profile'));

export const routes = [
  { path: '/',          name: '指南',     element: <Guide />    },
  { path: '/parser',    name: '解释器',   element: <Parser />   },
  { path: '/renderer',  name: '渲染器',   element: <Renderer /> },
  { path: '/comp',      name: '组件',     element: <Comp />     },
  { path: '/team',      name: '团队',     element: <Team />     },
  { path: '/profile',   name: '用户中心', element: <Profile />  },
];