import { parse as parseCsv } from "csv-parse/sync";

import queryParser from "./query-parser.cjs";

enum ColumnType {
  STRING = "string",
  NUMBER = "number",
}

type Value = string | number;

type Row = Record<string, Value>;

type QueryFilterOp = "=" | ">";

interface QueryFilter {
  column: string;
  op: QueryFilterOp;
  value: Value;
}

interface Query {
  columns: string[];
  filter?: QueryFilter;
}

interface QueryResult {
  columns: string[];
  rows: Row[];
}

export class DataError extends Error {}

export class QueryError extends Error {}

export class Database {
  private columnTypes: Record<string, ColumnType> = {};
  private columnIndices: Record<string, ColumnIndex> = {};
  private rows: Row[] = [];

  constructor(csv: string) {
    this.loadData(csv);
  }

  public query(query: string): QueryResult {
    const parsedQuery = this.parseQuery(query);

    this.validateQuery(parsedQuery);

    let rows = this.rows;
    if (parsedQuery.filter) {
      rows = this.filter(rows, parsedQuery.filter);
    }
    rows = this.project(rows, parsedQuery.columns);

    return {
      columns: parsedQuery.columns,
      rows: rows,
    };
  }

  private loadData(csv: string) {
    const rows = this.loadRows(csv);

    // Shortcut: I infer column names from keys of the frist row as the CSV
    // library doesn't provide them separately. In production code, I'd look for
    // some other way to obtain them, but for the challenge, I just disallow CSV
    // files without at least one row.
    if (rows.length === 0) {
      throw new DataError("Loaded data must contain at least one row.");
    }

    const columns = Object.keys(rows[0]);

    this.columnTypes = this.buildColumnTypes(columns, rows);
    this.columnIndices = this.buildColumnIndices(columns, rows);
    this.rows = rows;
  }

  private loadRows(csv: string): Row[] {
    try {
      return parseCsv(csv, {
        columns: true,
        cast: (value) => {
          if (/^\d+$/.test(value)) {
            return parseInt(value, 10);
          } else {
            return value;
          }
        },
      });
    } catch (e) {
      throw new DataError((e as Error).message);
    }
  }

  private buildColumnTypes(
    columns: string[],
    rows: Row[],
  ): Record<string, ColumnType> {
    return columns.reduce(
      (acc, column) => {
        // Shortcut: Better do the check below in one pass and throw an error
        // early.

        const allStrings = rows.every((row) => {
          return typeof row[column] === "string";
        });
        const allNumbers = rows.every((row) => {
          return typeof row[column] === "number";
        });

        if (!allStrings && !allNumbers) {
          throw new DataError(`Mixed types in column "${column}".`);
        }

        acc[column] = allNumbers ? ColumnType.NUMBER : ColumnType.STRING;

        return acc;
      },
      {} as Record<string, ColumnType>,
    );
  }

  private buildColumnIndices(
    columns: string[],
    data: Row[],
  ): Record<string, ColumnIndex> {
    return columns.reduce(
      (acc, column) => {
        acc[column] = new ColumnIndex(column, data);
        return acc;
      },
      {} as Record<string, ColumnIndex>,
    );
  }

  private parseQuery(query: string): Query {
    try {
      return queryParser.parse(query) as Query;
    } catch (error) {
      throw new QueryError((error as Error).message);
    }
  }

  private validateQuery(query: Query) {
    for (const column of query.columns) {
      if (this.columnTypes[column] === undefined) {
        throw new QueryError(`Unknown column: ${column}`);
      }
    }

    if (query.filter) {
      const column = query.filter.column;
      if (this.columnTypes[column] === undefined) {
        throw new QueryError(`Unknown column: ${column}`);
      }

      const valueType = typeof query.filter.value;
      if (this.columnTypes[query.filter.column] !== valueType) {
        throw new QueryError(`Invalid value type: ${valueType}`);
      }
    }
  }

  private filter(rows: Row[], filter: QueryFilter): Row[] {
    const columnIndex = this.columnIndices[filter.column];

    switch (filter.op) {
      case "=":
        return columnIndex.searchEqual(filter.value);
      case ">":
        return columnIndex.searchGreaterThan(filter.value);
      default:
        throw new Error(`Unknown filter operation: ${filter.op}`);
    }
  }

  private project(rows: Row[], columns: string[]): Row[] {
    return rows.map((row) => {
      return columns.reduce((acc, column) => {
        acc[column] = row[column];
        return acc;
      }, {} as Row);
    });
  }
}

class ColumnIndex {
  private readonly column: string;
  private readonly rows: Row[];

  constructor(column: string, rows: Row[]) {
    this.column = column;
    this.rows = rows.slice().sort((a, b) => {
      if (a[column] < b[column]) {
        return -1;
      } else if (a[column] > b[column]) {
        return 1;
      } else {
        return 0;
      }
    });
  }

  searchEqual(value: Value): Row[] {
    // There may be multiple rows with given value, so we need to find the first
    // one and the last one.

    const firstIndex = this.findFirstEqual(value);
    if (firstIndex === -1) {
      return [];
    }

    const lastIndex = this.findLastEqual(value);
    return this.rows.slice(firstIndex, lastIndex + 1);
  }

  searchGreaterThan(value: Value): Row[] {
    const index = this.findFirstGreaterThan(value);
    if (index === -1) {
      return [];
    }

    return this.rows.slice(index);
  }

  private findFirstEqual(value: Value): number {
    let left = 0;
    let right = this.rows.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const row = this.rows[mid];

      if (row[this.column] < value) {
        left = mid + 1;
      } else if (row[this.column] > value) {
        right = mid - 1;
      } else {
        result = mid;
        right = mid - 1;
      }
    }

    return result;
  }

  private findLastEqual(value: Value): number {
    let left = 0;
    let right = this.rows.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const row = this.rows[mid];

      if (row[this.column] < value) {
        left = mid + 1;
      } else if (row[this.column] > value) {
        right = mid - 1;
      } else {
        result = mid;
        left = mid + 1;
      }
    }

    return result;
  }

  private findFirstGreaterThan(value: Value): number {
    let left = 0;
    let right = this.rows.length - 1;
    let result = -1;

    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const row = this.rows[mid];

      if (row[this.column] > value) {
        result = mid;
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    }

    return result;
  }
}
