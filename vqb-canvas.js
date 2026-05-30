let canvas;
let ctx;

const TABLE_NODE_WIDTH = 220;
const TABLE_HEADER_HEIGHT = 36;
const TABLE_ROW_HEIGHT = 30;

const JOIN_COLORS = {
  INNER: "#00f5ff",
  LEFT: "#22c55e",
  RIGHT: "#f5a623",
  FULL: "#ef4444"
};

// Sets up the canvas and drawing context.
function initCanvas() {
  canvas = document.getElementById("query-canvas");
  ctx = canvas.getContext("2d");

  resizeCanvasToDisplaySize();
  renderCanvas();
}

// Resizes the canvas drawing area to match its visual CSS size.
function resizeCanvasToDisplaySize() {
  const canvasBox = canvas.getBoundingClientRect();

  canvas.width = canvasBox.width;
  canvas.height = canvasBox.height;
}

// Clears and redraws the full canvas.
function renderCanvas() {
  if (!ctx || !canvas) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawCanvasGrid();

  queryState.joins.forEach(drawJoinLine);
  queryState.tables.forEach(drawTableNode);
}

// Draws a subtle grid background.
function drawCanvasGrid() {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += 32) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

// Draws one table node on the canvas.
function drawTableNode(tableObj) {
  const bounds = getTableNodeBounds(tableObj);
  const schemaColor = SCHEMAS[queryState.schema].color;
  const isSelected = queryState.selectedElement && queryState.selectedElement.id === tableObj.id;

  ctx.save();

  if (isSelected) {
    ctx.shadowColor = "#00f5ff";
    ctx.shadowBlur = 20;
    ctx.strokeStyle = "#00f5ff";
    ctx.lineWidth = 2;
    ctx.strokeRect(bounds.x - 3, bounds.y - 3, bounds.width + 6, bounds.height + 6);
  }

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#111126";
  ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);

  ctx.fillStyle = schemaColor;
  ctx.fillRect(bounds.x, bounds.y, bounds.width, TABLE_HEADER_HEIGHT);

  ctx.fillStyle = "#080810";
  ctx.font = "700 14px Inter";
  ctx.fillText(tableObj.tableName + " AS " + tableObj.alias, bounds.x + 12, bounds.y + 23);

  tableObj.columns.forEach(function (column, index) {
    const rowY = getColumnRowY(tableObj, index);

    ctx.fillStyle = index % 2 === 0 ? "#15152a" : "#101020";
    ctx.fillRect(bounds.x, rowY, bounds.width, TABLE_ROW_HEIGHT);

    ctx.strokeStyle = column.selected ? "#00f5ff" : "#4b5563";
    ctx.strokeRect(bounds.x + 10, rowY + 9, 12, 12);

    if (column.selected) {
      ctx.fillStyle = "#00f5ff";
      ctx.fillRect(bounds.x + 13, rowY + 12, 6, 6);
    }

    ctx.fillStyle = "#ffffff";
    ctx.font = "500 13px Inter";
    ctx.fillText(column.name, bounds.x + 30, rowY + 20);

    ctx.fillStyle = "#f5a623";
    ctx.font = "700 10px JetBrains Mono";
    ctx.fillText(column.type, bounds.x + 150, rowY + 20);
  });

  ctx.restore();
}

// Draws a curved JOIN line between two table columns.
function drawJoinLine(join) {
  const fromTable = getTableById(join.fromTable);
  const toTable = getTableById(join.toTable);

  if (!fromTable || !toTable) return;

  const fromIndex = fromTable.columns.findIndex(column => column.name === join.fromColumn);
  const toIndex = toTable.columns.findIndex(column => column.name === join.toColumn);

  if (fromIndex === -1 || toIndex === -1) return;

  const startX = fromTable.position.x + TABLE_NODE_WIDTH;
  const startY = getColumnRowY(fromTable, fromIndex) + TABLE_ROW_HEIGHT / 2;
  const endX = toTable.position.x;
  const endY = getColumnRowY(toTable, toIndex) + TABLE_ROW_HEIGHT / 2;

  const curveOffset = Math.max(80, Math.abs(endX - startX) / 2);
  const color = JOIN_COLORS[join.type] || "#00f5ff";
  const isSelected = queryState.selectedElement && queryState.selectedElement.id === join.id;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = isSelected ? 4 : 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = isSelected ? 18 : 8;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(startX + curveOffset, startY, endX - curveOffset, endY, endX, endY);
  ctx.stroke();

  const labelX = (startX + endX) / 2;
  const labelY = (startY + endY) / 2;

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#080810";
  ctx.fillRect(labelX - 28, labelY - 13, 56, 24);

  ctx.fillStyle = color;
  ctx.font = "700 11px JetBrains Mono";
  ctx.textAlign = "center";
  ctx.fillText(join.type, labelX, labelY + 4);

  ctx.restore();
}

// Draws the temporary dashed line while creating a JOIN.
function drawInProgressLine(mouseX, mouseY) {
  if (!relationState.isDrawing) return;

  const fromTable = getTableById(relationState.fromTable);

  if (!fromTable) return;

  const fromIndex = fromTable.columns.findIndex(function (column) {
    return column.name === relationState.fromColumn;
  });

  if (fromIndex === -1) return;

  const startX = fromTable.position.x + TABLE_NODE_WIDTH;
  const startY = getColumnRowY(fromTable, fromIndex) + TABLE_ROW_HEIGHT / 2;
  const curveOffset = Math.max(80, Math.abs(mouseX - startX) / 2);

  renderCanvas();

  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  ctx.shadowColor = "#00f5ff";
  ctx.shadowBlur = 14;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.bezierCurveTo(startX + curveOffset, startY, mouseX - curveOffset, mouseY, mouseX, mouseY);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.fillStyle = "#00f5ff";
  ctx.font = "700 11px JetBrains Mono";
  ctx.fillText("CONNECTING...", mouseX + 12, mouseY - 12);

  ctx.restore();
}

// Returns the size and position of a table node.
function getTableNodeBounds(tableObj) {
  return {
    x: tableObj.position.x,
    y: tableObj.position.y,
    width: TABLE_NODE_WIDTH,
    height: TABLE_HEADER_HEIGHT + tableObj.columns.length * TABLE_ROW_HEIGHT
  };
}

// Returns the Y position of a column row.
function getColumnRowY(tableObj, columnIndex) {
  return tableObj.position.y + TABLE_HEADER_HEIGHT + columnIndex * TABLE_ROW_HEIGHT;
}

// Checks if the mouse is over a table.
function hitTestTable(mouseX, mouseY) {
  for (let i = queryState.tables.length - 1; i >= 0; i--) {
    const table = queryState.tables[i];
    const bounds = getTableNodeBounds(table);

    if (
      mouseX >= bounds.x &&
      mouseX <= bounds.x + bounds.width &&
      mouseY >= bounds.y &&
      mouseY <= bounds.y + bounds.height
    ) {
      return table.id;
    }
  }

  return null;
}

// Checks if the mouse is over a column row.
function hitTestColumn(mouseX, mouseY) {
  for (let i = queryState.tables.length - 1; i >= 0; i--) {
    const table = queryState.tables[i];
    const bounds = getTableNodeBounds(table);

    const isInsideX = mouseX >= bounds.x && mouseX <= bounds.x + bounds.width;
    const isInsideRows = mouseY >= bounds.y + TABLE_HEADER_HEIGHT && mouseY <= bounds.y + bounds.height;

    if (!isInsideX || !isInsideRows) continue;

    const columnIndex = Math.floor((mouseY - bounds.y - TABLE_HEADER_HEIGHT) / TABLE_ROW_HEIGHT);
    const column = table.columns[columnIndex];

    if (column) {
      return {
        tableId: table.id,
        columnName: column.name
      };
    }
  }

  return null;
}

// Checks if the mouse is close to a JOIN label.
function hitTestJoin(mouseX, mouseY) {
  for (let i = queryState.joins.length - 1; i >= 0; i--) {
    const join = queryState.joins[i];
    const fromTable = getTableById(join.fromTable);
    const toTable = getTableById(join.toTable);

    if (!fromTable || !toTable) continue;

    const fromIndex = fromTable.columns.findIndex(column => column.name === join.fromColumn);
    const toIndex = toTable.columns.findIndex(column => column.name === join.toColumn);

    if (fromIndex === -1 || toIndex === -1) continue;

    const startX = fromTable.position.x + TABLE_NODE_WIDTH;
    const startY = getColumnRowY(fromTable, fromIndex) + TABLE_ROW_HEIGHT / 2;
    const endX = toTable.position.x;
    const endY = getColumnRowY(toTable, toIndex) + TABLE_ROW_HEIGHT / 2;

    const labelX = (startX + endX) / 2;
    const labelY = (startY + endY) / 2;

    if (Math.abs(mouseX - labelX) <= 40 && Math.abs(mouseY - labelY) <= 24) {
      return join.id;
    }
  }

  return null;
}

// Converts browser mouse position into canvas position.
function getCanvasMousePosition(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}