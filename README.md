# Visual Query Builder

A browser-based SQL design workspace that lets users assemble queries by placing tables on a canvas, selecting columns, drawing JOIN relationships, and exporting the finished query state.

## Live Demo

https://fazal305.github.io/visual-query-builder/

## Project Overview

Visual Query Builder turns database query writing into an interactive canvas workflow. Instead of typing every JOIN, alias, filter, and output column by hand, users can add tables from sample schemas, connect related columns, tune query options, and watch the SQL update instantly.

The project is built as a front-end only application, making it easy to host on GitHub Pages while still demonstrating state management, canvas rendering, import/export behavior, validation logic, and modular JavaScript architecture.

## Key Features

- Drag-and-drop canvas for database table nodes
- Built-in E-Commerce, Blog, and School schemas
- Custom table creation with configurable column types
- Column selection for generated SELECT clauses
- Visual INNER, LEFT, RIGHT, and FULL JOIN relationships
- WHERE condition builder with common SQL operators
- GROUP BY, ORDER BY, and LIMIT controls
- Live SQL output with lightweight syntax highlighting
- JSON export/import for saving query designs
- LocalStorage persistence between browser sessions
- Validation warnings for missing joins, duplicate aliases, disconnected tables, and JOIN type mismatches
- Responsive layout for desktop and smaller screens

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Canvas API
- LocalStorage

## How It Works

1. Choose a schema from the sidebar.
2. Add one or more tables to the canvas.
3. Click columns to include them in the SELECT clause.
4. Hold Shift and click columns across tables to create JOINs.
5. Use the properties panel to edit aliases, filters, join types, grouping, ordering, and limits.
6. Copy the generated SQL or export the full query design as JSON.

## Project Structure

```text
visual-query-builder/
|-- index.html
|-- vqb-styles.css
|-- vqb-app.js
|-- vqb-state.js
|-- vqb-canvas.js
|-- vqb-tables.js
|-- vqb-relations.js
|-- vqb-generator.js
|-- README.md
|-- LICENSE
```

## Portfolio Notes

This project highlights practical front-end engineering skills:

- Canvas-based interaction and hit testing
- Modular browser JavaScript without a build step
- Client-side state persistence
- Dynamic SQL string generation
- Import/export workflows
- Form-driven UI updates
- Validation logic for beginner-friendly feedback

## Future Improvements

- Add query templates for common reporting workflows
- Add zoom and pan controls for large diagrams
- Support PostgreSQL, MySQL, and SQLite output modes
- Add a mini-map for larger schemas
- Add SQL formatting preferences
- Add optional query execution against mock data

## Author

Fazal Abbas

- GitHub: https://github.com/fazal305
- LinkedIn: https://www.linkedin.com/in/fazal-abbas-4653dg86

## License

This project is licensed under the MIT License.
