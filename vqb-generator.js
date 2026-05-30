// Generates SQL from the current query state.
function generateSQL(state) {
  if (state.tables.length === 0) {
    return "-- Add tables to the canvas to generate SQL";
  }

  const selectedColumns = collectSelectedColumns(state);
  const sqlLines = [];
  const firstTable = state.tables[0];

  sqlLines.push(selectedColumns.length > 0 ? "SELECT " + selectedColumns.join(", ") : "SELECT *");
  sqlLines.push("FROM " + firstTable.tableName + " AS " + firstTable.alias);

  state.joins.forEach(function (join) {
    const fromTable = getTableById(join.fromTable);
    const toTable = getTableById(join.toTable);

    if (!fromTable || !toTable) {
      return;
    }

    sqlLines.push(
      join.type +
      " JOIN " +
      toTable.tableName +
      " AS " +
      toTable.alias +
      " ON " +
      fromTable.alias +
      "." +
      join.fromColumn +
      " = " +
      toTable.alias +
      "." +
      join.toColumn
    );
  });

  const whereLine = buildWhereLine(state);

  if (whereLine) {
    sqlLines.push(whereLine);
  }

  if (state.groupBy) {
    sqlLines.push("GROUP BY " + state.groupBy);
  }

  if (state.orderBy && state.orderBy.column) {
    sqlLines.push("ORDER BY " + state.orderBy.column + " " + state.orderBy.direction);
  }

  if (state.limit) {
    sqlLines.push("LIMIT " + state.limit);
  }

  return sqlLines.join("\n");
}

// Collects all selected columns from all tables.
function collectSelectedColumns(state) {
  const selectedColumns = [];

  state.tables.forEach(function (table) {
    table.columns.forEach(function (column) {
      if (column.selected) {
        selectedColumns.push(table.alias + "." + column.name);
      }
    });
  });

  return selectedColumns;
}

// Builds the WHERE line from table conditions.
function buildWhereLine(state) {
  const conditionParts = [];

  state.tables.forEach(function (table) {
    table.conditions.forEach(function (condition) {
      const prefix = conditionParts.length === 0 ? "WHERE" : condition.connector;
      const formattedValue = formatConditionValue(condition.value, condition.operator);

      conditionParts.push(
        prefix +
        " " +
        table.alias +
        "." +
        condition.column +
        " " +
        condition.operator +
        " " +
        formattedValue
      );
    });
  });

  return conditionParts.join(" ");
}

// Formats condition values for SQL.
function formatConditionValue(value, operator) {
  if (operator === "IN") {
    return "(" + value + ")";
  }

  const isNumber = !Number.isNaN(Number(value)) && value.trim() !== "";

  if (isNumber) {
    return value;
  }

  return "'" + value.replaceAll("'", "''") + "'";
}

// Highlights SQL keywords and values for display.
function formatSQL(sqlText) {
  const escapedSql = escapeHTML(sqlText);

  return escapedSql
    .replace(/\b(SELECT|FROM|AS|INNER|LEFT|RIGHT|FULL|JOIN|ON|WHERE|AND|OR|GROUP BY|ORDER BY|LIMIT|LIKE|IN)\b/g, '<span class="sql-keyword">$1</span>')
    .replace(/('[^']*')/g, '<span class="sql-value">$1</span>')
    .replace(/\b([a-zA-Z_]+\.[a-zA-Z_]+)\b/g, '<span class="sql-column">$1</span>');
}

// Escapes HTML before injecting highlighted SQL.
function escapeHTML(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// Generates readable JSON from the current query state.
function generateJSON(state) {
  return JSON.stringify(state, null, 2);
}

// Checks the current query for beginner-friendly warnings.
function validateQuery(state) {
  const warnings = [];

  if (state.tables.length === 0) {
    warnings.push("No tables added yet.");
    return warnings;
  }

  if (!hasSelectedColumns(state)) {
    warnings.push("No selected columns yet. SQL will use SELECT *.");
  }

  if (state.tables.length > 1 && state.joins.length === 0) {
    warnings.push("Multiple tables exist but no JOIN has been created.");
  }

  if (hasDuplicateAliases(state)) {
    warnings.push("Two or more tables are using the same alias.");
  }

  if (hasDisconnectedTables(state)) {
    warnings.push("Some tables are not connected by JOINs.");
  }

  const typeWarnings = getJoinTypeWarnings(state);

  typeWarnings.forEach(function (warning) {
    warnings.push(warning);
  });

  return warnings;
}

// Checks if at least one column is selected.
function hasSelectedColumns(state) {
  return state.tables.some(function (table) {
    return table.columns.some(function (column) {
      return column.selected;
    });
  });
}

// Checks if table aliases are duplicated.
function hasDuplicateAliases(state) {
  const aliases = state.tables.map(function (table) {
    return table.alias.trim().toLowerCase();
  });

  const uniqueAliases = new Set(aliases);

  return aliases.length !== uniqueAliases.size;
}

// Checks if any table is not connected when multiple tables exist.
function hasDisconnectedTables(state) {
  if (state.tables.length <= 1) {
    return false;
  }

  const connectedTableIds = new Set();

  state.joins.forEach(function (join) {
    connectedTableIds.add(join.fromTable);
    connectedTableIds.add(join.toTable);
  });

  return state.tables.some(function (table) {
    return !connectedTableIds.has(table.id);
  });
}

// Returns warnings for JOINs where column types do not match.
function getJoinTypeWarnings(state) {
  const warnings = [];

  state.joins.forEach(function (join) {
    const fromTable = getTableById(join.fromTable);
    const toTable = getTableById(join.toTable);

    if (!fromTable || !toTable) {
      return;
    }

    const fromColumn = fromTable.columns.find(function (column) {
      return column.name === join.fromColumn;
    });

    const toColumn = toTable.columns.find(function (column) {
      return column.name === join.toColumn;
    });

    if (!fromColumn || !toColumn) {
      return;
    }

    if (fromColumn.type !== toColumn.type) {
      warnings.push(
        "JOIN type mismatch: " +
        fromTable.alias +
        "." +
        fromColumn.name +
        " is " +
        fromColumn.type +
        ", but " +
        toTable.alias +
        "." +
        toColumn.name +
        " is " +
        toColumn.type +
        "."
      );
    }
  });

  return warnings;
}