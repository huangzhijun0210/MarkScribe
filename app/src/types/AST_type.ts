import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { parseToTokens } from '../util/parser_core';
export interface BaseToken {
    //先弄简易版paragraph_open、inline（text、strong_open）、paragraph_close  
    type: string;
    //标签名
    tag?: string;
    //嵌套层级标识：1=开始标签，-1=结束标签，0=无嵌套（文本/行内元素）
    nesting?: 1 | -1 | 0;
    //标记符，例如加粗**
    markup?: string;
    //文本内容（仅 text/inline 类 Token 有）
    content?: string;
    //子 Token 列表（仅 inline 类 Token 有）
    children?: Token[];
}

/**
 * 段落开始 Token（type: "paragraph_open"）
 */
export interface ParagraphOpenToken extends BaseToken {
    type: "paragraph_open";
}

/**
 * 段落结束 Token（type: "paragraph_close"）
 */
export interface ParagraphCloseToken extends BaseToken {
    type: "paragraph_close";
}

/**
 * 文本 Token（type: "text"）
 */
export interface TextToken extends BaseToken {
    type: "text";
  
    content: string;
    nesting?: 0;
}

/**
 * 加粗开始 Token（type: "strong_open"）
 */
export interface StrongOpenToken extends BaseToken {
    type: "strong_open";
    tag: "strong";
    nesting: 1;
    markup: "**";
}

/**
 * 加粗结束 Token（type: "strong_close"）
 */
export interface StrongCloseToken extends BaseToken {
    type: "strong_close";
    tag: "strong";
    nesting: -1;
    markup: "**";
}

/**
 * 行内容器 Token（type: "inline"，包含子 Token）
 */
export interface InlineToken extends BaseToken {
    type: "inline";
    content: string;
    children: Token[];
    nesting?: 0;
}

//所有 Token 类型
export type Token =
    | ParagraphOpenToken
    | ParagraphCloseToken
    | TextToken
    | StrongOpenToken
    | StrongCloseToken
    | InlineToken;


export type TokenList = Token[];
