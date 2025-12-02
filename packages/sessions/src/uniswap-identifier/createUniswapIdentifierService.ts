import type { UniswapIdentifierService } from '@universe/sessions/src/uniswap-identifier/types'

function createUniswapIdentifierService(ctx: {
  getUniswapIdentifier: () => Promise<string | null>
  setUniswapIdentifier: (identifier: string) => Promise<void>
  removeUniswapIdentifier: () => Promise<void>
}): UniswapIdentifierService {
  const getUniswapIdentifier = ctx.getUniswapIdentifier
  const setUniswapIdentifier = ctx.setUniswapIdentifier
  const removeUniswapIdentifier = ctx.removeUniswapIdentifier

  return {
    getUniswapIdentifier,
    setUniswapIdentifier,
    removeUniswapIdentifier,
  }
}

export { createUniswapIdentifierService }
