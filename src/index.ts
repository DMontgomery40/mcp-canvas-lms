#!/usr/bin/env node

// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  Tool
} from "@modelcontextprotocol/sdk/types.js";
import { CanvasClient } from "./client.js";
import dotenv from "dotenv";
import {
  CreateCourseArgs,
  UpdateCourseArgs,
  CreateAssignmentArgs,
  UpdateAssignmentArgs,
  SubmitGradeArgs,
  EnrollUserArgs,
  CanvasCourse
} from "./types.js";

// Define the tools
const TOOLS: Tool[] = [
  {
    name: "canvas_create_course",
    description: "Create a new course in Canvas",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Name of the course" },
        course_code: { type: "string", description: "Course code (e.g., CS101)" },
        start_at: { type: "string", description: "Course start date (ISO format)" },
        end_at: { type: "string", description: "Course end date (ISO format)" },
        license: { type: "string" },
        is_public: { type: "boolean" }
      },
      required: ["name"]
    }
  },
  {
    name: "canvas_update_course",
    description: "Update an existing course in Canvas",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course to update" },
        name: { type: "string", description: "New name for the course" },
        course_code: { type: "string", description: "New course code" },
        start_at: { type: "string", description: "New start date (ISO format)" },
        end_at: { type: "string", description: "New end date (ISO format)" },
        license: { type: "string" },
        is_public: { type: "boolean" }
      },
      required: ["course_id"]
    }
  },
  {
    name: "canvas_create_assignment",
    description: "Create a new assignment in a Canvas course",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        name: { type: "string", description: "Name of the assignment" },
        description: { type: "string", description: "Assignment description/instructions" },
        due_at: { type: "string", description: "Due date (ISO format)" },
        points_possible: { type: "number", description: "Maximum points possible" },
        submission_types: { 
          type: "array", 
          items: { type: "string" },
          description: "Allowed submission types"
        },
        allowed_extensions: {
          type: "array",
          items: { type: "string" },
          description: "Allowed file extensions for submissions"
        }
      },
      required: ["course_id", "name"]
    }
  },
  {
    name: "canvas_update_assignment",
    description: "Update an existing assignment",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        assignment_id: { type: "number", description: "ID of the assignment to update" },
        name: { type: "string", description: "New name for the assignment" },
        description: { type: "string", description: "New assignment description" },
        due_at: { type: "string", description: "New due date (ISO format)" },
        points_possible: { type: "number", description: "New maximum points" }
      },
      required: ["course_id", "assignment_id"]
    }
  },
  {
    name: "canvas_submit_grade",
    description: "Submit a grade for a student's assignment",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        assignment_id: { type: "number", description: "ID of the assignment" },
        user_id: { type: "number", description: "ID of the student" },
        grade: { 
          oneOf: [
            { type: "number" },
            { type: "string" }
          ],
          description: "Grade to submit (number or letter grade)"
        },
        comment: { type: "string", description: "Optional comment on the submission" }
      },
      required: ["course_id", "assignment_id", "user_id", "grade"]
    }
  },
  {
    name: "canvas_enroll_user",
    description: "Enroll a user in a course",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        user_id: { type: "number", description: "ID of the user to enroll" },
        role: { 
          type: "string", 
          description: "Role for the enrollment (StudentEnrollment, TeacherEnrollment, etc.)" 
        },
        enrollment_state: { 
          type: "string",
          description: "State of the enrollment (active, invited, etc.)"
        }
      },
      required: ["course_id", "user_id"]
    }
  }
];

class CanvasMCPServer {
  private server: Server;
  private client: CanvasClient;

  constructor(token: string, domain: string) {
    this.client = new CanvasClient(token, domain);

    this.server = new Server(
      {
        name: "canvas-mcp-server",
        version: "1.0.0"
      },
      {
        capabilities: {
          resources: {},
          tools: {}
        }
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error("[Canvas MCP Error]", error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupHandlers(): void {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const courses = await this.client.listCourses();
      
      return {
        resources: [
          {
            uri: "courses://list",
            name: "All Courses",
            description: "List of all available Canvas courses",
            mimeType: "application/json"
          },
          ...courses.map((course: CanvasCourse) => ({
            uri: `course://${course.id}`,
            name: `Course: ${course.name}`,
            description: `${course.course_code} - ${course.name}`,
            mimeType: "application/json"
          })),
          ...courses.map((course: CanvasCourse) => ({
            uri: `assignments://${course.id}`,
            name: `Assignments: ${course.name}`,
            description: `Assignments for ${course.name}`,
            mimeType: "application/json"
          })),
          ...courses.map((course: CanvasCourse) => ({
            uri: `users://${course.id}`,
            name: `Users: ${course.name}`,
            description: `Enrolled users in ${course.name}`,
            mimeType: "application/json"
          })),
          ...courses.map((course: CanvasCourse) => ({
            uri: `grades://${course.id}`,
            name: `Grades: ${course.name}`,
            description: `Grade data for ${course.name}`,
            mimeType: "application/json"
          }))
        ]
      };
    });

    // Read resource content
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const uri = request.params.uri;
      const [type, id] = uri.split("://");
      
      try {
        let content;
        
        switch (type) {
          case "courses":
            content = await this.client.listCourses();
            break;
            
          case "course": {
            content = await this.client.getCourse(parseInt(id));
            break;
          }
          
          case "assignments": {
            content = await this.client.listAssignments(parseInt(id));
            break;
          }
          
          case "users": {
            content = await this.client.listUsers(parseInt(id));
            break;
          }
          
          case "grades": {
            content = await this.client.getCourseGrades(parseInt(id));
            break;
          }
          
          default:
            throw new Error(`Unknown resource type: ${type}`);
        }

        return {
          contents: [{
            uri: request.params.uri,
            mimeType: "application/json",
            text: JSON.stringify(content, null, 2)
          }]
        };
      } catch (error) {
        console.error(`Error reading resource ${uri}:`, error);
        throw error;
      }
    });

    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: TOOLS
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const args = request.params.arguments || {};
        
        switch (request.params.name) {
          case "canvas_create_course": {
            const courseArgs = args as unknown as CreateCourseArgs;
            if (!courseArgs.name) {
              throw new Error("Missing required field: name");
            }
            const course = await this.client.createCourse(courseArgs);
            return {
              content: [{ type: "text", text: JSON.stringify(course, null, 2) }]
            };
          }
          
          case "canvas_update_course": {
            const updateArgs = args as unknown as UpdateCourseArgs;
            if (!updateArgs.course_id) {
              throw new Error("Missing required field: course_id");
            }
            const updatedCourse = await this.client.updateCourse(updateArgs);
            return {
              content: [{ type: "text", text: JSON.stringify(updatedCourse, null, 2) }]
            };
          }
          
          case "canvas_create_assignment": {
            const assignmentArgs = args as unknown as CreateAssignmentArgs;
            if (!assignmentArgs.course_id || !assignmentArgs.name) {
              throw new Error("Missing required fields: course_id and name");
            }
            const assignment = await this.client.createAssignment(assignmentArgs);
            return {
              content: [{ type: "text", text: JSON.stringify(assignment, null, 2) }]
            };
          }
          
          case "canvas_update_assignment": {
            const updateAssignmentArgs = args as unknown as UpdateAssignmentArgs;
            if (!updateAssignmentArgs.course_id || !updateAssignmentArgs.assignment_id) {
              throw new Error("Missing required fields: course_id and assignment_id");
            }
            const updatedAssignment = await this.client.updateAssignment(updateAssignmentArgs);
            return {
              content: [{ type: "text", text: JSON.stringify(updatedAssignment, null, 2) }]
            };
          }
          
          case "canvas_submit_grade": {
            const gradeArgs = args as unknown as SubmitGradeArgs;
            if (!gradeArgs.course_id || !gradeArgs.assignment_id || 
                !gradeArgs.user_id || gradeArgs.grade === undefined) {
              throw new Error("Missing required fields for grade submission");
            }
            const submission = await this.client.submitGrade(gradeArgs);
            return {
              content: [{ type: "text", text: JSON.stringify(submission, null, 2) }]
            };
          }
          
          case "canvas_enroll_user": {
            const enrollArgs = args as unknown as EnrollUserArgs;
            if (!enrollArgs.course_id || !enrollArgs.user_id) {
              throw new Error("Missing required fields: course_id and user_id");
            }
            const enrollment = await this.client.enrollUser(enrollArgs);
            return {
              content: [{ type: "text", text: JSON.stringify(enrollment, null, 2) }]
            };
          }
          
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error(`Error executing tool ${request.params.name}:`, error);
        return {
          content: [{
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Canvas MCP server running on stdio");
  }
}

// Main entry point
async function main() {
  // Get all directories from PATH
  const pathDirs = (process.env.PATH || '').split(path.delimiter);
  
  // Create array of possible .env locations
  const envPaths = [
    '.env',                          // Current directory
    'src/.env',                      // src directory
    `${__dirname}/.env`,             // Script directory
    `${process.cwd()}/.env`,         // Working directory
    ...pathDirs.map(dir => path.join(dir, '.env')), // All PATH directories
  ];

  // Try loading from each possible location
  let loaded = false;
  for (const envPath of envPaths) {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.error(`Loaded environment from: ${envPath}`);
      loaded = true;
      break;
    }
  }

  if (!loaded) {
    console.error('Warning: No .env file found in PATH or standard locations');
  }

  const token = process.env.CANVAS_API_TOKEN;
  const domain = process.env.CANVAS_DOMAIN;

  if (!token || !domain) {
    console.error("Please set CANVAS_API_TOKEN and CANVAS_DOMAIN environment variables");
    process.exit(1);
  }

  try {
    const server = new CanvasMCPServer(token, domain);
    await server.run();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main().catch(console.error);
