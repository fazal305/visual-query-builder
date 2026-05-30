const relationState = {
  isDrawing: false,
  fromTable: null,
  fromColumn: null
};

// Starts a relationship from one table column.
function startRelation(tableId, columnName) {
  relationState.isDrawing = true;
  relationState.fromTable = tableId;
  relationState.fromColumn = columnName;
}

// Completes a relationship between two table columns.
function completeRelation(tableId, columnName) {
  if (!relationState.isDrawing) return;

  if (relationState.fromTable === tableId) {
    cancelRelation();
    renderCanvas();
    return;
  }

  const newJoin = {
    id: generateJoinId(),
    fromTable: relationState.fromTable,
    fromColumn: relationState.fromColumn,
    toTable: tableId,
    toColumn: columnName,
    type: "INNER"
  };

  updateState({
    joins: [...queryState.joins, newJoin],
    selectedElement: {
      type: "join",
      id: newJoin.id
    }
  });

  cancelRelation();
}

// Cancels the active relationship drawing mode.
function cancelRelation() {
  relationState.isDrawing = false;
  relationState.fromTable = null;
  relationState.fromColumn = null;
}

// Changes the selected join type.
function setJoinType(joinId, type) {
  const updatedJoins = queryState.joins.map(function (join) {
    if (join.id !== joinId) return join;

    return {
      ...join,
      type: type
    };
  });

  updateState({
    joins: updatedJoins
  });
}

// Removes a join from the query state.
function removeJoin(joinId) {
  const remainingJoins = queryState.joins.filter(function (join) {
    return join.id !== joinId;
  });

  updateState({
    joins: remainingJoins,
    selectedElement: null
  });
}