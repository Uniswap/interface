/**
 * AI Provider Contract
 *
 * Defines the interface for AI text generation providers.
 * Allows swapping implementations (e.g., Claude SDK, Vercel AI SDK, etc.)
 */

export interface StreamTextInput {
  prompt: string
  systemPrompt?: string
  model: string
  temperature?: number
  maxTokens?: number
}

export interface StreamChunk {
  text: string
  isComplete: boolean
  reasoning?: string
}

export interface GenerateTextInput {
  prompt: string
  systemPrompt?: string
  model: string
  temperature?: number
  maxTokens?: number
}

/**
 * AI Provider interface contract
 *
 * Provides methods for streaming and non-streaming text generation.
 * Implementations should map to their respective SDKs while maintaining this interface.
 */
export interface AIProvider {
  /**
   * Stream text generation with incremental chunks
   * @param input - Configuration for text generation
   * @returns Async generator yielding text chunks
   */
  streamText(input: StreamTextInput): AsyncGenerator<StreamChunk>

  /**
   * Generate complete text without streaming
   * @param input - Configuration for text generation
   * @returns Complete generated text
   */
  generateText(input: GenerateTextInput): Promise<string>
}
