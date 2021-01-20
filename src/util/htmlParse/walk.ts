
import { VNode, SyntaxKind } from './types';

export interface WalkOptions {
  enter?(node: VNode, parent: VNode | undefined, index: number): void;
  leave?(node: VNode, parent: VNode | undefined, index: number): void;
}

function visit(node: VNode, parent: VNode | undefined, index: number, options: WalkOptions) {
  options.enter && options.enter(node, parent, index);
  if (node.type === SyntaxKind.Tag && Array.isArray(node.children)) {
    for (let i = 0; i < node.children.length; i++) {
      visit(node.children[i], node, i, options);
    }
  }
  options.leave && options.leave(node, parent, index);
}

export function walk(ast: VNode[], options: WalkOptions) {
  for (let i = 0; i < ast.length; i++) {
    visit(ast[i], void 0, i, options);
  }
}
