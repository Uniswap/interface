import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useChainIdsChangeEffect } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/hooks/useChainIdsChangeEffect'
import { act, renderHook } from 'uniswap/src/test/test-utils'

describe('useChainIdsChangeEffect', () => {
  describe.each([
    { skip: true, name: 'with skipInitialCallback=true (default)' },
    { skip: false, name: 'with skipInitialCallback=false' },
  ])('$name', ({ skip }) => {
    it(`should ${skip ? 'not ' : ''}trigger callback on first render`, () => {
      const callback = jest.fn()

      renderHook(() =>
        useChainIdsChangeEffect({
          inputChainId: UniverseChainId.Mainnet,
          outputChainId: UniverseChainId.Optimism,
          onChainIdsChanged: callback,
          skipInitialCallback: skip,
        }),
      )

      if (skip) {
        expect(callback).not.toHaveBeenCalled()
      } else {
        expect(callback).toHaveBeenCalledWith({
          currentChains: {
            inputChainId: UniverseChainId.Mainnet,
            outputChainId: UniverseChainId.Optimism,
          },
          prevChains: {
            inputChainId: undefined,
            outputChainId: undefined,
          },
          hasInputChanged: true,
          hasOutputChanged: true,
        })
      }
    })
  })

  test.each([
    {
      scenario: 'input chain changes only',
      chainStates: [
        { inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Optimism },
        { inputChainId: UniverseChainId.Base, outputChainId: UniverseChainId.Optimism },
      ],
      expectedChanges: { input: true, output: false },
    },
    {
      scenario: 'output chain changes only',
      chainStates: [
        { inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Optimism },
        { inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Base },
      ],
      expectedChanges: { input: false, output: true },
    },
    {
      scenario: 'both chains change',
      chainStates: [
        { inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Optimism },
        { inputChainId: UniverseChainId.Base, outputChainId: UniverseChainId.ArbitrumOne },
      ],
      expectedChanges: { input: true, output: true },
    },
    {
      scenario: 'no chains change',
      chainStates: [
        { inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Optimism },
        { inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Optimism },
      ],
      expectedChanges: { input: false, output: false },
      shouldCallback: false,
    },
  ])('should detect when $scenario', ({ chainStates, expectedChanges, shouldCallback = true }) => {
    const callback = jest.fn()
    let inputChainId = chainStates[0]!.inputChainId
    let outputChainId = chainStates[0]!.outputChainId

    const { rerender } = renderHook(() => {
      const result = useChainIdsChangeEffect({
        inputChainId,
        outputChainId,
        onChainIdsChanged: callback,
      })
      return result
    })

    // Clear initial calls if any
    callback.mockClear()

    // Update state variables and rerender
    inputChainId = chainStates[1]!.inputChainId
    outputChainId = chainStates[1]!.outputChainId

    act(() => {
      rerender()
    })

    if (!shouldCallback) {
      expect(callback).not.toHaveBeenCalled()
    } else {
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          currentChains: {
            inputChainId: chainStates[1]!.inputChainId,
            outputChainId: chainStates[1]!.outputChainId,
          },
          hasInputChanged: expectedChanges.input,
          hasOutputChanged: expectedChanges.output,
        }),
      )
    }
  })

  test.each([
    {
      scenario: 'undefined input chain',
      chainStates: [
        { inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Optimism },
        { inputChainId: undefined as unknown as UniverseChainId, outputChainId: UniverseChainId.Optimism },
      ],
      expectedChanges: { input: true, output: false },
    },
    {
      scenario: 'undefined output chain',
      chainStates: [
        { inputChainId: UniverseChainId.Mainnet, outputChainId: UniverseChainId.Optimism },
        { inputChainId: UniverseChainId.Mainnet, outputChainId: undefined as unknown as UniverseChainId },
      ],
      expectedChanges: { input: false, output: true },
    },
  ])('should handle $scenario', ({ chainStates, expectedChanges }) => {
    const callback = jest.fn()
    let inputChainId = chainStates[0]!.inputChainId
    let outputChainId = chainStates[0]!.outputChainId

    const { rerender } = renderHook(() => {
      const result = useChainIdsChangeEffect({
        inputChainId,
        outputChainId,
        onChainIdsChanged: callback,
      })
      return result
    })

    // Clear initial calls if any
    callback.mockClear()

    // Update state variables and rerender
    inputChainId = chainStates[1]!.inputChainId
    outputChainId = chainStates[1]!.outputChainId

    act(() => {
      rerender()
    })

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        hasInputChanged: expectedChanges.input,
        hasOutputChanged: expectedChanges.output,
      }),
    )
  })

  it('should handle when callback is not provided', () => {
    // Should not throw errors
    let inputChainId = UniverseChainId.Mainnet
    let outputChainId = UniverseChainId.Optimism

    const { rerender } = renderHook(() =>
      useChainIdsChangeEffect({
        inputChainId,
        outputChainId,
      }),
    )

    // Update state variables and rerender
    inputChainId = UniverseChainId.Base
    outputChainId = UniverseChainId.ArbitrumOne

    act(() => {
      rerender()
    })
    // No assertion needed, just confirming no errors are thrown
  })

  it('should handle consecutive chain changes', () => {
    const callback = jest.fn()
    let inputChainId = UniverseChainId.Mainnet
    const outputChainId = UniverseChainId.Optimism

    const { rerender } = renderHook(() =>
      useChainIdsChangeEffect({
        inputChainId,
        outputChainId,
        onChainIdsChanged: callback,
      }),
    )

    // First change
    inputChainId = UniverseChainId.Base
    act(() => {
      rerender()
    })

    // Second change
    inputChainId = UniverseChainId.ArbitrumOne
    act(() => {
      rerender()
    })

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith(
      expect.objectContaining({
        currentChains: {
          inputChainId: UniverseChainId.ArbitrumOne,
          outputChainId: UniverseChainId.Optimism,
        },
        prevChains: {
          inputChainId: UniverseChainId.Base,
          outputChainId: UniverseChainId.Optimism,
        },
      }),
    )
  })
})
