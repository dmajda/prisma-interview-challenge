import fs from "fs";

import { Database, QueryError } from "./database.js";

describe("Database", () => {
  let db: Database;

  beforeAll(() => {
    db = new Database(fs.readFileSync("examples/books.csv", "utf8"));
  });

  // Shortcut: The tests shoud also exercise the `Database` constructor.

  describe("query", () => {
    // Shortcut: The tests should verify the results without relying on rows
    // being in a specific order.

    // Shortcut: The tests should be more exhaustive and exercise various edge
    // cases.

    // Shortcut: The tests could be refactored to be more data-driven.

    it("throws `QueryError` on syntax errors", () => {
      const query = "INVALID";

      expect(() => db.query(query)).toThrow(QueryError);
    });

    describe("projections", () => {
      it("returns correct results with one column", () => {
        const query = "PROJECT title";

        expect(db.query(query)).toEqual({
          columns: ["title"],
          rows: [
            { title: "Game Programming Patterns" },
            { title: "Exhalation" },
            { title: "Crafting Interpreters" },
            { title: "Python Distilled" },
            { title: "The Maniac" },
          ],
        });
      });

      it("returns correct results with multiple columns", () => {
        const query = "PROJECT title, author, year";

        expect(db.query(query)).toEqual({
          columns: ["title", "author", "year"],
          rows: [
            {
              title: "Game Programming Patterns",
              author: "Robert Nystrom",
              year: 2014,
            },
            { title: "Exhalation", author: "Ted Chiang", year: 2019 },
            {
              title: "Crafting Interpreters",
              author: "Robert Nystrom",
              year: 2021,
            },
            {
              title: "Python Distilled",
              author: "David Beazley",
              year: 2021,
            },
            { title: "The Maniac", author: "Benjamin Labatut", year: 2023 },
          ],
        });
      });

      it("throws `QueryError` on unknown column name", () => {
        const query = "PROJECT unknown";

        expect(() => db.query(query)).toThrow(QueryError);
      });
    });

    describe("filters", () => {
      it("returns correct result for `=` on a string column", () => {
        const query = 'PROJECT title FILTER author = "Robert Nystrom"';

        expect(db.query(query)).toEqual({
          columns: ["title"],
          rows: [
            { title: "Game Programming Patterns" },
            { title: "Crafting Interpreters" },
          ],
        });
      });

      it("returns correct result for `=` on a numeric column", () => {
        const query = "PROJECT title FILTER year = 2021";

        expect(db.query(query)).toEqual({
          columns: ["title"],
          rows: [
            { title: "Crafting Interpreters" },
            { title: "Python Distilled" },
          ],
        });
      });

      it("returns correct result for `>` on a string column", () => {
        const query = 'PROJECT title FILTER author > "Martin Fowler"';

        expect(db.query(query)).toEqual({
          columns: ["title"],
          rows: [
            { title: "Game Programming Patterns" },
            { title: "Crafting Interpreters" },
            { title: "Exhalation" },
          ],
        });
      });

      it("returns correct result for `>` on a numeric column", () => {
        const query = "PROJECT title FILTER year > 2020";

        expect(db.query(query)).toEqual({
          columns: ["title"],
          rows: [
            { title: "Crafting Interpreters" },
            { title: "Python Distilled" },
            { title: "The Maniac" },
          ],
        });
      });

      it("throws `QueryError` on unknown column name", () => {
        const query = "PROJECT title FILTER unknown = 2021";

        expect(() => db.query(query)).toThrow(QueryError);
      });

      it("throws `QueryError` on type mismatch", () => {
        const query = "PROJECT title FILTER title = 2021";

        expect(() => db.query(query)).toThrow(QueryError);
      });
    });
  });
});
