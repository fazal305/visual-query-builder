const SCHEMAS = {
  ecommerce: {
    label: "E-Commerce",
    color: "#00f5ff",
    tables: {
      users: [
        { name: "id", type: "INT" },
        { name: "name", type: "VARCHAR" },
        { name: "email", type: "VARCHAR" },
        { name: "created_at", type: "DATETIME" }
      ],
      orders: [
        { name: "id", type: "INT" },
        { name: "user_id", type: "INT" },
        { name: "total", type: "DECIMAL" },
        { name: "status", type: "VARCHAR" },
        { name: "created_at", type: "DATETIME" }
      ],
      products: [
        { name: "id", type: "INT" },
        { name: "name", type: "VARCHAR" },
        { name: "price", type: "DECIMAL" },
        { name: "stock", type: "INT" },
        { name: "category_id", type: "INT" }
      ],
      order_items: [
        { name: "id", type: "INT" },
        { name: "order_id", type: "INT" },
        { name: "product_id", type: "INT" },
        { name: "quantity", type: "INT" },
        { name: "price", type: "DECIMAL" }
      ],
      categories: [
        { name: "id", type: "INT" },
        { name: "name", type: "VARCHAR" },
        { name: "parent_id", type: "INT" }
      ]
    }
  },

  blog: {
    label: "Blog",
    color: "#bf5fff",
    tables: {
      users: [
        { name: "id", type: "INT" },
        { name: "username", type: "VARCHAR" },
        { name: "email", type: "VARCHAR" },
        { name: "role", type: "VARCHAR" }
      ],
      posts: [
        { name: "id", type: "INT" },
        { name: "user_id", type: "INT" },
        { name: "title", type: "VARCHAR" },
        { name: "content", type: "TEXT" },
        { name: "published_at", type: "DATETIME" },
        { name: "status", type: "VARCHAR" }
      ],
      comments: [
        { name: "id", type: "INT" },
        { name: "post_id", type: "INT" },
        { name: "user_id", type: "INT" },
        { name: "body", type: "TEXT" },
        { name: "created_at", type: "DATETIME" }
      ],
      tags: [
        { name: "id", type: "INT" },
        { name: "name", type: "VARCHAR" },
        { name: "slug", type: "VARCHAR" }
      ],
      post_tags: [
        { name: "post_id", type: "INT" },
        { name: "tag_id", type: "INT" }
      ]
    }
  },

  school: {
    label: "School",
    color: "#f5a623",
    tables: {
      students: [
        { name: "id", type: "INT" },
        { name: "name", type: "VARCHAR" },
        { name: "email", type: "VARCHAR" },
        { name: "grade_level", type: "INT" },
        { name: "enrolled_at", type: "DATETIME" }
      ],
      courses: [
        { name: "id", type: "INT" },
        { name: "title", type: "VARCHAR" },
        { name: "credits", type: "INT" },
        { name: "department_id", type: "INT" }
      ],
      enrollments: [
        { name: "student_id", type: "INT" },
        { name: "course_id", type: "INT" },
        { name: "grade", type: "VARCHAR" },
        { name: "enrolled_at", type: "DATETIME" }
      ],
      teachers: [
        { name: "id", type: "INT" },
        { name: "name", type: "VARCHAR" },
        { name: "email", type: "VARCHAR" },
        { name: "department_id", type: "INT" }
      ],
      departments: [
        { name: "id", type: "INT" },
        { name: "name", type: "VARCHAR" },
        { name: "head_teacher_id", type: "INT" }
      ]
    }
  }
};

// Creates a fresh query state object.
function createDefaultQueryState() {
  return {
    schema: "ecommerce",
    tables: [],
    joins: [],
    orderBy: null,
    groupBy: null,
    limit: 100,
    selectedElement: null
  };
}

let queryState = createDefaultQueryState();

// Merges new state data into queryState and refreshes the app.
function updateState(patch) {
  queryState = {
    ...queryState,
    ...patch
  };

  saveState();

  if (typeof renderCanvas === "function") {
    renderCanvas();
  }

  if (typeof renderQueryOutput === "function") {
    renderQueryOutput();
  }

  if (typeof renderRightPanel === "function") {
    renderRightPanel();
  }
}

// Finds a table node by its unique ID.
function getTableById(id) {
  return queryState.tables.find(function (table) {
    return table.id === id;
  });
}

// Finds a join by its unique ID.
function getJoinById(id) {
  return queryState.joins.find(function (join) {
    return join.id === id;
  });
}

// Creates a unique table node ID.
function generateNodeId() {
  return "node_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// Creates a unique join ID.
function generateJoinId() {
  return "join_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
}

// Saves the current query state into localStorage.
function saveState() {
  localStorage.setItem("visualQueryBuilderState", JSON.stringify(queryState));
}

// Loads saved query state from localStorage.
function loadState() {
  const savedState = localStorage.getItem("visualQueryBuilderState");

  if (!savedState) {
    return;
  }

  queryState = JSON.parse(savedState);
}