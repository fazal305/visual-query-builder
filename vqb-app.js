let activeOutputTab = "sql";

// Starts the full application.
function init() {
  loadState();
  initCanvas();
  renderSidebar(queryState.schema);
  renderQueryOutput();
  renderRightPanel();
  bindAppEvents();
}

// Connects all UI events.
function bindAppEvents() {
  $(document).on("click", ".schema-table-item", function () {
    const tableName = $(this).data("table");
    addTableToCanvas(tableName, queryState.schema);
  });

  $(".schema-tab").on("click", function () {
    handleSchemaSwitch($(this).data("schema"));
  });

  $("#table-search-input").on("input", function () {
    renderSidebar(queryState.schema, $(this).val());
  });

  $(".output-tab").on("click", function () {
    activeOutputTab = $(this).data("output");
    switchOutputTab();
  });

  $("#copy-output-btn").on("click", handleCopyOutput);
  $("#reset-canvas-btn").on("click", handleResetCanvas);
  $("#export-query-btn").on("click", handleExportQuery);
  $("#import-query-input").on("change", handleImportQuery);

  $("#query-canvas").on("mousedown", handleCanvasMouseDown);
  $("#query-canvas").on("contextmenu", handleCanvasRightClick);

  $(document).on("mousemove", handleCanvasMouseMove);
  $(document).on("mouseup", handleCanvasMouseUp);

  $(document).on("click", function () {
    hideContextMenu();
  });

  $("#context-remove-table-btn").on("click", function () {
    if (queryState.selectedElement?.type === "table") {
      removeTable(queryState.selectedElement.id);
    }

    hideContextMenu();
  });

  $("#context-remove-join-btn").on("click", function () {
    if (queryState.selectedElement?.type === "join") {
      removeJoin(queryState.selectedElement.id);
    }

    hideContextMenu();
  });

  $(document).on("keydown", function (event) {
    if (event.key === "Escape") {
      cancelRelation();
      hideContextMenu();
      renderCanvas();
    }
  });

  $(document).on("input", "#alias-input", function () {
    setTableAlias(queryState.selectedElement.id, $(this).val());
  });

  $(document).on("change", ".column-toggle-input", function () {
    toggleColumn(queryState.selectedElement.id, $(this).data("column"));
  });

  $(document).on("click", "#add-condition-btn", handleAddCondition);

  $(document).on("click", ".remove-condition-btn", function () {
    removeCondition(queryState.selectedElement.id, Number($(this).data("index")));
  });

  $(document).on("change", "#join-type-select", function () {
    setJoinType(queryState.selectedElement.id, $(this).val());
  });

  $(document).on("click", "#remove-join-btn", function () {
    removeJoin(queryState.selectedElement.id);
  });

  $(document).on("change", "#group-by-select", function () {
    updateState({ groupBy: $(this).val() || null });
  });

  $(document).on("change", "#order-by-select, #order-direction-select", updateOrderByFromInputs);

  $(document).on("input", "#limit-input", function () {
    updateState({ limit: Number($(this).val()) || null });
  });

  $("#add-custom-column-btn").on("click", addCustomColumnRow);

  $(document).on("click", ".remove-custom-column-btn", function () {
    removeCustomColumnRow(this);
  });

  $("#create-custom-table-btn").on("click", handleCreateCustomTable);

  $("#custom-table-modal").on("hidden.bs.modal", resetCustomTableModal);

  $(window).on("resize", function () {
    resizeCanvasToDisplaySize();
    renderCanvas();
  });
}

// Renders the schema table list in the left sidebar.
function renderSidebar(schemaName, searchTerm = "") {
  const schema = SCHEMAS[schemaName];
  const filteredTables = Object.keys(schema.tables).filter(function (tableName) {
    return tableName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  $("#schema-table-list").html("");

  filteredTables.forEach(function (tableName) {
    const columns = schema.tables[tableName];

    $("#schema-table-list").append(`
      <div class="schema-table-item" data-table="${tableName}">
        <h4>${tableName}</h4>
        <span class="column-count">${columns.length} columns</span>
      </div>
    `);
  });
}

// Renders the right properties panel.
function renderRightPanel() {
  if (!queryState.selectedElement) {
    renderGlobalQueryControls();
    return;
  }

  if (queryState.selectedElement.type === "table") {
    renderTableProperties();
    return;
  }

  if (queryState.selectedElement.type === "join") {
    renderJoinProperties();
  }
}

// Renders global query controls when nothing is selected.
function renderGlobalQueryControls() {
  $("#right-panel-content").html(`
    <h3>Query Controls</h3>
    ${getGlobalControlsHTML()}
    <p class="hint-text mt-3">Tip: Shift + click one column, then Shift + click another table column to create a JOIN.</p>
  `);
}

// Renders table controls in the right panel.
function renderTableProperties() {
  const table = getTableById(queryState.selectedElement.id);

  if (!table) return;

  const columnControls = table.columns.map(function (column) {
    return `
      <label class="column-control">
        <input 
          class="form-check-input column-toggle-input" 
          type="checkbox" 
          data-column="${column.name}"
          ${column.selected ? "checked" : ""}
        >
        <span>${column.name}</span>
        <small>${column.type}</small>
      </label>
    `;
  }).join("");

  $("#right-panel-content").html(`
    <h3>${table.tableName}</h3>

    <label class="form-label">Alias</label>
    <input id="alias-input" class="form-control panel-input" value="${table.alias}">

    <div class="panel-section-title">SELECT Columns</div>
    <div class="column-control-list">${columnControls}</div>

    <div class="panel-section-title">WHERE Conditions</div>
    ${getConditionBuilderHTML(table)}
    ${getConditionsListHTML(table)}

    <button class="btn ghost-btn w-100 mt-3" onclick="removeTable('${table.id}')">
      Remove Table
    </button>
  `);
}

// Renders join controls in the right panel.
function renderJoinProperties() {
  const join = getJoinById(queryState.selectedElement.id);

  if (!join) return;

  const fromTable = getTableById(join.fromTable);
  const toTable = getTableById(join.toTable);

  $("#right-panel-content").html(`
    <h3>JOIN Relationship</h3>

    <p class="join-summary">
      ${fromTable.alias}.${join.fromColumn}
      <br>=<br>
      ${toTable.alias}.${join.toColumn}
    </p>

    <label class="form-label">JOIN Type</label>
    <select id="join-type-select" class="form-select panel-input">
      <option value="INNER" ${join.type === "INNER" ? "selected" : ""}>INNER JOIN</option>
      <option value="LEFT" ${join.type === "LEFT" ? "selected" : ""}>LEFT JOIN</option>
      <option value="RIGHT" ${join.type === "RIGHT" ? "selected" : ""}>RIGHT JOIN</option>
      <option value="FULL" ${join.type === "FULL" ? "selected" : ""}>FULL JOIN</option>
    </select>

    <button id="remove-join-btn" class="btn ghost-btn w-100 mt-3">
      Remove JOIN
    </button>
  `);
}

// Builds the WHERE condition form.
function getConditionBuilderHTML(table) {
  const columnOptions = table.columns.map(function (column) {
    return `<option value="${column.name}">${column.name}</option>`;
  }).join("");

  return `
    <select id="condition-column-select" class="form-select panel-input">${columnOptions}</select>

    <select id="condition-operator-select" class="form-select panel-input">
      <option value="=">=</option>
      <option value="!=">!=</option>
      <option value=">">&gt;</option>
      <option value="<">&lt;</option>
      <option value=">=">&gt;=</option>
      <option value="<=">&lt;=</option>
      <option value="LIKE">LIKE</option>
      <option value="IN">IN</option>
    </select>

    <input id="condition-value-input" class="form-control panel-input" placeholder="Value e.g. active">

    <select id="condition-connector-select" class="form-select panel-input">
      <option value="AND">AND</option>
      <option value="OR">OR</option>
    </select>

    <button id="add-condition-btn" class="btn neon-btn w-100">Add Condition</button>
  `;
}

// Builds the existing conditions list.
function getConditionsListHTML(table) {
  if (table.conditions.length === 0) {
    return `<p class="hint-text mt-3">No conditions added yet.</p>`;
  }

  return table.conditions.map(function (condition, index) {
    return `
      <div class="condition-pill">
        <span>${condition.connector} ${table.alias}.${condition.column} ${condition.operator} ${condition.value}</span>
        <button class="remove-condition-btn" data-index="${index}">×</button>
      </div>
    `;
  }).join("");
}

// Builds global ORDER/GROUP/LIMIT controls.
function getGlobalControlsHTML() {
  const columnOptions = getAllQualifiedColumns().map(function (columnName) {
    return `<option value="${columnName}" ${queryState.groupBy === columnName ? "selected" : ""}>${columnName}</option>`;
  }).join("");

  const orderColumnOptions = getAllQualifiedColumns().map(function (columnName) {
    const isSelected = queryState.orderBy && queryState.orderBy.column === columnName;
    return `<option value="${columnName}" ${isSelected ? "selected" : ""}>${columnName}</option>`;
  }).join("");

  return `
    <div class="panel-section-title">GROUP BY</div>
    <select id="group-by-select" class="form-select panel-input">
      <option value="">None</option>
      ${columnOptions}
    </select>

    <div class="panel-section-title">ORDER BY</div>
    <select id="order-by-select" class="form-select panel-input">
      <option value="">None</option>
      ${orderColumnOptions}
    </select>

    <select id="order-direction-select" class="form-select panel-input">
      <option value="ASC" ${queryState.orderBy && queryState.orderBy.direction === "ASC" ? "selected" : ""}>ASC</option>
      <option value="DESC" ${queryState.orderBy && queryState.orderBy.direction === "DESC" ? "selected" : ""}>DESC</option>
    </select>

    <div class="panel-section-title">LIMIT</div>
    <input id="limit-input" type="number" class="form-control panel-input" value="${queryState.limit || ""}" min="1">
  `;
}

// Gets every column with alias prefix.
function getAllQualifiedColumns() {
  const columns = [];

  queryState.tables.forEach(function (table) {
    table.columns.forEach(function (column) {
      columns.push(table.alias + "." + column.name);
    });
  });

  return columns;
}

// Adds one new row inside the custom table modal.
function addCustomColumnRow() {
  $("#custom-column-list").append(`
    <div class="custom-column-row">
      <input class="form-control panel-input custom-column-name" placeholder="Column name e.g. created_at">
      <select class="form-select panel-input custom-column-type">
        <option value="INT">INT</option>
        <option value="VARCHAR">VARCHAR</option>
        <option value="TEXT">TEXT</option>
        <option value="DECIMAL">DECIMAL</option>
        <option value="DATETIME">DATETIME</option>
        <option value="BOOLEAN">BOOLEAN</option>
      </select>
      <button class="remove-custom-column-btn" type="button">×</button>
    </div>
  `);
}

// Removes one custom column row from the modal.
function removeCustomColumnRow(buttonElement) {
  if ($(".custom-column-row").length <= 1) {
    alert("A custom table needs at least one column.");
    return;
  }

  $(buttonElement).closest(".custom-column-row").remove();
}

// Creates a custom table from modal inputs.
function handleCreateCustomTable() {
  const tableName = $("#custom-table-name-input").val().trim();
  const columns = [];

  if (!tableName) {
    alert("Please enter a table name.");
    return;
  }

  $(".custom-column-row").each(function () {
    const columnName = $(this).find(".custom-column-name").val().trim();
    const columnType = $(this).find(".custom-column-type").val();

    if (columnName) {
      columns.push({ name: columnName, type: columnType });
    }
  });

  if (columns.length === 0) {
    alert("Please add at least one column name.");
    return;
  }

  addCustomTableToCanvas(tableName, columns);

  const modalElement = document.getElementById("custom-table-modal");
  bootstrap.Modal.getInstance(modalElement).hide();
}

// Resets the custom table modal after closing.
function resetCustomTableModal() {
  $("#custom-table-name-input").val("");

  $("#custom-column-list").html(`
    <div class="custom-column-row">
      <input class="form-control panel-input custom-column-name" placeholder="Column name e.g. id">
      <select class="form-select panel-input custom-column-type">
        <option value="INT">INT</option>
        <option value="VARCHAR">VARCHAR</option>
        <option value="TEXT">TEXT</option>
        <option value="DECIMAL">DECIMAL</option>
        <option value="DATETIME">DATETIME</option>
        <option value="BOOLEAN">BOOLEAN</option>
      </select>
      <button class="remove-custom-column-btn" type="button">×</button>
    </div>
  `);
}

// Handles adding a condition from panel inputs.
function handleAddCondition() {
  const value = $("#condition-value-input").val().trim();

  if (!value) {
    alert("Please enter a condition value.");
    return;
  }

  addCondition(queryState.selectedElement.id, {
    column: $("#condition-column-select").val(),
    operator: $("#condition-operator-select").val(),
    value: value,
    connector: $("#condition-connector-select").val()
  });
}

// Updates ORDER BY from right panel inputs.
function updateOrderByFromInputs() {
  const column = $("#order-by-select").val();
  const direction = $("#order-direction-select").val();

  updateState({
    orderBy: column ? { column: column, direction: direction } : null
  });
}

// Updates SQL, JSON, and validation output.
function renderQueryOutput() {
  const rawSql = generateSQL(queryState);

  $("#sql-output").html(formatSQL(rawSql));
  $("#json-output").text(generateJSON(queryState));
  renderValidationWarnings(validateQuery(queryState));
}

// Shows beginner-friendly query warnings.
function renderValidationWarnings(warnings) {
  if (warnings.length === 0) {
    $("#validation-warning-list").html("");
    return;
  }

  $("#validation-warning-list").html(
    warnings.map(function (warning) {
      return `<span class="warning-badge">${warning}</span>`;
    }).join("")
  );
}

// Handles clicking inside the canvas.
function handleCanvasMouseDown(event) {
  const mouse = getCanvasMousePosition(event);
  const clickedColumn = hitTestColumn(mouse.x, mouse.y);
  const clickedJoinId = hitTestJoin(mouse.x, mouse.y);
  const clickedTableId = hitTestTable(mouse.x, mouse.y);

  if (clickedColumn && event.shiftKey) {
    if (!relationState.isDrawing) {
      startRelation(clickedColumn.tableId, clickedColumn.columnName);
      return;
    }

    completeRelation(clickedColumn.tableId, clickedColumn.columnName);
    return;
  }

  if (clickedColumn) {
    toggleColumn(clickedColumn.tableId, clickedColumn.columnName);
    updateState({ selectedElement: { type: "table", id: clickedColumn.tableId } });
    return;
  }

  if (clickedJoinId) {
    updateState({ selectedElement: { type: "join", id: clickedJoinId } });
    return;
  }

  if (clickedTableId) {
    updateState({ selectedElement: { type: "table", id: clickedTableId } });
    startDrag(clickedTableId, mouse.x, mouse.y);
    return;
  }

  updateState({ selectedElement: null });
}

// Handles table movement and JOIN preview while moving the mouse.
function handleCanvasMouseMove(event) {
  const mouse = getCanvasMousePosition(event);

  if (dragState.isDragging) {
    onDrag(mouse.x, mouse.y);
    return;
  }

  if (relationState.isDrawing) {
    drawInProgressLine(mouse.x, mouse.y);
  }
}

// Stops table dragging.
function handleCanvasMouseUp() {
  endDrag();
}

// Shows a custom right-click menu for tables and joins.
function handleCanvasRightClick(event) {
  event.preventDefault();

  const mouse = getCanvasMousePosition(event);
  const clickedJoinId = hitTestJoin(mouse.x, mouse.y);
  const clickedTableId = hitTestTable(mouse.x, mouse.y);

  if (clickedJoinId) {
    updateState({ selectedElement: { type: "join", id: clickedJoinId } });
    showContextMenu(event.clientX, event.clientY, "join");
    return;
  }

  if (clickedTableId) {
    updateState({ selectedElement: { type: "table", id: clickedTableId } });
    showContextMenu(event.clientX, event.clientY, "table");
    return;
  }

  hideContextMenu();
}

// Opens the context menu at the mouse position.
function showContextMenu(x, y, type) {
  $("#context-edit-table-btn").toggle(type === "table");
  $("#context-remove-table-btn").toggle(type === "table");
  $("#context-remove-join-btn").toggle(type === "join");

  $("#canvas-context-menu")
    .css({
      left: x + "px",
      top: y + "px"
    })
    .addClass("show");
}

// Hides the context menu.
function hideContextMenu() {
  $("#canvas-context-menu").removeClass("show");
}

// Switches between SQL and JSON output tabs.
function switchOutputTab() {
  $(".output-tab").removeClass("active");
  $(`.output-tab[data-output="${activeOutputTab}"]`).addClass("active");

  $(".query-output").removeClass("active");

  if (activeOutputTab === "sql") {
    $("#sql-output").addClass("active");
  } else {
    $("#json-output").addClass("active");
  }
}

// Changes the active schema and clears the canvas.
function handleSchemaSwitch(schemaName) {
  $(".schema-tab").removeClass("active");
  $(`.schema-tab[data-schema="${schemaName}"]`).addClass("active");

  updateState({
    ...createDefaultQueryState(),
    schema: schemaName
  });

  renderSidebar(schemaName);
}

// Copies the active output panel.
function handleCopyOutput() {
  const textToCopy = activeOutputTab === "sql"
    ? generateSQL(queryState)
    : $("#json-output").text();

  navigator.clipboard.writeText(textToCopy);

  $("#copy-output-btn").text("Copied!");

  setTimeout(function () {
    $("#copy-output-btn").text("Copy");
  }, 900);
}

// Exports the full queryState as a downloadable JSON file.
function handleExportQuery() {
  const jsonText = JSON.stringify(queryState, null, 2);
  const blob = new Blob([jsonText], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(blob);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = "visual-query-builder-query.json";
  downloadLink.click();

  URL.revokeObjectURL(downloadUrl);
}

// Imports queryState from a JSON file.
function handleImportQuery(event) {
  const file = event.target.files[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function (readerEvent) {
    try {
      const importedState = JSON.parse(readerEvent.target.result);

      if (!isValidImportedState(importedState)) {
        alert("Invalid query JSON file.");
        return;
      }

      queryState = importedState;
      saveState();
      renderCanvas();
      renderSidebar(queryState.schema);
      renderRightPanel();
      renderQueryOutput();

      $(".schema-tab").removeClass("active");
      $(`.schema-tab[data-schema="${queryState.schema}"]`).addClass("active");
    } catch (error) {
      alert("Could not read this JSON file.");
    }
  };

  reader.readAsText(file);
  $("#import-query-input").val("");
}

// Checks whether imported JSON looks like a valid queryState object.
function isValidImportedState(importedState) {
  return (
    importedState &&
    typeof importedState === "object" &&
    typeof importedState.schema === "string" &&
    Array.isArray(importedState.tables) &&
    Array.isArray(importedState.joins) &&
    "limit" in importedState
  );
}

// Resets the whole canvas.
function handleResetCanvas() {
  if (!confirm("Reset the canvas and clear the current query?")) return;

  updateState(createDefaultQueryState());
  renderSidebar(queryState.schema);
}

$(document).ready(init);