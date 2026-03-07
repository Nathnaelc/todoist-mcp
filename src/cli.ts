import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

function getArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag)
  if (index === -1) return undefined
  return process.argv[index + 1]
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag)
}

function printUsage() {
  console.error(`Usage:
  npm run mcp:call -- --list-tools
  npm run mcp:call -- --tool get_tasks --args '{"filter":"today"}'

Optional flags:
  --server <path>   Path to MCP server entrypoint (default: dist/index.js)
  --node <path>     Node executable to launch server (default: node)
`)
}

async function main() {
  if (hasFlag('--help') || hasFlag('-h')) {
    printUsage()
    process.exit(0)
  }

  const serverPath = getArg('--server') ?? 'dist/index.js'
  const nodePath = getArg('--node') ?? 'node'
  const toolName = getArg('--tool')
  const shouldListTools = hasFlag('--list-tools')

  if (!shouldListTools && !toolName) {
    printUsage()
    process.exit(1)
  }

  let parsedArgs: Record<string, unknown> = {}
  const rawArgs = getArg('--args')
  if (rawArgs) {
    try {
      parsedArgs = JSON.parse(rawArgs)
    } catch (error) {
      console.error('Invalid JSON passed to --args')
      console.error(error)
      process.exit(1)
    }
  }

  const env = Object.fromEntries(
    Object.entries(process.env).filter(([, value]) => value !== undefined) as Array<[string, string]>
  )

  const client = new Client({ name: 'todoist-mcp-cli', version: '1.0.0' })
  const transport = new StdioClientTransport({
    command: nodePath,
    args: [serverPath],
    env
  })

  try {
    await client.connect(transport)

    if (shouldListTools) {
      const tools = await client.listTools()
      console.log(JSON.stringify(tools.tools.map((tool) => tool.name), null, 2))
      return
    }

    const result = await client.callTool({
      name: toolName!,
      arguments: parsedArgs
    })

    console.log(JSON.stringify(result, null, 2))
  } finally {
    await transport.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
