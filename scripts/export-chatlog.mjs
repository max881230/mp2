import { readFile, mkdir, writeFile } from 'node:fs/promises'

const sourcePath = process.argv[2]
if (!sourcePath)
  throw new Error(
    'Usage: npm run export:chatlog -- /absolute/path/to/this-conversation.jsonl',
  )

const records = (await readFile(sourcePath, 'utf8'))
  .trim()
  .split('\n')
  .map((line) => JSON.parse(line))
// Export the visible conversation and tool/code records, never private reasoning,
// system/developer instructions, session configuration, or unrelated conversations.
const visibleTypes = new Set([
  'custom_tool_call',
  'custom_tool_call_output',
  'function_call',
  'function_call_output',
])
const entries = records
  .filter((record) => {
    if (record.type !== 'response_item') return false
    const payload = record.payload
    return (
      (payload.type === 'message' &&
        ['user', 'assistant'].includes(payload.role)) ||
      visibleTypes.has(payload.type)
    )
  })
  .map((record) => ({ timestamp: record.timestamp, ...record.payload }))

const exportedAt = new Date().toISOString()
const messages = entries.filter((entry) => entry.type === 'message')
const text = messages
  .map((message) => {
    const body = message.content
      .filter((part) =>
        ['input_text', 'output_text', 'text'].includes(part.type),
      )
      .map((part) => part.text)
      .join('\n')
    return `## ${message.role === 'user' ? 'User' : 'Codex'} — ${message.timestamp}\n\n${body}`
  })
  .join('\n\n')

await mkdir(new URL('../chatlogs/', import.meta.url), { recursive: true })
await writeFile(
  new URL('../chatlogs/mp2-conversation.json', import.meta.url),
  JSON.stringify(
    {
      exportedAt,
      note: 'Visible messages and tool records through export time. Private reasoning and system/developer instructions are excluded. Refresh this export after any further conversation.',
      entries,
    },
    null,
    2,
  ) + '\n',
)
await writeFile(
  new URL('../chatlogs/mp2-conversation.md', import.meta.url),
  `# MP2 development conversation\n\nExported at ${exportedAt}. This readable transcript contains visible user and assistant messages through export time. The companion JSON also includes tool calls, generated code, and tool results. Refresh after further conversation; messages sent after this export are not yet included.\n\n${text}\n`,
)
console.log(
  `Exported ${messages.length} messages and ${entries.length - messages.length} tool records.`,
)
