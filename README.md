# Canvas MCP Server v2.3.0

## Security and disclosure history

This project is an independent MCP server for Canvas LMS APIs. It is not affiliated with, endorsed by, or maintained by Instructure or Canvas.

During development in June 2025, I identified what I believed to be a Broken Access Control issue in a BootcampSpot/Canvas environment involving student-accessible course data. I reported the issue through Bugcrowd / Instructure responsible-disclosure channels. The report was later closed as “Not Applicable.”

This repository does not publish exploit steps, affected tenant details, live URLs, screenshots containing student data, or proof-of-concept abuse flows. This note is included only for project history and responsible-use context.

Separately, Instructure has publicly disclosed a 2026 Canvas security incident. This repository does not claim that the 2025 report caused, enabled, or is technically connected to that incident. 

# What this is
> A comprehensive Model Context Protocol (MCP) server for Canvas LMS with complete student, instructor, and account administration functionality

## 🚀 What's New in v2.3.0

- **🌐 NEW**: Streamable HTTP transport support (`MCP_TRANSPORT=streamable-http`)
- **🖥️ Preserved**: First-class stdio transport for local MCP clients
- **🧪 Added**: Behavior tests for lifecycle, transports, and structured failure-path errors
- **🧱 Improved**: Stricter tool schemas and codemode-oriented tool descriptions
- **🔧 FIXED**: Course creation "page not found" error (missing `account_id` parameter)
- **👨‍💼 Account Management**: Complete account-level administration tools
- **📊 Reports & Analytics**: Generate and access Canvas account reports  
- **👥 User Management**: Create and manage users at the account level
- **🏢 Multi-Account Support**: Handle account hierarchies and sub-accounts
- **✅ API Compliance**: All endpoints now follow proper Canvas API patterns

## 🎯 Key Features

### 🎓 For Students
- **Course Management**: Access all courses, syllabi, and course materials
- **Assignment Workflow**: View, submit (text/URL/files), and track assignments
- **Communication**: Participate in discussions, read announcements, send messages
- **Progress Tracking**: Monitor grades, module completion, and calendar events
- **Quizzes**: Take quizzes, view results and feedback
- **File Access**: Browse and download course files and resources

### 👨‍🏫 For Instructors
- **Course Creation**: Create and manage course structure *(now with proper account support)*
- **Grading**: Grade submissions, provide feedback, manage rubrics
- **User Management**: Enroll students, manage permissions
- **Content Management**: Create assignments, quizzes, discussions

### 👨‍💼 For Account Administrators (NEW!)
- **Account Management**: Manage institutional Canvas accounts
- **User Administration**: Create and manage users across accounts
- **Course Oversight**: List and manage all courses within accounts
- **Reporting**: Generate enrollment, grade, and activity reports
- **Sub-Account Management**: Handle account hierarchies and structures

### 🛠️ Technical Excellence
- **Robust API**: Automatic retries, pagination, comprehensive error handling
- **Cloud Ready**: Docker containers, Kubernetes manifests, health checks
- **Well Tested**: Unit tests, integration tests, mocking, coverage reports
- **Type Safe**: Full TypeScript implementation with strict types
- **50+ Tools**: Comprehensive coverage of Canvas LMS functionality

## Quick Start

### Option 1: Claude Desktop Integration (Recommended MCP Setup)

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "canvas-mcp-server": {
      "command": "npx",
      "args": ["-y", "canvas-mcp-server"],
      "env": {
        "CANVAS_API_TOKEN": "your_token_here",
        "CANVAS_DOMAIN": "your_school.instructure.com"
      }
    }
  }
}
```

### Option 2: NPM Package

```bash
# Install globally
npm install -g canvas-mcp-server

# Configure
export CANVAS_API_TOKEN="your_token_here"
export CANVAS_DOMAIN="your_school.instructure.com"

# Run
canvas-mcp-server
```

### Option 3: Docker

```bash
docker run -d \
  --name canvas-mcp \
  -p 3000:3000 \
  -e CANVAS_API_TOKEN="your_token" \
  -e CANVAS_DOMAIN="school.instructure.com" \
  -e MCP_TRANSPORT="streamable-http" \
  -e MCP_HTTP_HOST="0.0.0.0" \
  -e MCP_HTTP_PORT="3000" \
  -e MCP_HTTP_PATH="/mcp" \
  ghcr.io/dmontgomery40/mcp-canvas-lms:latest
```

## Transport Modes

The server supports two explicit transport modes:

- `stdio` (default): best for Claude Desktop/Codex/Cursor local MCP wiring.
- `streamable-http`: best for local HTTP integrations and containerized workflows.

### Transport environment variables

```bash
# Required Canvas auth
CANVAS_API_TOKEN=your_token
CANVAS_DOMAIN=your_school.instructure.com

# Transport selection
MCP_TRANSPORT=stdio # or streamable-http

# Streamable HTTP settings
MCP_HTTP_HOST=127.0.0.1
MCP_HTTP_PORT=3000
MCP_HTTP_PATH=/mcp
MCP_HTTP_STATEFUL=true
MCP_HTTP_JSON_RESPONSE=true
MCP_HTTP_ALLOWED_ORIGINS=
```

## 💼 Account Admin Workflow Examples

### Create a New Course (FIXED!)
```
"Create a new course called 'Advanced Biology' in account 123"
```
**Now properly creates courses with required account_id parameter**

### Manage Users
```
"Create a new student user John Doe with email john.doe@school.edu in our main account"
```
**Creates user accounts with proper pseudonym and enrollment setup**

### Generate Reports
```
"Generate an enrollment report for account 456 for the current term"
```
**Initiates Canvas reporting system for institutional analytics**

### List Account Courses
```
"Show me all published Computer Science courses in our Engineering account"
```
**Advanced filtering and searching across account course catalogs**

## 🎓 Student Workflow Examples

### Check Today's Assignments
```
"What assignments do I have due this week?"
```
**Lists upcoming assignments with due dates, points, and submission status**

### Submit an Assignment
```
"Help me submit my essay for English 101 Assignment 3"
```
**Guides through text submission with formatting options**

### Check Grades
```
"What's my current grade in Biology?"
```
**Shows current scores, grades, and assignment feedback**

### Participate in Discussions
```
"Show me the latest discussion posts in my Philosophy class"
```
**Displays recent discussion topics and enables posting responses**

### Track Progress
```
"What modules do I need to complete in Math 200?"
```
**Shows module completion status and next items to complete**

## Getting Canvas API Token

1. **Log into Canvas** → Account → Settings
2. **Scroll to "Approved Integrations"**
3. **Click "+ New Access Token"**
4. **Enter description**: "Claude MCP Integration"
5. **Copy the generated token** Save securely!

⚠️ **Account Admin Note**: For account-level operations, ensure your API token has administrative privileges.

## Production Deployment

### Docker Compose
```bash
git clone https://github.com/DMontgomery40/mcp-canvas-lms.git
cd mcp-canvas-lms
cp .env.example .env
# Edit .env with your Canvas credentials
docker-compose up -d
```

### Kubernetes
```bash
kubectl create secret generic canvas-mcp-secrets \
  --from-literal=CANVAS_API_TOKEN="your_token" \
  --from-literal=CANVAS_DOMAIN="school.instructure.com"

kubectl apply -f k8s/
```

### Health Monitoring
```bash
# Check application health
curl http://localhost:3000/health

# Or use the built-in health check
npm run health-check
```

## Development

```bash
# Setup development environment
git clone https://github.com/DMontgomery40/mcp-canvas-lms.git
cd mcp-canvas-lms
npm install

# Start development with hot reload
npm run dev:watch

# Run tests
npm run test
npm run coverage

# Code quality
npm run lint
npm run type-check
```

## 📚 Available Tools (50+ Tools)

<details>
<summary><strong>🎓 Core Student Tools (Click to expand)</strong></summary>

- `canvas_health_check` - Check API connectivity
- `canvas_list_courses` - List all your courses
- `canvas_get_course` - Get detailed course info
- `canvas_list_assignments` - List course assignments
- `canvas_get_assignment` - Get assignment details
- `canvas_submit_assignment` - Submit assignment work
- `canvas_get_submission` - Check submission status
- `canvas_list_modules` - List course modules
- `canvas_get_module` - Get module details
- `canvas_list_module_items` - List items in a module
- `canvas_mark_module_item_complete` - Mark items complete
- `canvas_list_discussion_topics` - List discussion topics
- `canvas_get_discussion_topic` - Get discussion details
- `canvas_post_to_discussion` - Post to discussions
- `canvas_list_announcements` - List course announcements
- `canvas_get_user_grades` - Get your grades
- `canvas_get_course_grades` - Get course-specific grades
- `canvas_get_dashboard` - Get dashboard info
- `canvas_get_dashboard_cards` - Get course cards
- `canvas_get_upcoming_assignments` - Get due dates
- `canvas_list_calendar_events` - List calendar events
- `canvas_list_files` - List course files
- `canvas_get_file` - Get file details
- `canvas_list_folders` - List course folders
- `canvas_list_pages` - List course pages
- `canvas_get_page` - Get page content
- `canvas_list_conversations` - List messages
- `canvas_get_conversation` - Get conversation details
- `canvas_create_conversation` - Send messages
- `canvas_list_notifications` - List notifications
- `canvas_get_syllabus` - Get course syllabus
- `canvas_get_user_profile` - Get user profile
- `canvas_update_user_profile` - Update profile

</details>

<details>
<summary><strong>👨‍🏫 Instructor Tools (Click to expand)</strong></summary>

- `canvas_create_course` - Create new courses *(FIXED: now requires account_id)*
- `canvas_update_course` - Update course settings
- `canvas_create_assignment` - Create assignments
- `canvas_update_assignment` - Update assignments
- `canvas_list_assignment_groups` - List assignment groups
- `canvas_submit_grade` - Grade submissions
- `canvas_enroll_user` - Enroll students
- `canvas_list_quizzes` - List course quizzes
- `canvas_get_quiz` - Get quiz details
- `canvas_create_quiz` - Create quizzes
- `canvas_start_quiz_attempt` - Start quiz attempts
- `canvas_list_rubrics` - List course rubrics
- `canvas_get_rubric` - Get rubric details

</details>

<details>
<summary><strong>👨‍💼 Account Management Tools (NEW!)</strong></summary>

- `canvas_get_account` - Get account details
- `canvas_list_account_courses` - List courses in an account
- `canvas_list_account_users` - List users in an account  
- `canvas_create_user` - Create new users in accounts
- `canvas_list_sub_accounts` - List sub-accounts
- `canvas_get_account_reports` - List available reports
- `canvas_create_account_report` - Generate account reports

</details>

## 🔧 Breaking Changes in v2.2.0

### Course Creation Fix
**BEFORE (Broken):**
```javascript
{
  "tool": "canvas_create_course",
  "arguments": {
    "name": "My Course"  // ❌ Missing account_id - caused "page not found"
  }
}
```

**AFTER (Fixed):**
```javascript
{
  "tool": "canvas_create_course", 
  "arguments": {
    "account_id": 123,              // ✅ Required account_id
    "name": "My Course",
    "course_code": "CS-101"
  }
}
```

## 🌟 Example Claude Conversations

**Student**: *"I need to check my upcoming assignments and submit my English essay"*

**Claude**: *I'll help you check your upcoming assignments and then assist with submitting your English essay. Let me start by getting your upcoming assignments...*

[Claude uses `canvas_get_upcoming_assignments` then helps with `canvas_submit_assignment`]

---

**Instructor**: *"Create a new Advanced Physics course in the Science department and enroll my teaching assistant"*

**Claude**: *I'll help you create the Advanced Physics course in your Science department account and then enroll your TA...*

[Claude uses `canvas_create_course` with proper account_id, then `canvas_enroll_user`]

---

**Administrator**: *"Generate an enrollment report for all Computer Science courses this semester"*

**Claude**: *I'll generate a comprehensive enrollment report for your CS courses...*

[Claude uses `canvas_list_account_courses` with filters, then `canvas_create_account_report`]

## 🔍 Troubleshooting

**Common Issues:**
- ❌ **401 Unauthorized**: Check your API token and permissions
- ❌ **404 Not Found**: Verify course/assignment IDs and access rights  
- ❌ **"Page not found" on course creation**: Update to v2.2.0 for account_id fix
- ❌ **Timeout**: Increase `CANVAS_TIMEOUT` or check network connectivity

**Debug Mode:**
```bash
export LOG_LEVEL=debug
npm start
```

**Health Check:**
```bash
npm run health-check
```

## 🤝 Contributing

We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Setup
```bash
git clone https://github.com/DMontgomery40/mcp-canvas-lms.git
cd mcp-canvas-lms
npm install
npm run dev:watch
# Make changes, add tests, submit PR
```

## 📈 Roadmap

- **v2.3**: Enhanced reporting, bulk operations, advanced search
- **v2.4**: Mobile support, offline capability, analytics dashboard  
- **v3.0**: Multi-tenant, GraphQL API, AI-powered insights

## 🙋 Support & Community

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/DMontgomery40/mcp-canvas-lms/issues)
- 💬 **Questions**: [GitHub Discussions](https://github.com/DMontgomery40/mcp-canvas-lms/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/DMontgomery40/mcp-canvas-lms/wiki)

## Appendix: MCP in Practice (Code Execution, Tool Scale, and Safety)

Last updated: 2026-03-23

### Why This Appendix Exists
MCP is still one of the most useful interoperability layers for agentic tooling. The tradeoff is that large MCP servers can expose dozens of tools, and naive tool-calling can flood context windows with tool schemas, call traces, and low-signal chatter.

In practice, larger tool surfaces only help when orchestration stays token-efficient and execution behavior is constrained.

### The Shift to Code Execution / Code Mode
Recent production workflows move orchestration out of conversational turns and into executable loops. This keeps context overhead lower, improves determinism, and makes runs auditable.

Core reading:
- [Cloudflare: Code Mode](https://blog.cloudflare.com/code-mode/)
- [Cloudflare: Code Execution with MCP](https://blog.cloudflare.com/code-execution-with-mcp/)
- [Anthropic: Code Execution with MCP](https://www.anthropic.com/engineering/code-execution-with-mcp)

### Recommended Setup for Power Users
For lower-noise, repeatable MCP usage, start with codemode-oriented routing:
- [codemode-mcp (jx-codes)](https://github.com/jx-codes/codemode-mcp)
- [UTCP](https://www.utcp.io)

Even with strong setup, model behavior can be hit-or-miss across providers and versions. Keep retries and deterministic fallbacks.

### Peter Steinberger Workflow Pattern
A high-leverage pattern is turning broad MCP tool surfaces into narrower CLI/task interfaces:
- [MCPorter](https://github.com/steipete/mcporter)
- [OpenClaw](https://github.com/steipete/openclaw)

### What Works Best With Which MCP Clients
- Claude Code / Codex / Cursor agent workflows: usually strong for direct MCP + code-execution loops.
- Thin hosted chat clients: often safer with wrapped CLIs/gateways instead of full raw tool exposure.
- High-tool-count servers: usually better when split into narrow task gateways.

This ecosystem changes quickly. If you are reading this now, parts of this section may already be out of date.

### Prompt Injection: Risks, Consequences, and Mitigations
Prompt injection remains an open problem for tool-using agents. It is manageable, but not solved.

Primary risks:
- Hidden instructions in retrieved content or tool output.
- Secret/token exfiltration through unintended calls.
- Unauthorized state changes in systems or data.

Mitigation baseline:
- Least-privilege credentials and scoped tokens.
- Destination/action allowlists and strict schema validation.
- Human confirmation for destructive operations.
- Sandboxed execution and resource limits.
- Structured logging and replayable execution traces.

Treat every tool output as untrusted input unless explicitly verified.

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

<div align="center">
  <strong>Canvas MCP Server v2.2.0</strong><br>
  <em>Empowering students, educators, and administrators with seamless Canvas integration</em><br><br>
  
  ⭐ **Star this repo if it helps you!** ⭐
</div>
