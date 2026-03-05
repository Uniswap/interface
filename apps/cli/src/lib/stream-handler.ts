/** biome-ignore-all lint/suspicious/noConsole: cli tool */
import type { StreamChunk } from '@universe/cli/src/lib/ai-provider'

/**
 * Stream Handler for CLI Output
 *
 * Separates the concern of handling streaming output to console.
 * Accumulates full response while streaming to stdout for user feedback.
 */

/**
 * Writes stream chunks to console and accumulates full response
 * @param stream - Async generator of stream chunks
 * @returns Complete accumulated text
 */
export async function writeStreamToConsole(stream: AsyncGenerator<StreamChunk>): Promise<string> {
  let fullText = ''

  for await (const chunk of stream) {
    if (chunk.text) {
      fullText += chunk.text
      // Write to stdout for real-time feedback
      process.stdout.write(chunk.text)
    }

    if (chunk.isComplete) {
      // New line after streaming completes
      // eslint-disable-next-line no-console
      console.log()
      break
    }
  }

  return fullText
}
