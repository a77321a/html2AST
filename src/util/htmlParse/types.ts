
// 节点类型
export enum SyntaxKind {
  Text = 'Text',
  Tag = 'Tag',
}
// 基础节点
// export interface BaseNode {
//   start: number;
//   end: number;
// }
// 文本节点
export interface Text  {
  type: SyntaxKind.Text;
  value: string;
}
// 属性值
export interface AttributeValue  {
  value: string;
  quote: "'" | '"' | undefined;
}
// 属性
export interface Attribute {
  name: Text;
  value: AttributeValue | undefined;
}
// 标准tag
export interface Tag  {
  type: SyntaxKind.Tag;
  start:number;
  end:number;
  parent: Tag | void;
  // 开启标签全部
  tagOpen: Text | string;
  // 节点名
  name: string;
  // 原始节点名
  tagName: string;
  // 属性列表
  attributes: Attribute[];
  // 子节点列表, 如果是一个非自闭合的标签, 并且起始标签已结束, 则为一个数组
  children:
    | Array<Tag | Text> 
    | void // 如果是一个自闭合的标签, 则为void
    | null;  // 如果起始标签未结束, 则为null
  tagClose:| string
    | Text // 关闭标签部分, 存在则为一个文本
    | void // 自闭合的标签没有关闭部分
    | null; // 非自闭合标签, 但是没有关闭标签部分
}

export type VNode = Text | Tag;
