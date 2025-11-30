/**
 * 辅助函数：判断是否为行内容器
 */
function isInlineContainer(blockType) {
  const inlineTypes = [
    'paragraph_open',
    'blockquote_open',
    'list_item_open',
    'footnote_def_open',
    'heading_1_open',
    'heading_2_open',
    'heading_3_open',
    'heading_4_open',
    'heading_5_open',
    'heading_6_open'
  ];
  return inlineTypes.includes(blockType);
}