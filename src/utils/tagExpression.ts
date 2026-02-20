export type TagName = string;

export type TagExprNodeType = 'tag' | 'and' | 'or' | 'not';

export interface TagExprNodeBase {
  type: TagExprNodeType;
}

export interface TagExprTagNode extends TagExprNodeBase {
  type: 'tag';
  value: TagName;
}

export interface TagExprNotNode extends TagExprNodeBase {
  type: 'not';
  child: TagExprNode;
}

export interface TagExprBinaryNode extends TagExprNodeBase {
  type: 'and' | 'or';
  left: TagExprNode;
  right: TagExprNode;
}

export type TagExprNode = TagExprTagNode | TagExprNotNode | TagExprBinaryNode;

export function tag(value: TagName): TagExprTagNode {
  return { type: 'tag', value };
}

export function and(left: TagExprNode, right: TagExprNode): TagExprBinaryNode {
  return { type: 'and', left, right };
}

export function or(left: TagExprNode, right: TagExprNode): TagExprBinaryNode {
  return { type: 'or', left, right };
}

export function not(child: TagExprNode): TagExprNotNode {
  return { type: 'not', child };
}

function escapeTag(tagValue: TagName): string {
  return tagValue.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function wrap(node: TagExprNode): string {
  switch (node.type) {
    case 'tag':
      return `(?=.*${escapeTag(node.value)})`;
    case 'not': {
      const child = node.child;
      switch (child.type) {
        case 'tag':
          // Base case: simple negative lookahead.
          return `(?!.*${escapeTag(child.value)})`;
        case 'not':
          // Double negation: not(not(X)) === X.
          return wrap(child.child);
        case 'and':
          // De Morgan: not(A and B) === not(A) or not(B).
          return wrap(or(not(child.left), not(child.right)));
        case 'or':
          // De Morgan: not(A or B) === not(A) and not(B).
          return wrap(and(not(child.left), not(child.right)));
      }
      break;
    }
    case 'and':
      return `${wrap(node.left)}${wrap(node.right)}`;
    case 'or': {
      const left = wrap(node.left);
      const right = wrap(node.right);
      return `(?:${left}|${right})`;
    }
    default:
      return '';
  }
}

export function toPlaywrightGrepPattern(node: TagExprNode): string {
  return `${wrap(node)}.*`;
}

interface Token {
  type: 'tag' | 'and' | 'or' | 'not';
  value?: string;
}

function tokenize(input: string): Token[] {
  const parts = input.trim().split(/\s+/);
  const tokens: Token[] = [];

  for (const part of parts) {
    if (part === '&&') {
      tokens.push({ type: 'and' });
    } else if (part === '||') {
      tokens.push({ type: 'or' });
    } else if (part === '!') {
      tokens.push({ type: 'not' });
    } else if (part.startsWith('!')) {
      tokens.push({ type: 'not' });
      tokens.push({ type: 'tag', value: part.slice(1) });
    } else {
      tokens.push({ type: 'tag', value: part });
    }
  }

  return tokens;
}

function parseTag(tokens: Token[], index: { value: number }): TagExprNode {
  const token = tokens[index.value];
  if (!token || token.type !== 'tag' || !token.value) {
    throw new Error('Expected tag');
  }
  index.value += 1;
  return tag(token.value);
}

function parseNot(tokens: Token[], index: { value: number }): TagExprNode {
  if (tokens[index.value]?.type === 'not') {
    index.value += 1;
    return not(parseNot(tokens, index));
  }
  return parseTag(tokens, index);
}

function parseAnd(tokens: Token[], index: { value: number }): TagExprNode {
  let node = parseNot(tokens, index);
  while (tokens[index.value]?.type === 'and') {
    index.value += 1;
    const right = parseNot(tokens, index);
    node = and(node, right);
  }
  return node;
}

function parseOr(tokens: Token[], index: { value: number }): TagExprNode {
  let node = parseAnd(tokens, index);
  while (tokens[index.value]?.type === 'or') {
    index.value += 1;
    const right = parseAnd(tokens, index);
    node = or(node, right);
  }
  return node;
}

export function parseTagExpression(input: string): TagExprNode {
  const tokens = tokenize(input);
  const index = { value: 0 };
  const node = parseOr(tokens, index);
  if (index.value < tokens.length) {
    throw new Error('Unexpected tokens at end of expression');
  }
  return node;
}
