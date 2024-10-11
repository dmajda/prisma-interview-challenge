import fs from "fs";

import Table from "cli-table3";

import { Database } from "./database.js";

// Process arguments.

const argv = process.argv.slice(2);
if (argv.length !== 2) {
  console.log("Usage: node dist/cli.js <file> <query>");
  process.exit(1);
}

const [file, query] = argv;

// Load the CSV file.

let csv;
try {
  csv = fs.readFileSync(file, "utf-8");
} catch (e) {
  console.error(`Error reading file: ${(e as Error).message}`);
  process.exit(1);
}

// Create the database.

let db;
try {
  db = new Database(csv);
} catch (e) {
  console.error(`Error loading data: ${(e as Error).message}`);
  process.exit(1);
}

// Execute the query.

let result;
try {
  result = db.query(query);
} catch (e) {
  console.error(`Error executing query: ${(e as Error).message}`);
  process.exit(1);
}

// Print the result.

const table = new Table({ head: result.columns });

result.rows.forEach((row) => {
  table.push(result.columns.map((column) => row[column]));
});

console.log(table.toString());
