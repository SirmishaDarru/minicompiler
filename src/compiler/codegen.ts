// Python code generator — translates AST/IR to runnable pandas Python.
import type { Program, Expression } from "./parser";

const FUNC_MAP: Record<string, (arg: string) => string> = {
  upper: (a) => `${a}.str.upper()`,
  lower: (a) => `${a}.str.lower()`,
  length: (a) => `${a}.str.len()`,
  trim: (a) => `${a}.str.strip()`,
  abs: (a) => `${a}.abs()`,
  round: (a) => `${a}.round()`,
};

const exprToPython = (e: Expression, df: string): string => {
  switch (e.kind) {
    case "Identifier":
      return `${df}["${e.name}"]`;
    case "String":
      return JSON.stringify(e.value);
    case "Number":
      return String(e.value);
    case "Call": {
      const argSrc = e.args[0] ? exprToPython(e.args[0], df) : "";
      const handler = FUNC_MAP[e.func];
      if (handler) return handler(argSrc);
      // fallback
      return `${e.func}(${e.args.map((a) => exprToPython(a, df)).join(", ")})`;
    }
    case "Binary":
      return `(${exprToPython(e.left, df)} ${e.op} ${exprToPython(e.right, df)})`;
  }
};

export function generatePython(program: Program): string {
  const lines: string[] = [];
  lines.push("import pandas as pd");
  lines.push("");

  // Each declared dataset becomes a DataFrame variable.
  const dfNames = new Set<string>();
  for (const stmt of program.body) {
    if (stmt.kind === "Load") dfNames.add(stmt.target);
  }

  for (const stmt of program.body) {
    switch (stmt.kind) {
      case "Load":
        lines.push(`${stmt.target} = pd.read_csv(${JSON.stringify(stmt.source)})`);
        break;
      case "Filter": {
        const valStr =
          stmt.value.kind === "String"
            ? JSON.stringify(stmt.value.value)
            : String((stmt.value as { value: number }).value);
        lines.push(
          `${stmt.target} = ${stmt.target}[${stmt.target}["${stmt.column}"] ${stmt.op === "=" ? "==" : stmt.op} ${valStr}]`,
        );
        break;
      }
      case "Map": {
        const rhs = exprToPython(stmt.expr, stmt.target);
        lines.push(`${stmt.target}["${stmt.column}"] = ${rhs}`);
        break;
      }
      case "Output":
        lines.push(
          `${stmt.target}.to_csv(${JSON.stringify(stmt.destination)}, index=False)`,
        );
        break;
    }
  }

  return lines.join("\n");
}
