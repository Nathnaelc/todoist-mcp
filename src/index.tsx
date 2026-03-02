import { config } from 'dotenv'
config({ quiet: true })

async function main() {
  const { server } = await import('./server.js')
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js')
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('Todoist MCP server running on stdio')
}

main().catch(console.error)
