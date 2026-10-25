// Semantic analyzer — symbol table, undeclared identifier checks, type mismatch checks
import type { Program, Statement, Expression } from "./parser";

export interface SemanticError {
  message: string;
  line: number;
  col: number;
  phase: "semantic";
}

export interface Symbol {
  name: string;
  kind: "dataset";
  declaredAt: number;
}

export interface SymbolTable {
  symbols: Symbol[];
}

const BUILTIN_FUNCS = new Set([
  "upper",
  "lower",
  "length",
  "trim",
  "abs",
  "round",
]);

export function analyze(program: Program): {
  errors: SemanticError[];
  symbols: SymbolTable;
} {
  const errors: SemanticError[] = [];
  const declared = new Map<string, Symbol>();

  const err = (message: string, line: number) => {
    errors.push({ message, line, col: 1, phase: "semantic" });
  };

  const checkExpr = (expr: Expression, knownColumns: Set<string> | null) => {
    switch (expr.kind) {
      case "Identifier":
        // Identifier inside an expression refers to a column — we don't strictly track columns,
        // but we do flag if it shadows a known dataset name (could be confusing).
        if (declared.has(expr.name) && knownColumns && !knownColumns.has(expr.name)) {
          // it's actually a dataset name being used as a column — warn
          err(
            `Identifier "${expr.name}" refers to a dataset, not a column`,
            expr.line,
          );
        }
        break;
      case "Call":
        if (!BUILTIN_FUNCS.has(expr.func)) {
          err(
            `Unknown function "${expr.func}". Built-ins: ${Array.from(BUILTIN_FUNCS).join(", ")}`,
            expr.line,
          );
        }
        expr.args.forEach((a) => checkExpr(a, knownColumns));
        break;
      case "Binary":
        checkExpr(expr.left, knownColumns);
        checkExpr(expr.right, knownColumns);
        break;
    }
  };

  for (const stmt of program.body) {
    switch (stmt.kind) {
      case "Load":
        if (declared.has(stmt.target)) {
          err(`Dataset "${stmt.target}" is already declared`, stmt.line);
        } else {
          declared.set(stmt.target, {
            name: stmt.target,
            kind: "dataset",
            declaredAt: stmt.line,
          });
        }
        break;
      case "Filter": {
        if (!declared.has(stmt.target)) {
          err(`Undeclared dataset "${stmt.target}"`, stmt.line);
        }
        // Type check for filter value: comparison operators expect numbers vs numbers,
        // equality works for either.
        const op = stmt.op;
        if (
          (op === "<" || op === ">" || op === "<=" || op === ">=") &&
          stmt.value.kind === "String"
        ) {
          err(
            `Type mismatch: cannot use "${op}" with a string literal`,
            stmt.line,
          );
        }
        if (op !== "=" && op !== "==" && op !== "!=" && op !== "<" && op !== ">" && op !== "<=" && op !== ">=") {
          err(`Invalid comparison operator "${op}" in filter`, stmt.line);
        }
        break;
      }
      case "Map":
        if (!declared.has(stmt.target)) {
          err(`Undeclared dataset "${stmt.target}"`, stmt.line);
        }
        checkExpr(stmt.expr, null);
        break;
      case "Output":
        if (!declared.has(stmt.target)) {
          err(`Undeclared dataset "${stmt.target}"`, stmt.line);
        }
        break;
    }
  }

  return {
    errors,
    symbols: { symbols: Array.from(declared.values()) },
  };
}
