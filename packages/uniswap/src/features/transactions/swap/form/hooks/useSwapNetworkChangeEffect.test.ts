import { act, renderHook } from '@testing-library/react-native'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSwapNetworkChangeEffect } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/hooks/useSwapNetworkChangeEffect'

jest.mock('uniswap/src/contexts/UniswapContext', () => ({
  useUniswapContext: jest.fn(),
}))

const onSwapChainsChangedMock = jest.fn()

;(useUniswapContext as jest.Mock).mockReturnValue({
  onSwapChainsChanged: onSwapChainsChangedMock,
})

describe('useSwapNetworkChangeEffect', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not call onSwapChainsChanged if input and output chain ids are the same', () => {
    const { rerender } = renderHook(
      ({ inputChainId, outputChainId }: { inputChainId?: UniverseChainId; outputChainId?: UniverseChainId }) =>
        useSwapNetworkChangeEffect({ inputChainId, outputChainId }),
      {
        initialProps: {
          inputChainId: UniverseChainId.Mainnet,
          outputChainId: UniverseChainId.Mainnet,
        },
      },
    )

    act(() => {
      rerender({ inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Mainnet })
    })

    expect(onSwapChainsChangedMock).not.toHaveBeenCalled()
  })
  it('calls onSwapChainsChanged when input and output chain ids change', () => {
    const { rerender } = renderHook(
      ({ inputChainId, outputChainId }: { inputChainId?: UniverseChainId; outputChainId?: UniverseChainId }) =>
        useSwapNetworkChangeEffect({ inputChainId, outputChainId }),
      {
        initialProps: {
          inputChainId: UniverseChainId.Mainnet,
          outputChainId: UniverseChainId.Optimism,
        },
      },
    )

    act(() => {
      rerender({ inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Base })
    })

    expect(onSwapChainsChangedMock).toHaveBeenCalledWith({
      chainId: UniverseChainId.Mainnet,
      outputChainId: UniverseChainId.Base,
    })
  })
  it('calls onSwapChainsChanged when input or output chain id changes', () => {
    const { rerender } = renderHook(
      ({ inputChainId, outputChainId }: { inputChainId?: UniverseChainId; outputChainId?: UniverseChainId }) =>
        useSwapNetworkChangeEffect({ inputChainId, outputChainId }),
      {
        initialProps: {
          inputChainId: UniverseChainId.Mainnet,
          outputChainId: UniverseChainId.Mainnet,
        } as { inputChainId?: UniverseChainId; outputChainId?: UniverseChainId },
      },
    )

    act(() => {
      rerender({ inputChainId: UniverseChainId.Optimism, outputChainId: undefined })
    })

    expect(onSwapChainsChangedMock).toHaveBeenCalledWith({
      chainId: UniverseChainId.Optimism,
      prevChainId: UniverseChainId.Mainnet,
    })

    act(() => {
      rerender({ inputChainId: undefined, outputChainId: UniverseChainId.Base })
    })

    expect(onSwapChainsChangedMock).toHaveBeenCalledWith({
      chainId: UniverseChainId.Base,
      prevChainId: UniverseChainId.Optimism,
    })
  })
})
