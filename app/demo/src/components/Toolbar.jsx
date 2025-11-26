import { Button, Space, Divider, Tooltip } from 'antd';
import {
  BoldOutlined,
  ItalicOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  MessageOutlined,        // ✅ 替代 QuoteOutlined
  CodeOutlined,
  LinkOutlined,
  PictureOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { H1,H2,H3 } from '@icon-park/react';

const icons = {
  h1: <H1/>, h2: <H2 />, h3: <H3 />,
  bold: <BoldOutlined />, italic: <ItalicOutlined />, strike: <StrikethroughOutlined />,
  ol: <OrderedListOutlined />, ul: <UnorderedListOutlined />, quote: <MessageOutlined />,
  code: <CodeOutlined />, link: <LinkOutlined />, img: <PictureOutlined />, table: <TableOutlined />,
};

/* 核心：插入/包裹文本并恢复光标 */
function insert(textarea, before, after = '') {
  const start = textarea.selectionStart;
  const end   = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const newText = textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
  // 触发父级 onChange
  const nativeInput = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
  nativeInput.set.call(textarea, newText);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  // 恢复光标
  const cursor = start + before.length + selected.length + after.length;
  textarea.setSelectionRange(cursor, cursor);
  textarea.focus();
}
export default function Toolbar({ textRef }) {
  const map = [
    { key: 'h1', tip: 'H1', icon: icons.h1 },
    { key: 'h2', tip: 'H2', icon: icons.h2 },
    { key: 'h3', tip: 'H3', icon: icons.h3 },
    'divider',
    { key: 'bold', tip: '加粗', icon: icons.bold },
    { key: 'italic', tip: '斜体', icon: icons.italic },
    { key: 'strike', tip: '删除线', icon: icons.strike },
    'divider',
    { key: 'ul', tip: '无序列表', icon: icons.ul },
    { key: 'ol', tip: '有序列表', icon: icons.ol },
    { key: 'quote', tip: '引用', icon: icons.quote },
    'divider',
    { key: 'code', tip: '代码块', icon: icons.code },
    { key: 'link', tip: '链接', icon: icons.link },
    { key: 'img', tip: '图片', icon: icons.img },
    { key: 'table', tip: '表格', icon: icons.table },
  ];

  const actions = {
    h1: ['# ', ''],
    h2: ['## ', ''],
    h3: ['### ', ''],
    bold: ['**', '**'],
    italic: ['*', '*'],
    strike: ['~~', '~~'],
    quote: ['> ', ''],
    code: ['```\n', '\n```'],
    link: ['[', '](url)'],
    img:  ['![', '](url)'],
    ul: ['- ', ''],
    ol: ['1. ', ''],
    table: ['\n| 表头1 | 表头2 |\n|-------|-------|\n| 内容1 | 内容2 |\n', ''],
  };

  const handleClick = key => () => {
    const [b, a] = actions[key] || ['', ''];
    insert(textRef.current, b, a);
  };

  const btnStyle = { border: 'none', boxShadow: 'none', fontWeight:400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 8px', background: 'transparent',color:'#8a8a8aff' };
  const dividerStyle = { height: 24, borderWidth: 3, borderColor: '#d1dbebff', margin: '0 6px' };

  return (
    <div>
      <Space wrap>
        {map.map((item, idx) =>
          item === 'divider'
            ? <Divider key={idx} type="vertical" style={dividerStyle} />
            : <Tooltip key={item.key} title={item.tip}><Button size="small" icon={item.icon} onClick={handleClick(item.key)} style={btnStyle} /></Tooltip>
        )}
      </Space>
    </div>
  );
}