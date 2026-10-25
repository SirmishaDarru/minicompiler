# NovaScript

**A Domain-Specific Language for Data Pipeline Transformations**

NovaScript is a compiler project that introduces a simple, readable language for defining data processing pipelines. Inspired by SQL and shell scripting, it provides constructs such as `load`, `filter`, `map`, and `output` to load datasets, filter rows, transform columns, and export results.

The compiler translates NovaScript programs into Python code using **pandas** and provides intermediate representations and error diagnostics to make the compilation process easier to understand.

## Overview

Data processing often involves repetitive operations such as reading CSV files, filtering records, modifying columns, and saving results. Performing these tasks directly in a general-purpose programming language can introduce unnecessary complexity for simple workflows.

NovaScript addresses this by providing a compact, domain-specific syntax that describes data transformations through a sequence of statements.

### Example

A NovaScript program:

```nova
load users from "data.csv"
filter users where age > 30
map users to name = upper(name)
output users to "result.csv"
```

The compiler generates equivalent Python code using pandas:

```python
import pandas as pd

users = pd.read_csv("data.csv")
users = users[users["age"] > 30]
users["name"] = users["name"].str.upper()
users.to_csv("result.csv", index=False)
```

The generated Python can be executed in an environment with Python, pandas, and the required input files installed.

## Features

- **Custom DSL:** A concise language designed specifically for data transformations.
- **Lexical analysis:** Converts source code into tokens, tracks source locations, and identifies invalid characters and literals.
- **Syntax analysis:** Uses a recursive-descent parser to validate statements and construct an Abstract Syntax Tree (AST).
- **Semantic analysis:** Checks dataset declarations, undeclared dataset usage, supported functions, comparison operators, and selected type mismatches.
- **Intermediate Representation:** Generates readable, three-address-style instructions using temporary variables to represent dataset transformations.
- **Python code generation:** Translates supported NovaScript statements and expressions into Python code using pandas.
- **Error diagnostics:** Collects lexer, parser, and semantic errors with source locations.
- **Listing generation:** Produces a numbered source listing with associated error messages.
- **Web-based interface:** Provides a frontend for entering programs and inspecting compilation results.
- **Testing:** Supports automated tests through Vitest.

## Tech Stack

| Component                         | Technology |
| --------------------------------- | ---------- |
| Compiler implementation           | TypeScript |
| Frontend                          | React      |
| Development server and build tool | Vite       |
| Generated target language         | Python     |
| Data processing library           | pandas     |
| Testing framework                 | Vitest     |
| Package management                | npm        |

## Compiler Architecture

NovaScript separates compilation into distinct stages:

```text
NovaScript Source Code
          |
          v
   Lexical Analysis
          |
          v
    Syntax Analysis
          |
          v
   Abstract Syntax Tree
          |
          v
   Semantic Analysis
          |
          +-------------------+
          |                   |
          v                   v
 Intermediate             Python Code
 Representation           Generation
          |                   ^
          v                   |
   IR Visualization      Uses the AST
```

The intermediate representation and Python generation are separate branches after semantic analysis in the current implementation. The generated IR is available for inspection, while Python code is generated directly from the AST.

### 1. Lexical Analysis

The lexer scans the source code character by character and converts it into tokens.

It recognizes:

- Keywords such as `load`, `from`, `filter`, `where`, `map`, `to`, and `output`.
- Identifiers representing dataset names and column names.
- String and numeric literals.
- Operators such as `>`, `==`, `+`, and `*`.
- Delimiters such as parentheses, commas, and semicolons.

It also tracks line and column positions and records lexical errors.

### 2. Syntax Analysis

The parser consumes the token stream and validates the structure of NovaScript statements.

It constructs an Abstract Syntax Tree containing nodes for:

- Load statements
- Filter statements
- Map statements
- Output statements
- Expressions, including identifiers, literals, function calls, and binary operations

Parser errors are recorded with source locations, and synchronization is used to recover from certain syntax errors.

### 3. Semantic Analysis

The semantic analyzer examines the AST to identify logical inconsistencies.

Current checks include:

- Duplicate dataset declarations
- References to undeclared datasets
- Unsupported built-in function calls
- Invalid comparison operators
- Basic type checks for certain filter comparisons

The analyzer also constructs a symbol table containing declared datasets.

### 4. Intermediate Representation

The IR generator converts AST statements into readable, three-address-style instructions.

For example:

```text
t1 = LOAD "data.csv"
t2 = FILTER t1 WHERE age > 30
t3 = MAP t2 SET name = upper(name)
OUTPUT t3 TO "result.csv"
```

Temporary variables represent successive versions of a dataset as transformations are applied.

This representation makes the pipeline easier to inspect and provides a foundation for future optimization and additional code-generation backends.

### 5. Python Code Generation

The code generator translates supported AST statements into Python code using pandas.

| NovaScript operation | Generated Python operation                  |
| -------------------- | ------------------------------------------- |
| `load`               | `pd.read_csv()`                             |
| `filter`             | Boolean DataFrame indexing                  |
| `map`                | Column assignment and expression evaluation |
| `output`             | `DataFrame.to_csv()`                        |

Supported expressions include identifiers, strings, numbers, function calls, and binary expressions.

Built-in functions include `upper`, `lower`, `length`, `trim`, `abs`, and `round`, subject to the implemented expression mappings.

Python code generation is skipped when the compiler reports errors.

### 6. Listing and Error Reporting

The compiler combines errors from lexical analysis, parsing, and semantic analysis.

The listing output displays numbered source lines and places associated error messages underneath the relevant lines.

Example:

```text
1 | load users from "data.csv"
2 | filter orders where total > 100
  | [semantic] Undeclared dataset "orders"
3 | output users to "result.csv"
```

This makes it easier to locate and diagnose errors without manually tracing the entire compilation process.

## Project Structure

```text
novascript/
├── src/
│   ├── lexer.ts
│   ├── parser.ts
│   ├── semantic.ts
│   ├── ir.ts
│   ├── codegen.ts
│   └── index.ts
├── tests/
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

The exact directory structure may vary with the frontend setup. The compiler modules are responsible for their respective stages, while `index.ts` integrates them through a common compilation entry point.

## Getting Started

### Prerequisites

Install the following:

- Node.js
- npm
- Python and pandas if you intend to execute the generated Python code

### Installation

Clone the repository and enter the project directory:

```bash
git clone ....
cd novascript
```

Install the dependencies:

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open the local URL printed by Vite in your terminal.

### Run tests

```bash
npm run test
```

### Build the frontend

```bash
npm run build
```

These commands assume the corresponding scripts are present in `package.json`.

## Writing NovaScript Programs

### Load a dataset

```nova
load users from "data.csv"
```

Loads a CSV file into a named dataset.

### Filter records

```nova
filter users where age > 30
```

Retains rows whose `age` value satisfies the comparison.

### Transform a column

```nova
map users to name = upper(name)
```

Transforms the `name` column using the supported `upper` function.

### Export the result

```nova
output users to "result.csv"
```

Writes the resulting dataset to a CSV file.

Statements are processed in sequence. A dataset must be declared before it is referenced by subsequent operations.

## Testing

The test suite should cover the compiler at both individual-stage and end-to-end levels.

Recommended test categories include:

- Valid programs containing all four statement types
- Invalid characters and unterminated strings
- Missing keywords and malformed expressions
- Undeclared or duplicate datasets
- Unsupported function names
- Invalid filter comparisons
- Complex pipelines containing multiple transformations
- Correct Python generation for valid programs

Tests should verify not only whether compilation succeeds, but also whether tokens, AST nodes, IR instructions, generated Python, and error locations are correct.

## Novelties

NovaScript combines several compiler concepts in a data-processing context:

1. A custom DSL that simplifies common CSV transformation workflows.
2. A modular compiler architecture separating lexical, syntactic, semantic, and code-generation responsibilities.
3. A visible intermediate representation that illustrates how source statements become pipeline instructions.
4. Source-oriented error diagnostics through a numbered listing.
5. A web-based interface for exploring compilation stages.

These features make the project both a compiler-design exercise and an educational tool for understanding how a high-level language can be translated into another programming language.

## Limitations

The current implementation has several limitations:

- CSV is the primary supported input and output format.
- Joins, aggregations, loops, and conditional control flow are not implemented.
- Semantic analysis does not perform complete dataset schema validation or comprehensive type inference.
- Expression parsing supports a limited set of operations and does not provide full operator-precedence handling.
- The IR is generated for inspection but is not currently the input to the Python code generator.
- The generated Python code depends on pandas and the availability of the referenced input files.
- Runtime errors during execution of generated Python are not comprehensively handled by the compiler.

## Future Enhancements

Potential extensions include:

- Adding a richer expression grammar with operator precedence.
- Supporting joins, aggregations, and additional data formats.
- Introducing dataset schema inference and stronger type checking.
- Generating Python from the IR rather than directly from the AST.
- Adding IR optimization passes.
- Supporting additional execution backends, such as SQL or distributed data-processing frameworks.
- Improving runtime diagnostics and automated end-to-end testing.

## Conclusion

NovaScript demonstrates how compiler-design principles can be applied to a focused domain. By providing a custom language for data pipeline transformations, the project brings together lexical analysis, recursive-descent parsing, AST construction, semantic validation, intermediate representation generation, and target-code generation.

The result is a modular compiler that translates supported NovaScript programs into Python code while exposing intermediate stages and source-level diagnostics for inspection.

NovaScript serves as a foundation for further exploration of language design, compiler architecture, and automated data processing.

---

**Project:** NovaScript  
**Category:** Compiler Design / Domain-Specific Languages  
**Primary language:** TypeScript  
**Target language:** Python
