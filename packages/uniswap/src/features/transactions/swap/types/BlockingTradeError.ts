import { SwapBlockedCategory } from 'uniswap/src/features/telemetry/constants/features'

/** An error that exists when a trade can be displayed but not executed. */
export class BlockingTradeError extends Error {
  name = 'BlockingTradeError'
  category?: SwapBlockedCategory
  code?: number

  constructor({ category, code, message }: { category?: SwapBlockedCategory; code?: number; message?: string }) {
    super(message)
    this.category = category
    this.code = code
  }
}
