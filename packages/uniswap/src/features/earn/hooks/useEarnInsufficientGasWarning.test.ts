import { CurrencyAmount } from '@uniswap/sdk-core'
import { type ChainedQuoteResponse, TradingApi } from '@universe/api'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  getEarnQuoteGasFeeChecks,
  getInsufficientGasWarning,
} from 'uniswap/src/features/earn/hooks/useEarnInsufficientGasWarning'

const t = ((key: string): string => key) as Parameters<typeof getInsufficientGasWarning>[0]['t']

function quoteWithGas(quote: Partial<ChainedQuoteResponse['quote']>): ChainedQuoteResponse['quote'] {
  return quote as ChainedQuoteResponse['quote']
}

describe(getEarnQuoteGasFeeChecks, () => {
  it('uses the aggregate quote gas fee for same-chain earn routes', () => {
    expect(
      getEarnQuoteGasFeeChecks(
        quoteWithGas({
          gasFee: '100',
          tokenInChainId: TradingApi.ChainId._1,
          tokenOutChainId: TradingApi.ChainId._1,
        }),
      ),
    ).toEqual([{ chainId: UniverseChainId.Mainnet, gasFee: '100' }])
  })

  it('groups cross-chain per-step gas fees by source chain', () => {
    expect(
      getEarnQuoteGasFeeChecks(
        quoteWithGas({
          gasEstimates: [
            { gasFee: '10' },
            { gasFee: '20' },
            { gasFee: '5' },
          ] as ChainedQuoteResponse['quote']['gasEstimates'],
          steps: [
            { tokenInChainId: TradingApi.ChainId._8453 },
            { tokenInChainId: TradingApi.ChainId._1 },
            { tokenInChainId: TradingApi.ChainId._8453 },
          ] as ChainedQuoteResponse['quote']['steps'],
          tokenInChainId: TradingApi.ChainId._8453,
          tokenOutChainId: TradingApi.ChainId._1,
        }),
      ),
    ).toEqual([
      { chainId: UniverseChainId.Base, gasFee: '15' },
      { chainId: UniverseChainId.Mainnet, gasFee: '20' },
    ])
  })
})

describe(getInsufficientGasWarning, () => {
  it('does not warn without a gas estimate', () => {
    const gasToken = nativeOnChain(UniverseChainId.Mainnet)

    expect(
      getInsufficientGasWarning({
        chainId: UniverseChainId.Mainnet,
        gasBalance: CurrencyAmount.fromRawAmount(gasToken, '1'),
        gasFee: undefined,
        gasToken,
        inputAmount: undefined,
        t,
      }),
    ).toBeUndefined()

    expect(
      getInsufficientGasWarning({
        chainId: UniverseChainId.Mainnet,
        gasBalance: CurrencyAmount.fromRawAmount(gasToken, '0'),
        gasFee: undefined,
        gasToken,
        inputAmount: undefined,
        t,
      }),
    ).toBeUndefined()
  })

  it('warns when the gas estimate exceeds the gas balance', () => {
    const gasToken = nativeOnChain(UniverseChainId.Mainnet)

    expect(
      getInsufficientGasWarning({
        chainId: UniverseChainId.Mainnet,
        gasBalance: CurrencyAmount.fromRawAmount(gasToken, '1'),
        gasFee: '2',
        gasToken,
        inputAmount: undefined,
        t,
      })?.type,
    ).toBe(WarningLabel.InsufficientGasFunds)
  })
})
