import { MarkScribe } from './MarkScribe.ts';
const { test, expect } = import.meta.vitest;



// 跑通测试
if (import.meta.vitest) {
  test("lexer", () => {
    expect(new MarkScribe().lexer(`这是一段**加粗**文本`)).toStrictEqual([
      {
        "type": "paragraph_open",
      },
      {
        "content": "这是一段",
        "type": "text",
      },
      {
        "markup": "**",
        "type": "strong_markup",
      },
      {
        "content": "加粗",
        "type": "text",
      },
      {
        "markup": "**",
        "type": "strong_markup",
      },
      {
        "content": "文本",
        "type": "text",
      },
      {
        "type": "paragraph_close",
      },
    ]);
  })


  test("parser", () => {
    let md = new MarkScribe();
    let res = md.lexer(`这是一段**加粗**文本`);
    expect(new MarkScribe().parser(res)).toStrictEqual([
      {
        "type": "paragraph_open",
        "tag": "p",
        "nesting": 1,
        "children": [
          {
            "type": "inline",
            "children": [
              {
                "type": "text",
                "content": "这是一段",
                "nesting": 0
              },
              {
                "type": "strong_open",
                "tag": "strong",
                "markup": "**",
                "nesting": 1
              },
              {
                "type": "text",
                "content": "加粗",
                "nesting": 0
              },
              {
                "type": "strong_close",
                "tag": "strong",
                "markup": "**",
                "nesting": -1
              },
              {
                "type": "text",
                "content": "文本",
                "nesting": 0
              }
            ],
            "content": ""
          }
        ]
      },
      {
        "type": "paragraph_close",
        "tag": "p",
        "nesting": -1
      }
    ])
  })


  test("render", () => {
    expect(new MarkScribe().render('这是一段**加粗**文本')).toStrictEqual('<p>这是一段<strong>加粗</strong>文本</p>')
  })
}

