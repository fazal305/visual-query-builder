# Visual Query Builder

A browser-based visual SQL query designer built with HTML, CSS, Bootstrap 5, jQuery, Canvas API, and vanilla JavaScript.

---

## Live Demo

https://fazal305.github.io/visual-query-builder/

---

## Features

### Visual Canvas
- Drag and drop database tables
- Interactive relationship creation
- Live JOIN preview lines
- Right-click context menu
- Responsive canvas workspace

### SQL Query Builder
- SELECT column builder
- WHERE conditions
- INNER JOIN
- LEFT JOIN
- RIGHT JOIN
- FULL JOIN
- GROUP BY
- ORDER BY
- LIMIT

### Database Schemas
- E-Commerce schema
- Blog schema
- School schema
- Custom table creation

### Query Validation
- Missing JOIN warnings
- Duplicate alias warnings
- Disconnected table warnings
- JOIN datatype mismatch warnings

### Export & Import
- Export query designs as JSON
- Import saved query designs
- Restore full canvas state

### Developer Experience
- SQL syntax highlighting
- JSON output view
- Canvas help guide
- Mobile responsive design
- LocalStorage persistence

---

## Technologies Used

- HTML5
- CSS3
- Bootstrap 5
- jQuery
- Vanilla JavaScript
- Canvas API
- LocalStorage

---

## Project Structure

```text
visual-query-builder/
│
├── index.html
├── vqb-styles.css
├── vqb-app.js
├── vqb-state.js
├── vqb-canvas.js
├── vqb-tables.js
├── vqb-relations.js
├── vqb-generator.js
├── README.md
├── LICENSE
└── .gitignore
```

---

## How To Use

### Add Tables

1. Select a schema
2. Click a table
3. Table appears on canvas

### Select Columns

1. Click table
2. Click columns
3. Columns are added to SELECT

### Create JOINs

1. Hold Shift
2. Click first column
3. Move mouse
4. Click second column

### Add Filters

1. Select table
2. Add WHERE conditions
3. Generate SQL automatically

### Export Query

1. Click Export Query JSON
2. Save file

### Import Query

1. Click Import Query JSON
2. Choose saved file

---

## Future Improvements

- Query Templates Library
- Mini Map Navigation
- Zoom Controls
- SQL Formatting Options
- Query Execution Sandbox
- PostgreSQL Support
- MySQL Support
- SQLite Support

---

## Author

Fazal Abbas

GitHub:
https://github.com/fazal305

LinkedIn:
https://www.linkedin.com/in/fazal-abbas-4653dg86

---

## License

This project is licensed under the MIT License.