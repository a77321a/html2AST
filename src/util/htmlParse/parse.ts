

import { noNestedTags, selfCloseTags } from './config';
import { Token, tokenize, TokenKind } from './tokenize';
import { Attribute, AttributeValue, VNode, Tag, Text, SyntaxKind } from './types';
import { getLineRanges, getPosition } from './utils';
import { walk } from './walk';

interface Context {
  parent: Context | undefined;
  tag: Tag;
}

export interface ParseOptions {
  // create tag's attributes map
  // if true, will set Tag.attributeMap property
  // as a `Record<string, Attribute>`
  setAttributeMap: boolean;
}

let index: number;
let count: number;
let tokens: Token[];
let target: Context | undefined;
let nodes: VNode[];
let token: Token;
let node: Text | undefined;
let buffer: string;
let lines: number[] | undefined;
let parseOptions: ParseOptions | undefined;

function init(input?: string, options?: ParseOptions) {
  if (input === void 0) {
    count = 0;
    tokens.length = 0;
    buffer = '';
  } else {
    tokens = tokenize(input);
    count = tokens.length;
    buffer = input;
  }
  
  index = 0;
  target = void 0;
  nodes = [];
  token = void 0 as any;
  node = void 0;
  lines = void 0;
  parseOptions = options;
}

function pushNode(_node: Tag | Text) {
  // 当前标签
  if (!target) {
    nodes.push(_node);
  } else if (
    _node.type === SyntaxKind.Tag &&
    _node.name === target.tag.name &&
    noNestedTags[_node.name]
  ) {
    target = target.parent;
    pushNode(_node);
  } else if (target.tag.children) {
    if(_node.type === SyntaxKind.Text){
      target.tag.tagOpen.value += _node.value
      target.tag.end = _node.end
    }else{
      target.tag.end = _node.end
      _node.parent = target
      target.tag.children.push(_node);
    }
    
  }
}

function pushTagChain(tag: Tag) {
  target = { parent: target, tag: tag };
  node = void 0;
}

function createLiteral(start = token.start, end = token.end, value = token.value): Text {
  return { start, end, value, type: SyntaxKind.Text };
}

function createTag(): Tag {
  return {
    start: token.start - 1, // include <
    end: token.end,
    type: SyntaxKind.Tag,
    tagOpen: createLiteral(token.start - 1), // not finished
    className:[],
    name: token.value,
    tagName: buffer.substring(token.start, token.end),
    attributes: [],
    attributeMap: void 0,
    children: null,
    tagClose: null,
  };
}

function createAttribute(): Attribute {
  return {
    start: token.start,
    end: token.end,
    name: createLiteral(),
    value: void 0,
  };
}

function createAttributeValue(): AttributeValue {
  return {
    start: token.start,
    end: token.end,
    value:
      token.type === TokenKind.AttrValueNq
        ? token.value
        : token.value.substr(1, token.value.length - 2),
    quote:
      token.type === TokenKind.AttrValueNq
        ? void 0
        : token.type === TokenKind.AttrValueSq
        ? "'"
        : '"',
  };
}

function appendLiteral(_node: Text | AttributeValue = node as Text) {
  _node.value += token.value;
  _node.end = token.end;
}

function unexpected() {
  if (lines === void 0) {
    lines = getLineRanges(buffer);
  }
  const [line, column] = getPosition(lines, token.start);
  throw new Error(
    `Unexpected token "${token.value}(${token.type})" at [${line},${column}]` +
      (target ? ` when parsing tag: ${JSON.stringify(target.tag.name)}.` : ''),
  );
}

const enum OpenTagState {
  BeforeAttr,
  InName,
  AfterName,
  AfterEqual,
  InValue,
}

function parseOpenTag() {
  let state = OpenTagState.BeforeAttr;

  let attr: Attribute = void 0 as any;

  const tag = createTag();
  pushNode(tag);
  if (tag.name === '' || tag.name === '!' || tag.name === '!--') {
    tag.tagOpen.value = '<' + tag.tagOpen.value;
    if (index === count) {
      return;
    } else {
      token = tokens[++index];
      if (token.type !== TokenKind.OpenTagEnd) {
        node = createLiteral();
        tag.children = [node];
        while (++index < count) {
          token = tokens[index];
          if (token.type === TokenKind.OpenTagEnd) {
            node = void 0;
            break;
          }
          appendLiteral();
        }
      }
      tag.tagClose = createLiteral(token.start, token.end + 1, `${token.value}>`);
      tag.end = tag.tagClose.end;
    }
    return;
  }
  while (++index < count) {
    token = tokens[index];
    if (token.type === TokenKind.OpenTagEnd) {
      tag.end = tag.tagOpen.end = token.end + 1;
      tag.tagOpen.value = buffer.substring(tag.tagOpen.start, tag.tagOpen.end);
      if (token.value === '' && !selfCloseTags[tag.name]) {
        tag.children = [];
        pushTagChain(tag);
      } else {
        tag.children = void 0;
      }
      break;
    } else if (state === OpenTagState.BeforeAttr) {
      if (token.type !== TokenKind.Whitespace) {
        attr = createAttribute();
        state = OpenTagState.InName;
        tag.attributes.push(attr);
      }
    } else if (state === OpenTagState.InName) {
      if (token.type === TokenKind.Whitespace) {
        state = OpenTagState.AfterName;
      } else if (token.type === TokenKind.AttrValueEq) {
        state = OpenTagState.AfterEqual;
      } else {
        appendLiteral(attr.name);
      }
    } else if (state === OpenTagState.AfterName) {
      if (token.type !== TokenKind.Whitespace) {
        if (token.type === TokenKind.AttrValueEq) {
          state = OpenTagState.AfterEqual;
        } else {
          attr = createAttribute();
          state = OpenTagState.InName;
          tag.attributes.push(attr);
        }
      }
    } else if (state === OpenTagState.AfterEqual) {
      if (token.type !== TokenKind.Whitespace) {
        attr.value = createAttributeValue();
        if (token.type === TokenKind.AttrValueNq) {
          state = OpenTagState.InValue;
        } else {
          attr.end = attr.value.end;
          state = OpenTagState.BeforeAttr;
        }
      }
    } else {
      if (token.type === TokenKind.Whitespace) {
        attr.end = attr.value!.end;
        state = OpenTagState.BeforeAttr;
      } else {
        appendLiteral(attr.value);
      }
    }
  }
}

function parseCloseTag() {
  let _context = target;
  while (true) {
    if (!_context || token.value.trim() === _context.tag.name) {
      break;
    }
    _context = _context.parent;
  }
  if (!_context) {
    return;
  }
  _context.tag.tagClose = createLiteral(
    token.start - 2,
    token.end + 1,
    buffer.substring(token.start - 2, token.end + 1),
  );
  _context.tag.end = _context.tag.tagClose.end;
  _context = _context.parent;
  target = _context;
}
function formatAttr(attrList:any){
  const _attrList:any = []
  attrList.forEach(i => {
    _attrList.push({
      key:i.name.value,
      value:i.value.value
    })
  });
  return _attrList
}

function formatNode(nodeTree :Tag[]):void{
  for(const i in nodeTree){
    nodeTree[i].attributes = nodeTree[i].attributes && formatAttr(nodeTree[i].attributes)
    delete nodeTree[i].end
    delete nodeTree[i].start
    nodeTree[i].tagClose = nodeTree[i].tagClose?.value
    nodeTree[i].tagOpen = nodeTree[i].tagOpen?.value
    if(Array.isArray(nodeTree[i].children)){
      formatNode(nodeTree[i].children as Tag[])
    }
  }
}
export function parse(input: string, options?: ParseOptions): VNode[] {
  init(input, {
    setAttributeMap: false,
    ...options,
  } as ParseOptions);
  while (index < count) {
    token = tokens[index];
    // eslint-disable-next-line no-debugger
    switch (token.type) {
      case TokenKind.Literal:
        if (!node) {
          node = createLiteral();
          pushNode(node);
        } else {
          appendLiteral(node);
        }
        break;
      case TokenKind.OpenTag:
        node = void 0;
        parseOpenTag();
        break;
      case TokenKind.CloseTag:
        node = void 0;
        parseCloseTag();
        break;
      default:
        unexpected();
        break;
    }
    index++;
  }
  const _nodes = nodes;
  init();
  formatNode(_nodes);
  return _nodes;
}

