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
import * as dotenv from "dotenv";
import {
  CreateCourseArgs,
  UpdateCourseArgs,
  CreateAssignmentArgs,
  UpdateAssignmentArgs,
  SubmitGradeArgs,
  EnrollUserArgs,
  CanvasCourse,
  CanvasAssignmentSubmission
} from "./types.js";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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
  },
  {
    name: "canvas_submit_assignment",
    description: "Submit an assignment in Canvas",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        assignment_id: { type: "number", description: "ID of the assignment" },
        user_id: { type: "number", description: "ID of the student" },
        submission_type: { type: "string", description: "Type of submission (e.g., online_upload)" },
        body: { type: "string", description: "Submission body or file URL" }
      },
      required: [
        "course_id",
        "assignment_id",
        "user_id",
        "submission_type"
      ]
    }
  },
  {
    name: "canvas_list_quizzes",
    description: "List all quizzes in a course",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" }
      },
      required: ["course_id"]
    }
  },
  {
    name: "canvas_get_quiz",
    description: "Get details of a specific quiz",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        quiz_id: { type: "number", description: "ID of the quiz" }
      },
      required: ["course_id", "quiz_id"]
    }
  },
  {
    name: "canvas_create_quiz",
    description: "Create a new quiz in a course",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        title: { type: "string", description: "Title of the quiz" },
        quiz_type: { type: "string", description: "Type of the quiz (e.g., graded)" },
        time_limit: { type: "number", description: "Time limit in minutes" },
        published: { type: "boolean", description: "Is the quiz published" },
        description: { type: "string", description: "Description of the quiz" },
        due_at: { type: "string", description: "Due date (ISO format)" }
      },
      required: ["course_id", "title"]
    }
  },
  {
    name: "canvas_update_quiz",
    description: "Update an existing quiz",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        quiz_id: { type: "number", description: "ID of the quiz to update" },
        title: { type: "string", description: "New title of the quiz" },
        quiz_type: { type: "string", description: "New type of the quiz" },
        time_limit: { type: "number", description: "New time limit in minutes" },
        published: { type: "boolean", description: "Is the quiz published" },
        description: { type: "string", description: "New description of the quiz" },
        due_at: { type: "string", description: "New due date (ISO format)" }
      },
      required: ["course_id", "quiz_id"]
    }
  },
  {
    name: "canvas_delete_quiz",
    description: "Delete a quiz from a course",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        quiz_id: { type: "number", description: "ID of the quiz to delete" }
      },
      required: ["course_id", "quiz_id"]
    }
  },
  {
    name: "canvas_list_modules",
    description: "List all modules in a course",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" }
      },
      required: ["course_id"]
    }
  },
  {
    name: "canvas_get_module",
    description: "Get details of a specific module",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "number", description: "ID of the course" },
        module_id: { type: "number", description: "ID of the module" }
      },
      required: ["course_id", "module_id"]
    }
  },
  {
    name: "canvas_list_module_items",
    description: "List all items in a module",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "string", description: "ID of the course" },
        module_id: { type: "number", description: "ID of the module" }
      },
      required: ["course_id", "module_id"]
    }
  },
  {
    name: "canvas_get_module_item",
    description: "Get details of a specific module item",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "string", description: "ID of the course" },
        module_id: { type: "number", description: "ID of the module" },
        item_id: { type: "number", description: "ID of the module item" }
      },
      required: ["course_id", "module_id", "item_id"]
    }
  },
  {
    name: "canvas_list_discussion_topics",
    description: "List all discussion topics in a course",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "string", description: "ID of the course" }
      },
      required: ["course_id"]
    }
  },
  {
    name: "canvas_get_discussion_topic",
    description: "Get details of a specific discussion topic",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "string", description: "ID of the course" },
        topic_id: { type: "number", description: "ID of the discussion topic" }
      },
      required: ["course_id", "topic_id"]
    }
  },
  {
    name: "canvas_list_announcements",
    description: "List all announcements in a course",
    inputSchema: {
      type: "object",
      properties: {
        course_id: { type: "string", description: "ID or URL of the course" }
      },
      required: ["course_id"]
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
          })),
          ...courses.map((course: CanvasCourse) => ({
            uri: `quizzes://${course.id}`,
            name: `Quizzes: ${course.name}`,
            description: `Quizzes for ${course.name}`,
            mimeType: "application/json"
          })),
          ...courses.map((course: CanvasCourse) => ({
            uri: `modules://${course.id}`,
            name: `Modules: ${course.name}`,
            description: `Modules for ${course.name}`,
            mimeType: "application/json"
          })),
          ...courses.map((course: CanvasCourse) => ({
            uri: `discussion_topics://${course.id}`,
            name: `Discussion Topics: ${course.name}`,
            description: `Discussion topics for ${course.name}`,
            mimeType: "application/json"
          })),
          ...courses.map((course: CanvasCourse) => ({
            uri: `announcements://${course.id}`,
            name: `Announcements: ${course.name}`,
            description: `Announcements for ${course.name}`,
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

          case "quizzes": {
            content = await this.client.listQuizzes(id);
            break;
          }

          case "modules": {
            content = await this.client.listModules(parseInt(id));
            break;
          }

          case "discussion_topics": {
            content = await this.client.listDiscussionTopics(parseInt(id));
            break;
          }

          case "announcements": {
            content = await this.client.listAnnouncements(id);
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

          case "canvas_submit_assignment": {
            const submitArgs = args as unknown as {
              course_id: string;
              assignment_id: number;
              user_id: number;
              submission_type: string;
              body?: string;
            };
            const { course_id, assignment_id, user_id, submission_type, body } = submitArgs;

            if (!course_id || !assignment_id || !user_id || !submission_type) {
              throw new Error("Missing required fields for assignment submission");
            }

            const submission = await this.client.submitAssignment({
              course_id,
              assignment_id,
              user_id,
              submission_type,
              body
            });

            return {
              content: [{ type: "text", text: JSON.stringify(submission, null, 2) }]
            };
          }

          case "canvas_list_quizzes": {
            const { course_id } = args as { course_id: string };
            if (!course_id) {
              throw new Error("Missing required field: course_id");
            }
            const quizzes = await this.client.listQuizzes(course_id);
            return {
              content: [{ type: "text", text: JSON.stringify(quizzes, null, 2) }]
            };
          }

          case "canvas_get_quiz": {
            const { course_id, quiz_id } = args as { course_id: string; quiz_id: number };
            if (!course_id || !quiz_id) {
              throw new Error("Missing required fields: course_id and quiz_id");
            }
            const quiz = await this.client.getQuiz(course_id, quiz_id);
            return {
              content: [{ type: "text", text: JSON.stringify(quiz, null, 2) }]
            };
          }

          case "canvas_create_quiz": {
            const { course_id, title, quiz_type, time_limit, published, description, due_at } = args as {
              course_id: number;
              title: string;
              quiz_type?: string;
              time_limit?: number;
              published?: boolean;
              description?: string;
              due_at?: string;
            };
            if (!course_id || !title) {
              throw new Error("Missing required fields: course_id and title");
            }
            const quiz = await this.client.createQuiz(course_id, { title, quiz_type, time_limit, published, description, due_at });
            return {
              content: [{ type: "text", text: JSON.stringify(quiz, null, 2) }]
            };
          }

          case "canvas_update_quiz": {
            const { course_id, quiz_id, title, quiz_type, time_limit, published, description, due_at } = args as {
              course_id: number;
              quiz_id: number;
              title?: string;
              quiz_type?: string;
              time_limit?: number;
              published?: boolean;
              description?: string;
              due_at?: string;
            };
            if (!course_id || !quiz_id) {
              throw new Error("Missing required fields: course_id and quiz_id");
            }
            const updatedQuiz = await this.client.updateQuiz(course_id, quiz_id, { title, quiz_type, time_limit, published, description, due_at });
            return {
              content: [{ type: "text", text: JSON.stringify(updatedQuiz, null, 2) }]
            };
          }

          case "canvas_delete_quiz": {
            const { course_id, quiz_id } = args as { course_id: number; quiz_id: number };
            if (!course_id || !quiz_id) {
              throw new Error("Missing required fields: course_id and quiz_id");
            }
            await this.client.deleteQuiz(course_id, quiz_id);
            return {
              content: [{ type: "text", text: `Quiz ${quiz_id} deleted successfully.` }]
            };
          }

          case "canvas_list_modules": {
            const { course_id } = args as { course_id: number };
            if (!course_id) {
              throw new Error("Missing required field: course_id");
            }
            const modules = await this.client.listModules(course_id);
            return {
              content: [{ type: "text", text: JSON.stringify(modules, null, 2) }]
            };
          }

          case "canvas_get_module": {
            const { course_id, module_id } = args as { course_id: number; module_id: number };
            if (!course_id || !module_id) {
              throw new Error("Missing required fields: course_id and module_id");
            }
            const module = await this.client.getModule(course_id, module_id);
            return {
              content: [{ type: "text", text: JSON.stringify(module, null, 2) }]
            };
          }

          case "canvas_list_module_items": {
            const { course_id, module_id } = args as { course_id: number; module_id: number };
            if (!course_id || !module_id) {
              throw new Error("Missing required fields: course_id and module_id");
            }
            const items = await this.client.listModuleItems(course_id, module_id);
            return {
              content: [{ type: "text", text: JSON.stringify(items, null, 2) }]
            };
          }

          case "canvas_get_module_item": {
            const { course_id, module_id, item_id } = args as { course_id: number; module_id: number; item_id: number };
            if (!course_id || !module_id || !item_id) {
              throw new Error("Missing required fields: course_id, module_id, and item_id");
            }
            const item = await this.client.getModuleItem(course_id, module_id, item_id);
            return {
              content: [{ type: "text", text: JSON.stringify(item, null, 2) }]
            };
          }

          case "canvas_list_discussion_topics": {
            const { course_id } = args as { course_id: number };
            if (!course_id) {
              throw new Error("Missing required field: course_id");
            }
            const topics = await this.client.listDiscussionTopics(course_id);
            return {
              content: [{ type: "text", text: JSON.stringify(topics, null, 2) }]
            };
          }

          case "canvas_get_discussion_topic": {
            const { course_id, topic_id } = args as { course_id: number; topic_id: number };
            if (!course_id || !topic_id) {
              throw new Error("Missing required fields: course_id and topic_id");
            }
            const topic = await this.client.getDiscussionTopic(course_id, topic_id);
            return {
              content: [{ type: "text", text: JSON.stringify(topic, null, 2) }]
            };
          }

          case "canvas_list_announcements": {
            const { course_id } = args as { course_id: string };
            if (!course_id) {
              throw new Error("Missing required field: course_id");
            }
            const announcements = await this.client.listAnnouncements(course_id);
            return {
              content: [{ type: "text", text: JSON.stringify(announcements, null, 2) }]
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
  // Get current file's directory in ES modules
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Get all directories from PATH
  const pathDirs = (process.env.PATH || '').split(path.delimiter);
  
  // Create array of possible .env locations
  const envPaths = [
    '.env',                          // Current directory
    'src/.env',                      // src directory
    path.join(__dirname, '.env'),    // Script directory
    path.join(process.cwd(), '.env'), // Working directory
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
