import { AnthropicProviderOptions, anthropic } from '@ai-sdk/anthropic'
import type { AIProvider, GenerateTextInput, StreamChunk, StreamTextInput } from '@universe/cli/src/lib/ai-provider'
import { generateText, streamText } from 'ai'

/**
 * Vercel AI SDK implementation of AIProvider
 *
 * Maps Vercel AI SDK responses to our contract interface.
 */
export class VercelAIProvider implements AIProvider {
  constructor(private apiKey?: string) {
    // API key can be provided via constructor or ANTHROPIC_API_KEY env var
    // If provided, set it as environment variable for Vercel AI SDK to use
    if (apiKey) {
      process.env.ANTHROPIC_API_KEY = apiKey
    }
  }

  private processFullStreamChunk(
    chunk: unknown,
    accumulators: { fullText: { value: string }; fullReasoning: { value: string } },
  ): StreamChunk | null {
    const chunkObj = typeof chunk === 'object' && chunk !== null && 'type' in chunk ? chunk : null

    if (!chunkObj) {
      // Fallback: treat as text chunk
      const textChunk = String(chunk)
      accumulators.fullText.value += textChunk
      return {
        text: textChunk,
        isComplete: false,
      }
    }

    const chunkType = chunkObj.type as string

    // Reasoning delta chunks (per Vercel AI SDK docs)
    if (chunkType === 'reasoning-delta') {
      const reasoningContent = String((chunkObj as { text?: string }).text || '')
      if (reasoningContent) {
        accumulators.fullReasoning.value += reasoningContent
        return {
          text: '',
          reasoning: reasoningContent,
          isComplete: false,
        }
      }
      return null
    }

    // Text delta chunks (per Vercel AI SDK docs)
    if (chunkType === 'text-delta') {
      const textContent = String((chunkObj as { text?: string }).text || '')
      if (textContent) {
        accumulators.fullText.value += textContent
        return {
          text: textContent,
          reasoning: undefined,
          isComplete: false,
        }
      }
    }

    return null
  }

  async *streamText(input: StreamTextInput): AsyncGenerator<StreamChunk> {
    const model = anthropic(input.model)

    const result = streamText({
      model,
      prompt: input.prompt,
      system: input.systemPrompt,
      temperature: input.temperature,
      ...(input.maxTokens && { maxTokens: input.maxTokens }),
      providerOptions: {
        anthropic: {
          thinking: { type: 'enabled', budgetTokens: 63999 },
          sendReasoning: true,
        } satisfies AnthropicProviderOptions,
      },
    })

    const accumulators = {
      fullText: { value: '' },
      fullReasoning: { value: '' },
    }

    // Check if fullStream is available (contains reasoning chunks when sendReasoning is true)
    // Process fullStream if available to access reasoning, otherwise use textStream
    const textStream = result.textStream
    const fullStream = 'fullStream' in result ? (result as { fullStream?: AsyncIterable<unknown> }).fullStream : null

    if (fullStream) {
      for await (const chunk of fullStream) {
        const processedChunk = this.processFullStreamChunk(chunk, accumulators)
        if (processedChunk) {
          yield processedChunk
        }
      }
    } else {
      // Fallback: process text stream normally
      for await (const chunk of textStream) {
        const textChunk = String(chunk)
        accumulators.fullText.value += textChunk
        yield {
          text: textChunk,
          isComplete: false,
        }
      }
    }

    // Yield final complete chunk (signal only, no duplicate content)
    // The orchestrator already accumulated all delta chunks during streaming,
    // so we only need to signal completion without re-sending the entire text
    yield {
      text: '',
      reasoning: undefined,
      isComplete: true,
    }
  }

  async generateText(input: GenerateTextInput): Promise<string> {
    const model = anthropic(input.model)

    const result = await generateText({
      model,
      prompt: input.prompt,
      system: input.systemPrompt,
      temperature: input.temperature,
      ...(input.maxTokens && { maxTokens: input.maxTokens }),
    })

    return result.text
  }
}

/**
 * Factory function to create a VercelAIProvider instance
 */
export function createVercelAIProvider(apiKey?: string): VercelAIProvider {
  return new VercelAIProvider(apiKey || process.env.ANTHROPIC_API_KEY)
}
