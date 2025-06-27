# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.2.2] - 2025-06-27

### Fixed
- **Critical MCP JSON Communication Fix**: Fixed console.log statements polluting stdout
  - Changed all debug logging from `console.log` to `console.error` in `src/client.ts`
  - Fixed tool execution logging in `src/index.ts` to use stderr
  - Resolved "Unexpected token 'C', '[Canvas API'... is not valid JSON" errors
  - MCP protocol now receives clean JSON communication over stdio
  - Eliminated the constant stream of JSON parsing errors (10 errors/second)

### Technical Details
- Fixed 4 console.log statements that were writing to stdout instead of stderr
- MCP requires pure JSON communication over stdio - any other output breaks parsing
- Debug logs now properly go to stderr (visible in logs but don't interfere with protocol)
- No functional changes - purely a communication protocol fix

### Impact
- **Complete elimination** of the JSON parsing error spam in Claude Desktop
- Canvas MCP server now works properly without communication errors
- Better debugging experience with clean error logs
- No breaking changes - fully backward compatible

## [2.2.1] - 2025-06-27

### Fixed
- **Critical JSON Parsing Error Fix**: Resolved "Unexpected token 'C', '!Canvas API...' is not valid JSON" error
  - Enhanced error response handling to properly process non-JSON responses from Canvas API
  - Added content-type checking to prevent JSON operations on HTML/text error responses
  - Improved error message formatting and truncation for long responses
  - Added graceful fallback for any JSON parsing failures
  - Enhanced logging for better debugging of Canvas API responses

### Technical Details
- Updated `src/client.ts` response interceptor with robust error handling
- Added type checking for Canvas API error responses (string vs object)
- Implemented proper handling of HTML error pages and plain text responses
- Added network error handling for requests with no response
- Improved debug logging showing status codes, content-types, and data types

### Impact
- Eliminates the "benign but drives people insane" JSON parsing errors
- Better error messages for debugging Canvas API issues
- No breaking changes - fully backward compatible
- Improved overall stability and error reporting

## [2.2.0] - Previous Release

### Added
- Comprehensive Canvas LMS MCP server implementation
- Full student functionality with assignments, courses, and submissions
- Account management capabilities
- Dashboard and calendar integration
- Discussion topics and announcements support
- File management and page access
- Grading and rubric support
- User profile management
- Extensive error handling and retry logic
- Comprehensive type definitions
