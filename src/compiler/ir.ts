// IR Generator — emits 3-address code
import type { Program, Expression } from "./parser";

export interface IRInstruction {
  temp?: string;
  op: "LOAD" | "FILTER" | "MAP" | "OUTPUT";
  text: string; // human-readable line
  line: number; // source line
}

const exprToText = (e: Expression): string => {
  switch (e.kind) {
    case "Identifier":
      return e.name;
    case "String":
      return `"${e.value}"`;
    case "Number":
      return String(e.value);
    case "Call":
      return `${e.func}(${e.args.map(exprToText).join(", ")})`;
    case "Binary":
      return `${exprToText(e.left)} ${e.op} ${exprToText(e.right)}`;
  }
};

export interface IR {
  instructions: IRInstruction[];
  // Map source dataset name -> latest temp holding its value
  latestTemp: Map<string, string>;
}

export function generateIR(program: Program): IR {
  const instructions: IRInstruction[] = [];
  const latest = new Map<string, string>();
  let counter = 0;
  const newTemp = () => `t${++counter}`;

  for (const stmt of program.body) {
    switch (stmt.kind) {
      case "Load": {
        const t = newTemp();
        instructions.push({
          temp: t,
          op: "LOAD",
          text: `${t} = LOAD "${stmt.source}"`,
          line: stmt.line,
        });
        latest.set(stmt.target, t);
        break;
      }
      case "Filter": {
        const src = latest.get(stmt.target) ?? stmt.target;
        const t = newTemp();
        const valStr =
          stmt.value.kind === "String"
            ? `"${stmt.value.value}"`
            : String((stmt.value as { value: number }).value);
        instructions.push({
          temp: t,
          op: "FILTER",
          text: `${t} = FILTER ${src} WHERE ${stmt.column} ${stmt.op} ${valStr}`,
          line: stmt.line,
        });
        latest.set(stmt.target, t);
        break;
      }
      case "Map": {
        const src = latest.get(stmt.target) ?? stmt.target;
        const t = newTemp();
        instructions.push({
          temp: t,
          op: "MAP",
          text: `${t} = MAP ${src} SET ${stmt.column} = ${exprToText(stmt.expr)}`,
          line: stmt.line,
        });
        latest.set(stmt.target, t);
        break;
      }
      case "Output": {
        const src = latest.get(stmt.target) ?? stmt.target;
        instructions.push({
          op: "OUTPUT",
          text: `OUTPUT ${src} TO "${stmt.destination}"`,
          line: stmt.line,
        });
        break;
      }
    }
  }

  return { instructions, latestTemp: latest };
}
