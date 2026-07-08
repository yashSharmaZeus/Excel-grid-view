
import { Data } from "./Data.js";
import { cellRefToRowCol, rowColToCellRef } from "./CellRef.js";

export type CellValue = number | string | null;

export class FormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaError";
  }
}

type TokenType = "NUMBER" | "IDENT" | "OP" | "LPAREN" | "RPAREN" | "EOF";

interface Token {
  type: TokenType;
  value: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    const ch = input[i] as string;

    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "LPAREN", value: ch });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "RPAREN", value: ch });
      i++;
      continue;
    }
    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(input[i + 1] || ""))) {
      let j = i;
      let numStr = "";
      while (j < n && /[0-9.]/.test(input[j] as string)) {
        numStr += input[j];
        j++;
      }
      tokens.push({ type: "NUMBER", value: numStr });
      i = j;
      continue;
    }
    if ("+-*/^".includes(ch)) {
      tokens.push({ type: "OP", value: ch });
      i++;
      continue;
    }
    if (/[A-Za-z]/.test(ch)) {
      let j = i;
      let ident = "";
      while (j < n && /[A-Za-z0-9]/.test(input[j] as string)) {
        ident += input[j];
        j++;
      }
      tokens.push({ type: "IDENT", value: ident.toUpperCase() });
      i = j;
      continue;
    }

    throw new FormulaError(`Unexpected character "${ch}" at position ${i}`);
  }

  tokens.push({ type: "EOF", value: "" });
  return tokens;
}

type AstNode =
  | { type: "Number"; value: number }
  | { type: "CellRef"; ref: string }
  | { type: "UnaryOp"; op: string; operand: AstNode }
  | { type: "BinaryOp"; op: string; left: AstNode; right: AstNode };

const CELL_REF_RE = /^[A-Z]+[0-9]+$/;

class Parser {
  private tokens: Token[];
  private pos = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token {
    const res: Token = this.tokens[this.pos] as Token;
    return res;
  }

  private next(): Token {
    const res: Token = this.tokens[this.pos++] as Token;
    return res;
  }

  private expect(type: TokenType): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      throw new FormulaError(`Expected ${type} but got ${tok.type} ("${tok.value}")`);
    }
    return this.next();
  }

  parse(): AstNode {
    const node = this.parseAdditive();
    this.expect("EOF");
    return node;
  }

  private parseAdditive(): AstNode {
    let left = this.parseTerm();
    while (this.peek().type === "OP" && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.next().value;
      const right = this.parseTerm();
      left = { type: "BinaryOp", op, left, right };
    }
    return left;
  }

  private parseTerm(): AstNode {
    let left = this.parsePower();
    while (this.peek().type === "OP" && (this.peek().value === "*" || this.peek().value === "/")) {
      const op = this.next().value;
      const right = this.parsePower();
      left = { type: "BinaryOp", op, left, right };
    }
    return left;
  }

  private parsePower(): AstNode {
    const base = this.parseUnary();
    if (this.peek().type === "OP" && this.peek().value === "^") {
      this.next();
      const exponent = this.parsePower(); // right-associative
      return { type: "BinaryOp", op: "^", left: base, right: exponent };
    }
    return base;
  }

  private parseUnary(): AstNode {
    if (this.peek().type === "OP" && (this.peek().value === "-" || this.peek().value === "+")) {
      const op = this.next().value;
      const operand = this.parseUnary();
      return { type: "UnaryOp", op, operand };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): AstNode {
    const tok = this.peek();

    if (tok.type === "NUMBER") {
      this.next();
      return { type: "Number", value: parseFloat(tok.value) };
    }

    if (tok.type === "LPAREN") {
      this.next();
      const expr = this.parseAdditive();
      this.expect("RPAREN");
      return expr;
    }

    if (tok.type === "IDENT") {
      this.next();
      if (CELL_REF_RE.test(tok.value)) {
        return { type: "CellRef", ref: tok.value };
      }
      throw new FormulaError(`Unrecognized identifier "${tok.value}"`);
    }

    throw new FormulaError(`Unexpected token "${tok.value}"`);
  }
}

export class FormulaEngine {
  private data: Data;
 
  constructor(data?: Data) {
    this.data = data ?? new Data();
  }

  normalizeFormula(formula: string): string {
    const normalized = formula.trim().startsWith("=") ? formula.trim() : `=${formula.trim()}`;
    return normalized
  }

  getValueAt(row: number, col: number): CellValue {
    return this.resolveCell(row, col, new Set());
  }

  evaluate(formula: string): number {
    const expr = formula.trim().startsWith("=") ? formula.trim().slice(1) : formula.trim();
    const ast = new Parser(tokenize(expr)).parse();
    return this.evalNode(ast, new Set());
  }

  getAllValues(): Record<string, CellValue> {
    const result: Record<string, CellValue> = {};
    for (const [row, col] of this.data.entries()) {
      const ref = rowColToCellRef(row, col);
      result[ref] = this.getValueAt(row, col);
    }
    return result;
  }

  getStore(): Data {
    return this.data;
  }


  private cacheKey(row: number, col: number): string {
    return `${row},${col}`;
  }

  private resolveCell(row: number, col: number, stack: Set<string>): CellValue {
    const key = this.cacheKey(row, col);

    if (stack.has(key)) {
      throw new FormulaError(`Circular reference detected at ${rowColToCellRef(row, col)}`);
    }

    const cell = this.data.getData(row, col);
    if (!cell || cell.value === "") return null;

    const trimmed = cell.value.trim();
    let result: CellValue;

    if (trimmed.startsWith("=")) {
      const nextStack = new Set(stack);
      nextStack.add(key);
      const ast = new Parser(tokenize(trimmed.slice(1))).parse();
      result = this.evalNode(ast, nextStack);
    } else if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
      result = parseFloat(trimmed); 
    } else {
      result = trimmed;
    }

    return result;
  }

  private evalNode(node: AstNode, stack: Set<string>): number {
    switch (node.type) {
      case "Number":
        return node.value;
      case "CellRef": {
        const { row, col } = cellRefToRowCol(node.ref);
        const v = this.resolveCell(row, col, stack);
        if (v === null) return 0;              
        if (typeof v === "string") {
          throw new FormulaError(`#VALUE! ${node.ref} contains text, not a number`);
        }
        return v;
      }
      case "UnaryOp": {
        const v = this.evalNode(node.operand, stack);
        return node.op === "-" ? -v : v;
      }
      case "BinaryOp": {
        const l = this.evalNode(node.left, stack);
        const r = this.evalNode(node.right, stack);
        switch (node.op) {
          case "+":
            return l + r;
          case "-":
            return l - r;
          case "*":
            return l * r;
          case "/":
            if (r === 0) throw new FormulaError("#DIV/0!");
            return l / r;
          case "^":
            return Math.pow(l, r);
          default:
            throw new FormulaError(`Unsupported operator "${node.op}"`);
        }
      }
      default: {
        const _exhaustive: never = node;
        throw new FormulaError(`Unknown node type: ${JSON.stringify(_exhaustive)}`);
      }
    }
  }
}

export default FormulaEngine;