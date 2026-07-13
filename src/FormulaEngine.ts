import { Data } from "./Data.js";
import { cellRefToRowCol, rowColToCellRef } from "./CellRef.js";

export type CellValue = number | string | null;

export class FormulaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaError";
  }
}

const CELL_REF_RE = /^[A-Z]+[0-9]+$/;
const CELL_REF_G = /[A-Za-z]+[0-9]+/g;
const SAFE_EXPR_RE = /^[0-9+\-*/^().\s]*$/;

export class FormulaEngine {
  private data: Data;
  constructor(data?: Data) {
    this.data = data ?? new Data();
  }

  normalizeFormula(formula: string): string {
    const t = formula.trim();
    return t.startsWith("=") ? t : `=${t}`;
  }

  getValueAt(row: number, col: number): CellValue {
    try {
      return this.resolveCell(row, col);
    } catch (e) {
      if (e instanceof RangeError && e.message.includes("Maximum call stack size")) {
        throw new FormulaError("Circular reference detected");
      }
      throw e;
    }
  }

  evaluate(formula: string): number {
    try {
      const expr = formula.trim().replace(/^=/, "");
      return this.evalExpr(expr);
    } catch (e) {
      if (e instanceof RangeError && e.message.includes("Maximum call stack size")) {
        throw new FormulaError("Circular reference detected");
      }
      throw e;
    }
  }

  getAllValues(): Record<string, CellValue> {
    const result: Record<string, CellValue> = {};
    for (const [row, col] of this.data.entries()) {
      result[rowColToCellRef(row, col)] = this.getValueAt(row, col);
    }
    return result;
  }

  getStore(): Data {
    return this.data;
  }

  private evalExpr(expr: string): number {
    const substituted = expr.replace(CELL_REF_G, (ref) => String(this.getNumber(ref.toUpperCase())));

    if (!SAFE_EXPR_RE.test(substituted)) {
      throw new FormulaError(`Unexpected character in formula "${expr}"`);
    }

    let result: unknown;
    try {
      // eslint-disable-next-line no-new-func
      result = Function(`"use strict"; return (${substituted.replace(/\^/g, "**")});`)();
    } catch (e) {
      if (e instanceof RangeError) throw e; // Let call stack error bubble up
      throw new FormulaError(`#ERROR! Could not evaluate "${expr}"`);
    }

    if (typeof result !== "number" || Number.isNaN(result)) throw new FormulaError("#VALUE!");
    if (!Number.isFinite(result)) throw new FormulaError("#DIV/0!");
    return result;
  }

  private getNumber(ref: string): number {
    if (!CELL_REF_RE.test(ref)) throw new FormulaError(`Unknown name "${ref}"`);
    const { row, col } = cellRefToRowCol(ref);
    const value = this.resolveCell(row, col);
    if (value === null) return 0;
    if (typeof value === "string") throw new FormulaError(`#VALUE! ${ref} contains text`);
    return value;
  }

  private resolveCell(row: number, col: number): CellValue {
    const cell = this.data.getData(row, col);
    if (!cell || cell.value === "") return null;

    const trimmed = cell.value.trim();
    if (trimmed.startsWith("=")) {
      return this.evalExpr(trimmed.slice(1));
    }
    if (trimmed !== "" && !isNaN(Number(trimmed))) return Number(trimmed);
    return trimmed;
  }
}

export default FormulaEngine;
