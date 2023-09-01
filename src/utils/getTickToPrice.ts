import { Price, Token } from '@kinetix/sdk-core'
import { tickToPrice } from '@kinetix/v3-sdk'

export function getTickToPrice(baseToken?: Token, quoteToken?: Token, tick?: number): Price<Token, Token> | undefined {
  if (!baseToken || !quoteToken || typeof tick !== 'number') {
    return undefined
  }
  // @ts-ignore
  return tickToPrice(baseToken, quoteToken, tick)
}
