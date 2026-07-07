let activeOutputTab = "sql";

const dom = {};

function init() {
  cacheDom();
  loadState();
  initCanvas();
  renderSidebar(queryState.schema);
  renderQueryOutput();
  renderRightPanel();
  updateSchemaTabs();
  bindAppEvents();
}

function cacheDom() {
  dom.schemaTabs = document.querySelectorAll(".schema-tab");
  dom.tableSearchInput = document.getElementById("table-search-input");
  dom.schemaTableList = document.getElementById("schema-table-list");
  dom.outputTabs = document.querySelectorAll(".output-tab");
  dom.copyOutputBtn = document.getElementById("copy-output-btn");
  dom.resetCanvasBtn = document.getElementById("reset-canvas-btn");
  dom.exportQueryBtn = document.getElementById("export-query-btn");
  dom.importQueryInput = document.getElementById("import-query-input");
  dom.queryCanvas = document.getElementById("query-canvas");
  dom.contextMenu = document.getElementById("canvas-context-menu");
  dom.contextEditTableBtn = document.getElementById("context-edit-table-btn");
  dom.contextRemoveTableBtn = document.getElementById("context-remove-table-btn");
  dom.contextRemoveJoinBtn = document.getElementById("context-remove-join-btn");
  dom.customTableBtn = document.getElementById("custom-table-btn");
  dom.customTableModal = document.getElementById("custom-table-modal");
  dom.closeCustomTableModalBtn = document.getElementById("close-custom-table-modal-btn");
  dom.cancelCustomTableBtn = document.getElementById("cancel-custom-table-btn");
  dom.customTableNameInput = document.getElementById("custom-table-name-input");
  dom.customColumnList = document.getElementById("custom-column-list");
  dom.addCustomColumnBtn = document.getElementById("add-custom-column-btn");
  dom.createCustomTableBtn = document.getElementById("create-custom-table-btn");
  dom.rightPanelContent = document.getElementById("right-panel-content");
  dom.sqlOutput = document.getElementById("sql-output");
  dom.jsonOutput = document.getElementById("json-output");
  dom.validationWarningList = document.getElementById("validation-warning-list");
  dom.tableCountStat = document.getElementById("table-count-stat");
  dom.joinCountStat = document.getElementById("join-count-stat");
  dom.columnCountStat = document.getElementById("column-count-stat");
}

function bindAppEvents() {
  dom.schemaTableList.addEventListener("click", function (event) {
    const tableItem = event.target.closest(".schema-table-item");

    if (!tableItem) return;

    addTableToCanvas(tableItem.dataset.table, queryState.schema);
  });

  dom.schemaTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      handleSchemaSwitch(tab.dataset.schema);
    });
  });

  dom.tableSearchInput.addEventListener("input", function () {
    renderSidebar(queryState.schema, dom.tableSearchInput.value);
  });

  dom.outputTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      activeOutputTab = tab.dataset.output;
      switchOutputTab();
    });
  });

  dom.copyOutputBtn.addEventListener("click", handleCopyOutput);
  dom.resetCanvasBtn.addEventListener("click", handleResetCanvas);
  dom.exportQueryBtn.addEventListener("click", handleExportQuery);
  dom.importQueryInput.addEventListener("change", handleImportQuery);

  dom.queryCanvas.addEventListener("mousedown", handleCanvasMouseDown);
  dom.queryCanvas.addEventListener("contextmenu", handleCanvasRightClick);

  document.addEventListener("mousemove", handleCanvasMouseMove);
  document.addEventListener("mouseup", handleCanvasMouseUp);

  document.addEventListener("click", function (event) {
    if (!event.target.closest("#canvas-context-menu")) {
      hideContextMenu();
    }
  });

  dom.contextRemoveTableBtn.addEventListener("click", function () {
    if (queryState.selectedElement?.type === "table") {
      removeTable(queryState.selectedElement.id);
    }

    hideContextMenu();
  });

  dom.contextRemoveJoinBtn.addEventListener("click", function () {
    if (queryState.selectedElement?.type === "join") {
      removeJoin(queryState.selectedElement.id);
    }

    hideContextMenu();
  });

  dom.contextEditTableBtn.addEventListener("click", hideContextMenu);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      cancelRelation();
      hideContextMenu();
      closeCustomTableModal();
      renderCanvas();
    }
  });

  dom.rightPanelContent.addEventListener("input", handleRightPanelInput);
  dom.rightPanelContent.addEventListener("change", handleRightPanelChange);
  dom.rightPanelContent.addEventListener("click", handleRightPanelClick);

  dom.customTableBtn.addEventListener("click", openCustomTableModal);
  dom.closeCustomTableModalBtn.addEventListener("click", closeCustomTableModal);
  dom.cancelCustomTableBtn.addEventListener("click", closeCustomTableModal);
  dom.customTableModal.addEventListener("click", function (event) {
    if (event.target === dom.customTableModal) {
      closeCustomTableModal();
    }
  });
  dom.addCustomColumnBtn.addEventListener("click", addCustomColumnRow);
  dom.createCustomTableBtn.addEventListener("click", handleCreateCustomTable);
  dom.customColumnList.addEventListener("click", function (event) {
    if (event.target.classList.contains("remove-custom-column-btn")) {
      removeCustomColumnRow(event.target);
    }
  });

  window.addEventListener("resize", function () {
    resizeCanvasToDisplaySize();
    renderCanvas();
  });
}

function renderSidebar(schemaName, searchTerm = "") {
  const schema = SCHEMAS[schemaName];
  const filteredTables = Object.keys(schema.tables).filter(function (tableName) {
    return tableName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  dom.schemaTableList.innerHTML = filteredTables.map(function (tableName) {
    const columns = schema.tables[tableName];

    return `
      <button class="schema-table-item" type="button" data-table="${escapeAttribute(tableName)}">
        <h4>${escapeHTML(tableName)}</h4>
        <span class="column-count">${columns.length} columns</span>
      </button>
    `;
  }).join("");
}

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

function renderGlobalQueryControls() {
  dom.rightPanelContent.innerHTML = `
    <h3>Query Controls</h3>
    ${getGlobalControlsHTML()}
    <p class="hint-text">Tip: Shift + click one column, then Shift + click another table column to create a JOIN.</p>
  `;
}

function renderTableProperties() {
  const table = getTableById(queryState.selectedElement.id);

  if (!table) return;

  const columnControls = table.columns.map(function (column) {
    return `
      <label class="column-control">
        <input 
          class="column-toggle-input" 
          type="checkbox" 
          data-column="${escapeAttribute(column.name)}"
          ${column.selected ? "checked" : ""}
        >
        <span>${escapeHTML(column.name)}</span>
        <small>${escapeHTML(column.type)}</small>
      </label>
    `;
  }).join("");

  dom.rightPanelContent.innerHTML = `
    <h3>${escapeHTML(table.tableName)}</h3>

    <label class="form-label" for="alias-input">Alias</label>
    <input id="alias-input" class="panel-input" value="${escapeAttribute(table.alias)}">

    <div class="panel-section-title">SELECT Columns</div>
    <div class="column-control-list">${columnControls}</div>

    <div class="panel-section-title">WHERE Conditions</div>
    ${getConditionBuilderHTML(table)}
    ${getConditionsListHTML(table)}

    <button id="remove-selected-table-btn" class="secondary-btn full-width" type="button">Remove Table</button>
  `;
}

function renderJoinProperties() {
  const join = getJoinById(queryState.selectedElement.id);

  if (!join) return;

  const fromTable = getTableById(join.fromTable);
  const toTable = getTableById(join.toTable);

  if (!fromTable || !toTable) return;

  dom.rightPanelContent.innerHTML = `
    <h3>JOIN Relationship</h3>

    <p class="join-summary">
      ${escapeHTML(fromTable.alias)}.${escapeHTML(join.fromColumn)}
      <br>=<br>
      ${escapeHTML(toTable.alias)}.${escapeHTML(join.toColumn)}
    </p>

    <label class="form-label" for="join-type-select">JOIN Type</label>
    <select id="join-type-select" class="panel-input">
      <option value="INNER" ${join.type === "INNER" ? "selected" : ""}>INNER JOIN</option>
      <option value="LEFT" ${join.type === "LEFT" ? "selected" : ""}>LEFT JOIN</option>
      <option value="RIGHT" ${join.type === "RIGHT" ? "selected" : ""}>RIGHT JOIN</option>
      <option value="FULL" ${join.type === "FULL" ? "selected" : ""}>FULL JOIN</option>
    </select>

    <button id="remove-join-btn" class="secondary-btn full-width" type="button">Remove JOIN</button>
  `;
}

function getConditionBuilderHTML(table) {
  const columnOptions = table.columns.map(function (column) {
    return `<option value="${escapeAttribute(column.name)}">${escapeHTML(column.name)}</option>`;
  }).join("");

  return `
    <select id="condition-column-select" class="panel-input">${columnOptions}</select>

    <select id="condition-operator-select" class="panel-input">
      <option value="=">=</option>
      <option value="!=">!=</option>
      <option value=">">&gt;</option>
      <option value="<">&lt;</option>
      <option value=">=">&gt;=</option>
      <option value="<=">&lt;=</option>
      <option value="LIKE">LIKE</option>
      <option value="IN">IN</option>
    </select>

    <input id="condition-value-input" class="panel-input" placeholder="Value e.g. active">

    <select id="condition-connector-select" class="panel-input">
      <option value="AND">AND</option>
      <option value="OR">OR</option>
    </select>

    <button id="add-condition-btn" class="primary-btn full-width" type="button">Add Condition</button>
  `;
}

function getConditionsListHTML(table) {
  if (table.conditions.length === 0) {
    return `<p class="hint-text">No conditions added yet.</p>`;
  }

  return table.conditions.map(function (condition, index) {
    return `
      <div class="condition-pill">
        <span>${escapeHTML(condition.connector)} ${escapeHTML(table.alias)}.${escapeHTML(condition.column)} ${escapeHTML(condition.operator)} ${escapeHTML(condition.value)}</span>
        <button class="remove-condition-btn" type="button" data-index="${index}">x</button>
      </div>
    `;
  }).join("");
}

function getGlobalControlsHTML() {
  const columnOptions = getAllQualifiedColumns().map(function (columnName) {
    return `<option value="${escapeAttribute(columnName)}" ${queryState.groupBy === columnName ? "selected" : ""}>${escapeHTML(columnName)}</option>`;
  }).join("");

  const orderColumnOptions = getAllQualifiedColumns().map(function (columnName) {
    const isSelected = queryState.orderBy && queryState.orderBy.column === columnName;
    return `<option value="${escapeAttribute(columnName)}" ${isSelected ? "selected" : ""}>${escapeHTML(columnName)}</option>`;
  }).join("");

  return `
    <div class="panel-section-title">GROUP BY</div>
    <select id="group-by-select" class="panel-input">
      <option value="">None</option>
      ${columnOptions}
    </select>

    <div class="panel-section-title">ORDER BY</div>
    <select id="order-by-select" class="panel-input">
      <option value="">None</option>
      ${orderColumnOptions}
    </select>

    <select id="order-direction-select" class="panel-input">
      <option value="ASC" ${queryState.orderBy && queryState.orderBy.direction === "ASC" ? "selected" : ""}>ASC</option>
      <option value="DESC" ${queryState.orderBy && queryState.orderBy.direction === "DESC" ? "selected" : ""}>DESC</option>
    </select>

    <div class="panel-section-title">LIMIT</div>
    <input id="limit-input" type="number" class="panel-input" value="${queryState.limit || ""}" min="1">
  `;
}

function getAllQualifiedColumns() {
  const columns = [];

  queryState.tables.forEach(function (table) {
    table.columns.forEach(function (column) {
      columns.push(table.alias + "." + column.name);
    });
  });

  return columns;
}

function addCustomColumnRow() {
  dom.customColumnList.insertAdjacentHTML("beforeend", `
    <div class="custom-column-row">
      <input class="panel-input custom-column-name" placeholder="Column name e.g. created_at">
      <select class="panel-input custom-column-type">
        <option value="INT">INT</option>
        <option value="VARCHAR">VARCHAR</option>
        <option value="TEXT">TEXT</option>
        <option value="DECIMAL">DECIMAL</option>
        <option value="DATETIME">DATETIME</option>
        <option value="BOOLEAN">BOOLEAN</option>
      </select>
      <button class="remove-custom-column-btn" type="button">x</button>
    </div>
  `);
}

function removeCustomColumnRow(buttonElement) {
  const rows = dom.customColumnList.querySelectorAll(".custom-column-row");

  if (rows.length <= 1) {
    alert("A custom table needs at least one column.");
    return;
  }

  buttonElement.closest(".custom-column-row").remove();
}

function handleCreateCustomTable() {
  const tableName = dom.customTableNameInput.value.trim();
  const columns = [];

  if (!tableName) {
    alert("Please enter a table name.");
    return;
  }

  dom.customColumnList.querySelectorAll(".custom-column-row").forEach(function (row) {
    const columnName = row.querySelector(".custom-column-name").value.trim();
    const columnType = row.querySelector(".custom-column-type").value;

    if (columnName) {
      columns.push({ name: columnName, type: columnType });
    }
  });

  if (columns.length === 0) {
    alert("Please add at least one column name.");
    return;
  }

  addCustomTableToCanvas(tableName, columns);
  closeCustomTableModal();
}

function openCustomTableModal() {
  dom.customTableModal.classList.add("show");
  dom.customTableModal.setAttribute("aria-hidden", "false");
  dom.customTableNameInput.focus();
}

function closeCustomTableModal() {
  if (!dom.customTableModal.classList.contains("show")) return;

  dom.customTableModal.classList.remove("show");
  dom.customTableModal.setAttribute("aria-hidden", "true");
  resetCustomTableModal();
}

function resetCustomTableModal() {
  dom.customTableNameInput.value = "";

  dom.customColumnList.innerHTML = `
    <div class="custom-column-row">
      <input class="panel-input custom-column-name" placeholder="Column name e.g. id">
      <select class="panel-input custom-column-type">
        <option value="INT">INT</option>
        <option value="VARCHAR">VARCHAR</option>
        <option value="TEXT">TEXT</option>
        <option value="DECIMAL">DECIMAL</option>
        <option value="DATETIME">DATETIME</option>
        <option value="BOOLEAN">BOOLEAN</option>
      </select>
      <button class="remove-custom-column-btn" type="button">x</button>
    </div>
  `;
}

function handleRightPanelInput(event) {
  if (event.target.id === "alias-input") {
    setTableAlias(queryState.selectedElement.id, event.target.value);
  }

  if (event.target.id === "limit-input") {
    updateState({ limit: Number(event.target.value) || null });
  }
}

function handleRightPanelChange(event) {
  if (event.target.classList.contains("column-toggle-input")) {
    toggleColumn(queryState.selectedElement.id, event.target.dataset.column);
  }

  if (event.target.id === "join-type-select") {
    setJoinType(queryState.selectedElement.id, event.target.value);
  }

  if (event.target.id === "group-by-select") {
    updateState({ groupBy: event.target.value || null });
  }

  if (event.target.id === "order-by-select" || event.target.id === "order-direction-select") {
    updateOrderByFromInputs();
  }
}

function handleRightPanelClick(event) {
  if (event.target.id === "add-condition-btn") {
    handleAddCondition();
  }

  if (event.target.classList.contains("remove-condition-btn")) {
    removeCondition(queryState.selectedElement.id, Number(event.target.dataset.index));
  }

  if (event.target.id === "remove-selected-table-btn") {
    removeTable(queryState.selectedElement.id);
  }

  if (event.target.id === "remove-join-btn") {
    removeJoin(queryState.selectedElement.id);
  }
}

function handleAddCondition() {
  const valueInput = document.getElementById("condition-value-input");
  const value = valueInput.value.trim();

  if (!value) {
    alert("Please enter a condition value.");
    return;
  }

  addCondition(queryState.selectedElement.id, {
    column: document.getElementById("condition-column-select").value,
    operator: document.getElementById("condition-operator-select").value,
    value: value,
    connector: document.getElementById("condition-connector-select").value
  });
}

function updateOrderByFromInputs() {
  const column = document.getElementById("order-by-select").value;
  const direction = document.getElementById("order-direction-select").value;

  updateState({
    orderBy: column ? { column: column, direction: direction } : null
  });
}

function renderQueryOutput() {
  const rawSql = generateSQL(queryState);

  dom.sqlOutput.innerHTML = formatSQL(rawSql);
  dom.jsonOutput.textContent = generateJSON(queryState);
  renderValidationWarnings(validateQuery(queryState));
  renderStats();
}

function renderValidationWarnings(warnings) {
  if (warnings.length === 0) {
    dom.validationWarningList.innerHTML = "";
    return;
  }

  dom.validationWarningList.innerHTML = warnings.map(function (warning) {
    return `<span class="warning-badge">${escapeHTML(warning)}</span>`;
  }).join("");
}

function renderStats() {
  const selectedColumnCount = queryState.tables.reduce(function (count, table) {
    return count + table.columns.filter(function (column) {
      return column.selected;
    }).length;
  }, 0);

  dom.tableCountStat.textContent = queryState.tables.length;
  dom.joinCountStat.textContent = queryState.joins.length;
  dom.columnCountStat.textContent = selectedColumnCount;
}

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

function handleCanvasMouseUp() {
  endDrag();
}

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

function showContextMenu(x, y, type) {
  dom.contextEditTableBtn.hidden = type !== "table";
  dom.contextRemoveTableBtn.hidden = type !== "table";
  dom.contextRemoveJoinBtn.hidden = type !== "join";
  dom.contextMenu.style.left = x + "px";
  dom.contextMenu.style.top = y + "px";
  dom.contextMenu.classList.add("show");
}

function hideContextMenu() {
  dom.contextMenu.classList.remove("show");
}

function switchOutputTab() {
  dom.outputTabs.forEach(function (tab) {
    tab.classList.toggle("active", tab.dataset.output === activeOutputTab);
  });

  dom.sqlOutput.classList.toggle("active", activeOutputTab === "sql");
  dom.jsonOutput.classList.toggle("active", activeOutputTab === "json");
}

function handleSchemaSwitch(schemaName) {
  updateState({
    ...createDefaultQueryState(),
    schema: schemaName
  });

  updateSchemaTabs();
  renderSidebar(schemaName);
}

function updateSchemaTabs() {
  dom.schemaTabs.forEach(function (tab) {
    tab.classList.toggle("active", tab.dataset.schema === queryState.schema);
  });
}

async function handleCopyOutput() {
  const textToCopy = activeOutputTab === "sql"
    ? generateSQL(queryState)
    : dom.jsonOutput.textContent;

  try {
    await navigator.clipboard.writeText(textToCopy);
    dom.copyOutputBtn.textContent = "Copied";
  } catch (error) {
    dom.copyOutputBtn.textContent = "Copy failed";
  }

  setTimeout(function () {
    dom.copyOutputBtn.textContent = "Copy";
  }, 900);
}

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
      updateSchemaTabs();
    } catch (error) {
      alert("Could not read this JSON file.");
    }
  };

  reader.readAsText(file);
  dom.importQueryInput.value = "";
}

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

function handleResetCanvas() {
  if (!confirm("Reset the canvas and clear the current query?")) return;

  updateState(createDefaultQueryState());
  updateSchemaTabs();
  renderSidebar(queryState.schema);
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHTML(value).replaceAll('"', "&quot;");
}

document.addEventListener("DOMContentLoaded", init);
