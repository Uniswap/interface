import { AssetType } from 'uniswap/src/entities/assets'
import { getShouldResetExactAmountToken } from 'uniswap/src/features/transactions/swap/form/utils'
import type { SwapFormState } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/types'
import { CurrencyField } from 'uniswap/src/types/currency'

type SwapContextParam = Parameters<typeof getShouldResetExactAmountToken>[0]

const DEFAULT_INPUT_ADDRESS = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'
const DEFAULT_OUTPUT_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

const baseSwapCtx: SwapContextParam = {
  exactCurrencyField: CurrencyField.INPUT,
  input: { address: DEFAULT_INPUT_ADDRESS, chainId: 1, type: AssetType.Currency },
  output: { address: DEFAULT_OUTPUT_ADDRESS, chainId: 1, type: AssetType.Currency },
}

const createNewState = (inputAddress?: string, outputAddress?: string): Partial<SwapFormState> => ({
  input: inputAddress ? { address: inputAddress, chainId: 1, type: AssetType.Currency } : undefined,
  output: outputAddress ? { address: outputAddress, chainId: 1, type: AssetType.Currency } : undefined,
})

describe('getShouldResetExactAmountToken', () => {
  it('should return true when editing input and input address changes', () => {
    const newState = createNewState('0xNewInputAddress')

    expect(getShouldResetExactAmountToken(baseSwapCtx, newState)).toBe(true)
  })

  it('should return true when editing output and output address changes', () => {
    const swapCtx = { ...baseSwapCtx, exactCurrencyField: CurrencyField.OUTPUT }
    const newState = createNewState(undefined, '0xNewOutputAddress')

    expect(getShouldResetExactAmountToken(swapCtx, newState)).toBe(true)
  })

  it('should return false when input address does not change', () => {
    const newState = createNewState(DEFAULT_INPUT_ADDRESS)

    expect(getShouldResetExactAmountToken(baseSwapCtx, newState)).toBe(false)
  })

  it('should return false when output address does not change', () => {
    const swapCtx = { ...baseSwapCtx, exactCurrencyField: CurrencyField.OUTPUT }
    const newState = createNewState(undefined, DEFAULT_OUTPUT_ADDRESS)

    expect(getShouldResetExactAmountToken(swapCtx, newState)).toBe(false)
  })

  it('should return false when neither input nor output address changes', () => {
    const newState = createNewState()

    expect(getShouldResetExactAmountToken(baseSwapCtx, newState)).toBe(false)
  })

  it('should return true when input address changes to a new valid address', () => {
    const newState = createNewState('0xNewValidInputAddress')

    expect(getShouldResetExactAmountToken(baseSwapCtx, newState)).toBe(true)
  })

  it('should return true when output address changes to a new valid address', () => {
    const swapCtx = { ...baseSwapCtx, exactCurrencyField: CurrencyField.OUTPUT }
    const newState = createNewState(undefined, '0xNewValidOutputAddress')

    expect(getShouldResetExactAmountToken(swapCtx, newState)).toBe(true)
  })

  it('should return false when input and output addresses remain unchanged', () => {
    const newState = createNewState(DEFAULT_INPUT_ADDRESS, DEFAULT_OUTPUT_ADDRESS)

    expect(getShouldResetExactAmountToken(baseSwapCtx, newState)).toBe(false)
  })
})
