export interface NovaExample {
  id: string;
  label: string;
  description: string;
  source: string;
}

export const EXAMPLES: NovaExample[] = [
  {
    id: "valid",
    label: "✓ Valid pipeline",
    description: "Loads users, filters by age, uppercases names, writes CSV",
    source: `// Valid NovaScript program
load users from "data.csv"
filter users where age > 30
map users to name = upper(name)
output users to "result.csv"
`,
  },
  {
    id: "syntax",
    label: "✗ Syntax error",
    description: "Missing 'from' keyword, unterminated string",
    source: `// Has syntax errors
load users "data.csv"
filter users where age > 30
output users to "broken
`,
  },
  {
    id: "semantic",
    label: "✗ Semantic error",
    description: "Undeclared dataset and unknown function",
    source: `// Has semantic errors
load users from "data.csv"
filter orders where total > 100
map users to name = capitalize(name)
output users to "out.csv"
`,
  },
  {
    id: "complex",
    label: "★ Complex pipeline",
    description: "Multi-stage transform chain",
    source: `// Multi-stage data pipeline
load sales from "sales_2024.csv"
filter sales where amount > 1000
map sales to region = upper(region)
map sales to discount = amount * 0.1
filter sales where region != "TEST"
output sales to "high_value_sales.csv"

load customers from "customers.csv"
filter customers where active = 1
map customers to email = lower(email)
output customers to "active_customers.csv"
`,
  },
];
