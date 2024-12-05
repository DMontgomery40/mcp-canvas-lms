
# Canvas MCP Server

A Model Context Protocol (MCP) server for interacting with the Canvas API. This server allows you to manage courses, assignments, enrollments, and grades within Canvas.

## Prerequisites

- **Node.js**: Version 18 or higher
- **Canvas API Token**: Obtain from your Canvas account
- **Canvas Domain**: Typically `canvas.instructure.com`

## Setup

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/canvas-mcp-server.git
   cd canvas-mcp-server

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**

Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Edit .env and replace the placeholder values with your actual Canvas API token and domain.

Build the Project

   ```bash
   npm run build
   ```

4. **Run the Server**

   ```bash
   npm start
   ```

   The server will start and listen for MCP requests via stdio.

### Connecting to Claude Desktop

1. **Update Claude Configuration**

   Add the MCP server configuration to your claude_desktop_config.json:

```
  "canvas-mcp-server": {
      "command": "npx",
      "args": ["-y", "canvas-mcp-server"]
    },
```
Restart Claude Desktop

   Quit Claude Desktop completely.
   Start Claude Desktop again.
   Navigate to the 🔌 menu to find and connect your Canvas MCP server.

### Available Tools (more student focused stuff coming soon)

- `canvas_create_course`: Create a new course in Canvas.
- `canvas_update_course`: Update an existing course in Canvas.
- `canvas_create_assignment`: Create a new assignment in a Canvas course.
- `canvas_update_assignment`: Update an existing assignment.
- `canvas_submit_grade`: Submit a grade for a student's assignment.
- `canvas_enroll_user`: Enroll a user in a course.

### Error Handling

Tools return error messages with isError: true to indicate issues.
Ensure all required environment variables are set to avoid runtime errors.

### Troubleshooting

- **Build Errors:**

Check TypeScript version: npx tsc --version
   Clean and rebuild: rm -rf build/ && npm run build

- **Runtime Errors:**

   Check logs for detailed error messages.
   Ensure environment variables are correctly set.

- **Type Errors:**

   Validate types using TypeScript's type checking: npx tsc --noEmit


### Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

### License
This project is licensed under the MIT License.

---

### Additional Notes

- **Type Safety**: The `types.ts` file ensures that all interactions with the Canvas API are type-safe, reducing runtime errors and improving code maintainability.

- **Error Handling**: The server gracefully handles errors by returning meaningful messages with the `isError` flag, allowing the client (e.g., Claude Desktop) to understand and react appropriately.

- **Environment Variables**: Sensitive information like API tokens are managed through environment variables, enhancing security and flexibility across different environments.

- **Modularity**: Separating concerns into different files (`types.ts`, `client.ts`, `index.ts`) makes the codebase easier to navigate and maintain.

Feel free to adjust the file paths and configurations according to your project's specific needs. Let me know if you need further assistance!