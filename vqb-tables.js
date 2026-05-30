let dragState = {
  isDragging: false,
  tableId: null,
  offsetX: 0,
  offsetY: 0
};

// Adds a selected schema table to the canvas.
function addTableToCanvas(tableName, schemaName) {
  const schemaTable = SCHEMAS[schemaName].tables[tableName];

  const newTable = createTableNode(tableName, schemaTable);

  updateState({
    tables: [...queryState.tables, newTable],
    selectedElement: {
      type: "table",
      id: newTable.id
    }
  });
}

// Adds a custom user-made table to the canvas.
function addCustomTableToCanvas(tableName, columns) {
  const newTable = createTableNode(tableName, columns);

  updateState({
    tables: [...queryState.tables, newTable],
    selectedElement: {
      type: "table",
      id: newTable.id
    }
  });
}

// Creates a reusable table node object.
function createTableNode(tableName, columns) {
  return {
    id: generateNodeId(),
    tableName: tableName,
    alias: tableName.charAt(0).toLowerCase(),
    position: {
      x: 80 + queryState.tables.length * 40,
      y: 80 + queryState.tables.length * 40
    },
    columns: columns.map(function (column) {
      return {
        name: column.name,
        type: column.type,
        selected: false
      };
    }),
    conditions: []
  };
}

// Removes a table from the canvas.
function removeTable(tableId) {
  const remainingTables = queryState.tables.filter(function (table) {
    return table.id !== tableId;
  });

  const remainingJoins = queryState.joins.filter(function (join) {
    return join.fromTable !== tableId && join.toTable !== tableId;
  });

  updateState({
    tables: remainingTables,
    joins: remainingJoins,
    selectedElement: null
  });
}

// Changes the alias of a table.
function setTableAlias(tableId, alias) {
  const updatedTables = queryState.tables.map(function (table) {
    if (table.id !== tableId) {
      return table;
    }

    return {
      ...table,
      alias: alias || table.tableName.charAt(0).toLowerCase()
    };
  });

  updateState({
    tables: updatedTables
  });
}

// Toggles whether a column should appear in SELECT.
function toggleColumn(tableId, columnName) {
  const updatedTables = queryState.tables.map(function (table) {
    if (table.id !== tableId) {
      return table;
    }

    const updatedColumns = table.columns.map(function (column) {
      if (column.name !== columnName) {
        return column;
      }

      return {
        ...column,
        selected: !column.selected
      };
    });

    return {
      ...table,
      columns: updatedColumns
    };
  });

  updateState({
    tables: updatedTables
  });
}

// Adds a WHERE condition to a table.
function addCondition(tableId, condition) {
  const updatedTables = queryState.tables.map(function (table) {
    if (table.id !== tableId) {
      return table;
    }

    return {
      ...table,
      conditions: [...table.conditions, condition]
    };
  });

  updateState({
    tables: updatedTables
  });
}

// Removes a WHERE condition from a table.
function removeCondition(tableId, conditionIndex) {
  const updatedTables = queryState.tables.map(function (table) {
    if (table.id !== tableId) {
      return table;
    }

    const updatedConditions = table.conditions.filter(function (_, index) {
      return index !== conditionIndex;
    });

    return {
      ...table,
      conditions: updatedConditions
    };
  });

  updateState({
    tables: updatedTables
  });
}

// Starts dragging a table node.
function startDrag(tableId, mouseX, mouseY) {
  const table = getTableById(tableId);

  dragState = {
    isDragging: true,
    tableId: tableId,
    offsetX: mouseX - table.position.x,
    offsetY: mouseY - table.position.y
  };
}

// Moves the currently dragged table.
function onDrag(mouseX, mouseY) {
  if (!dragState.isDragging) {
    return;
  }

  const updatedTables = queryState.tables.map(function (table) {
    if (table.id !== dragState.tableId) {
      return table;
    }

    return {
      ...table,
      position: {
        x: mouseX - dragState.offsetX,
        y: mouseY - dragState.offsetY
      }
    };
  });

  queryState = {
    ...queryState,
    tables: updatedTables
  };

  renderCanvas();
}

// Ends dragging and saves the new position.
function endDrag() {
  if (!dragState.isDragging) {
    return;
  }

  dragState = {
    isDragging: false,
    tableId: null,
    offsetX: 0,
    offsetY: 0
  };

  saveState();
  renderQueryOutput();
}