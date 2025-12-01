
import lexer from './util/lexer/lexer';
import parser from './util/parser/parser'
import renderer from './util/renderer/renderer';

export type MarkScribeOptions = {
    html?: false,        // 在源码中启用 HTML 标签
    xhtmlOut?: false,        // 使用 '/' 来闭合单标签 （比如 <br />）。
    // 这个选项只对完全的 CommonMark 模式兼容。
    breaks?: boolean,        // 转换段落里的 '\n' 到 <br>。
    langPrefix?: 'language-',  // 给围栏代码块的 CSS 语言前缀。对于额外的高亮代码非常有用。
    linkify?: false,        // 将类似 URL 的文本自动转换为链接。

    // 启用一些语言中立的替换 + 引号美化
    typographer?: false,

    // 双 + 单引号替换对，当 typographer 启用时。
    // 或者智能引号等，可以是 String 或 Array。
    //
    // 比方说，你可以支持 '«»„“' 给俄罗斯人使用， '„“‚‘'  给德国人使用。
    // 还有 ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] 给法国人使用（包括 nbsp）。
    quotes?: '“”‘’',

    // 高亮函数，会返回转义的HTML。
    // 或 '' 如果源字符串未更改，则应在外部进行转义。
    // 如果结果以 <pre ... 开头，内部包装器则会跳过。
    highlight?: (str: string, lang: string) => string;

}

// 定义默认配置
const OPTIONS: MarkScribeOptions = {
    html: false,
    xhtmlOut: false,
    breaks: true,
    langPrefix: 'language-',
    linkify: false,
    typographer: false,
    quotes: '“”‘’',
}


//词法分析
MarkScribe.prototype.lexer = function (text: string, env: any = {}) {
    if (typeof text !== 'string') {
        throw new Error('Input data should be a String')
    }
    return lexer(text)
}

//语法分析
MarkScribe.prototype.parser = function (tokens: string[]) {
    
    return parser(tokens);
}

//html渲染
MarkScribe.prototype.renderer = function(ast:string[]){
    return renderer(ast);
}

//解析器直接方法
MarkScribe.prototype.render = function (text: string, env: any = {}) {
    if (typeof text !== 'string') {
        throw new Error('Input data should be a String')
    }
    // 三阶段流程：词法分析 → 语法分析 → HTML渲染
    const tokens = lexer(text);
    const ast = parser(tokens);
    const html = renderer(ast);
    return html;
}

    // 合并用户配置和默认配置
export function MarkScribe(this: any, options?: Partial<MarkScribeOptions>) {
    this.options = { ...OPTIONS, ...options };
}

