#!/usr/bin/env node
import process from "node:process";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

type CliOptions = {
  listTools: boolean;
  tool?: string;
  args?: string;
  server: string;
  node: string;
};

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    listTools: false,
    server: "dist/index.js",
    node: "node",
  };

  for (let i = 0; i < argv.length; i += 1) {
    const current = argv[i];
    const next = argv[i + 1];

    switch (current) {
      case "--list-tools":
        options.listTools = true;
        break;
      case "--tool":
        if (!next) {
          throw new Error("Missing value for --tool");
        }
        options.tool = next;
        i += 1;
        break;
      case "--args":
        if (!next) {
          throw new Error("Missing value for --args");
        }
        options.args = next;
        i += 1;
        break;
      case "--server":
        if (!next) {
          throw new Error("Missing value for --server");
        }
        options.server = next;
        i += 1;
        break;
      case "--node":
        if (!next) {
          throw new Error("Missing value for --node");
        }
        options.node = next;
        i += 1;
        break;
      default:
        throw new Error(`Unknown argument: ${current}`);
    }
  }

  return options;
}


function getStringEnv(env: NodeJS.ProcessEnv): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

function printUsage(): void {
  console.log(`Usage:
  npm run mcp:call -- --list-tools [--server path] [--node nodeCommand]
  npm run mcp:call -- --tool <name> [--args '{"key":"value"}'] [--server path] [--node nodeCommand]
`);
}

async function main(): Promise<void> {
  let options: CliOptions;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    printUsage();
    process.exitCode = 1;
    return;
  }

  if (!options.listTools && !options.tool) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const transport = new StdioClientTransport({
    command: options.node,
    args: [options.server],
    env: getStringEnv(process.env),
  });

  const client = new Client({
    name: "todoist-mcp-cli",
    version: "1.0.0",
  });

  try {
    await client.connect(transport);

    if (options.listTools) {
      const result = await client.listTools();
      console.log(JSON.stringify(result.tools, null, 2));
      return;
    }

    const parsedArgs = options.args ? JSON.parse(options.args) : {};
    const result = await client.callTool({
      name: options.tool!,
      arguments: parsedArgs,
    });

    console.log(JSON.stringify(result.content ?? result, null, 2));
  } finally {
    await transport.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
