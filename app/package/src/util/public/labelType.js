/**
 * 辅助函数：根据块级类型获取HTML标签
 */
function labelType(blockType) {
  const tagMap = {
    paragraph_open: 'p',
    paragraph_close: 'p',
    blockquote_open: 'blockquote',
    blockquote_close: 'blockquote',
    ordered_list_open: 'ol',
    ordered_list_close: 'ol',
    unordered_list_open: 'ul',
    unordered_list_close: 'ul',
    list_item_open: 'li',
    list_item_close: 'li',
    code_block_open: 'pre',
    code_block_close: 'pre',
    footnote_footer_open: 'footer',
    footnote_footer_close: 'footer',
    footnote_def_open: 'p',
    footnote_def_close: 'p',
    heading_1_open: 'h1',
    heading_1_close: 'h1',
    heading_2_open: 'h2',
    heading_2_close: 'h2',
    heading_3_open: 'h3',
    heading_3_close: 'h3',
    heading_4_open: 'h4',
    heading_4_close: 'h4',
    heading_5_open: 'h5',
    heading_5_close: 'h5',
    heading_6_open: 'h6',
    heading_6_close: 'h6'
  };
  return tagMap[blockType] || '';
}

export default labelType;