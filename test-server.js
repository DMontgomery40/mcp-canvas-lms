#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  {
    name: "canvas-test-server",
    version: "0.1.0"
  },
  {
    capabilities: {
      resources: {},
      tools: {}
    }
  }
);

server.setRequestHandler("resources/list", async () => ({
  resources: [{
    uri: "test://course",
    name: "Test Course",
    description: "A test course resource",
    mimeType: "application/json"
  }]
}));

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Canvas test server running...");