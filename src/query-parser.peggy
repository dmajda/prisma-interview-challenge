Query
  = columns:Project filter:(_ @Filter)? {
      return { columns, filter };
    }

Project
  = "PROJECT"i _ @Columns

Filter
  = "FILTER"i _ column:Column _ op:Op _ value:Value {
      return { column, op, value };
    }

Columns
  = Column |1.., _ "," _|

// Shortcut: Only column names that look like C identifiers are supported.
Column "column name"
  = $[a-zA-Z_]+

Op "operator"
  = "="
  / ">"

Value
  = Number
  / String

Number "number"
  = [0-9]+ { return parseInt(text(), 10); }

// Shortcut: No escape sequences are implemented.
String "string"
  = "\"" @$[^"]* "\""

_ "whitespace"
  = [ \t\n\r]*
