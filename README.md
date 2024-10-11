# Prisma Interview Challenge

Implementation of the Prisma interview challenge.

## Setup

1. Install dependencies:

   ```console
   $ npm install
   ```

2. Build the query parser and TypeScript files:

   ```console
   $ npm run build:query-parser
   $ npm run build
   ```

## Usage

You can play with the database using a simple CLI and an example file:

```console
$ node dist/cli.js examples/books.csv 'PROJECT title, author, year FILTER author = "Robert Nystrom"'
┌───────────────────────────┬────────────────┬──────┐
│ title                     │ author         │ year │
├───────────────────────────┼────────────────┼──────┤
│ Game Programming Patterns │ Robert Nystrom │ 2014 │
├───────────────────────────┼────────────────┼──────┤
│ Crafting Interpreters     │ Robert Nystrom │ 2021 │
└───────────────────────────┴────────────────┴──────┘
```

## Development

Run tests, format and lint code:

```console
$ npm run test
$ npm run format
$ npm run lint
```

## Description

The core of the implementation is the `Database` class in `src/database.ts`. It
parses CSV provided in the constructor, determines column types and builds
indices for efficient querying. The data can then be queried using the `query`
method.

There is an index for each column. These indices are implemented as arrays of
the original database rows sorted by the specified column. The operations on
them are implemented using modified binary search.

I’m well aware that this index implementation is very simple and could be
optimized in multiple ways. I’m also aware that any performance gains provided
by using indices is most likely negligible for small data sizes. The point is
mostly to show that the query operations *can* be implemented using an index.

The query parser is built using a parser generator [Peggy](https://peggyjs.org/)
(successor of my own project PEG.js).

## Questions

**What were some of the tradeoffs you made when building this and why
were these acceptable tradeoffs?**

The main tradeoffs are related to indices. They are created for all columns when
loading the data. This improves query performance at the cost of a longer
startup. There are other possible strategies, such as not using indices at all,
creating them lazily, letting the user create them explicitly, etc. The indices
are also implemented in a very simple way.

I think these tradeoffs are acceptable given this is just an interview
challenge.

Another tradeoff is using a parser generator for parsing queries. It may seem
like an overkill, but for me it was easier to work with than writing the parser
manually or parsing queries using regular expressions. Using a parser generator
also leads to nice error messages and is more future-proof, as the parser is
easy to extend.

**Given more time, what improvements or optimizations would you want to add?
When would you add them?**

Mainly I’d try to be smarter with the indices, which are implemented in a really
simple way. I’d look into this if I had more time or if the code was actually
about to be used in production.

Other than that, I’d probably extend the functionality a bit.

**What changes are needed to accommodate changes to support other data
types, multiple filters, or ordering of results?**

Code handling data types relies on native JavaScript types, the `typeof`
operator, and the `<` operator for simplicity. With more data types, code using
these features would likely have to refactored. A probable result would be a set
of objects describing each data type and implementing related operations such as
parsing and query operators.

Adding multiple filters would require modifying the parser and code dealing with
queries. I’d also have to rethink the indices, which are created separetely for
each column.

Adding ordering of results seems like a strightforward operation that could be
added at the end of query result processing. It’s possible the indices could be
used to help here.

**What changes are needed to process extremely large datasets?**

Large datasets would not fit into memory, so the database would have to operate
from disk. As CSV is far from ideal format for that, it would probably mean
importing data into some suitable optimized binary format.

With really large datasets, indices would also have to operate from disk.

**What do you still need to do to make this code production ready?**

I think the code isn’t prodution ready mostly because it isn’t very useful.

Other than that, I think the biggest missing pieces are proper user
documentation, documentation comments in the code, and better test coverage. I
also took various small shortcuts during development, which are noted in code
comments (grep for “Shortcut”). The code would have to be modified to avoid
them.
