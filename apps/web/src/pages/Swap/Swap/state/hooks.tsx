import { Currency } from '@uniswap/sdk-core'
import { useEffect, useMemo } from 'react'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { getChainGasToken } from 'uniswap/src/features/gas/hooks/useChainGasToken'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyAddress } from 'uniswap/src/utils/currencyId'
import { useCurrency } from '~/hooks/Tokens'
import { queryParametersToCurrencyState } from '~/pages/Swap/Swap/state/tradeQueryParams'
import { useMultichainContext } from '~/state/multichain/useMultichainContext'

// Despite a lighter QuickTokenBalances query we've received feedback that the initial load time is too slow.
// Removing the logic that uses user's balance to determine the initial currency.
// We can revisit this if we find a way to make the initial load time faster.

// When we get the speed up here is the PR that removed the beautiful code:
// https://app.graphite.dev/github/pr/Uniswap/universe/11068/fix-web-default-to-eth-mainnet-on-multichain
export function useInitialCurrencyState(): {
  initialInputCurrency?: Currency
  initialOutputCurrency?: Currency
  initialTypedValue?: string
  initialField?: CurrencyField
  initialInputChainId?: UniverseChainId
  initialOutputChainId?: UniverseChainId
  triggerConnect: boolean
} {
  const { setIsUserSelectedToken } = useMultichainContext()
  const { defaultChainId, isTestnetModeEnabled } = useEnabledChains()

  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const parsedCurrencyState = useMemo(() => {
    return queryParametersToCurrencyState(parsedQs)
  }, [parsedQs])

  const supportedChainId = useSupportedChainId(parsedCurrencyState.chainId ?? defaultChainId) ?? UniverseChainId.Mainnet
  const supportedChainInfo = getChainInfo(supportedChainId)
  const isSupportedChainCompatible = isTestnetModeEnabled === !!supportedChainInfo.testnet

  const hasCurrencyQueryParams =
    parsedCurrencyState.inputCurrencyAddress ||
    parsedCurrencyState.outputCurrencyAddress ||
    parsedCurrencyState.chainId ||
    parsedCurrencyState.outputChainId

  useEffect(() => {
    if (parsedCurrencyState.inputCurrencyAddress || parsedCurrencyState.outputCurrencyAddress) {
      setIsUserSelectedToken(true)
    }
  }, [parsedCurrencyState.inputCurrencyAddress, parsedCurrencyState.outputCurrencyAddress, setIsUserSelectedToken])

  const { initialInputCurrencyAddress, initialChainId } = useMemo(() => {
    // Default to native if no query params or chain is not compatible with testnet or mainnet mode
    if (!hasCurrencyQueryParams || !isSupportedChainCompatible) {
      return {
        initialInputCurrencyAddress: currencyAddress(getChainGasToken(defaultChainId)),
        initialChainId: defaultChainId,
      }
    }
    // Handle query params or disconnected state
    if (parsedCurrencyState.inputCurrencyAddress) {
      return {
        initialInputCurrencyAddress: parsedCurrencyState.inputCurrencyAddress,
        initialChainId: parsedCurrencyState.chainId ? supportedChainId : undefined,
      }
    }
    // return ETH or parsedCurrencyState
    return {
      initialInputCurrencyAddress: parsedCurrencyState.outputCurrencyAddress ? undefined : 'ETH',
      initialChainId: parsedCurrencyState.chainId ? supportedChainId : undefined,
    }
    // oxlint-disable-next-line react/exhaustive-deps -- biome-parity: oxlint is stricter here
  }, [
    hasCurrencyQueryParams,
    isSupportedChainCompatible,
    parsedCurrencyState.inputCurrencyAddress,
    parsedCurrencyState.outputCurrencyAddress,
    supportedChainId,
    defaultChainId,
  ])

  const supportedOutputChainId = useSupportedChainId(parsedCurrencyState.outputChainId)

  const initialOutputCurrencyAddress = useMemo(
    () =>
      // clear output if identical unless there's a supported outputChainId which means we're bridging
      initialInputCurrencyAddress === parsedCurrencyState.outputCurrencyAddress && !supportedOutputChainId
        ? undefined
        : parsedCurrencyState.outputCurrencyAddress,
    [initialInputCurrencyAddress, parsedCurrencyState.outputCurrencyAddress, supportedOutputChainId],
  )

  const initialInputCurrency = useCurrency({ address: initialInputCurrencyAddress, chainId: initialChainId })
  const initialOutputCurrency = useCurrency({
    address: initialOutputCurrencyAddress,
    chainId: parsedCurrencyState.outputChainId ?? initialChainId,
  })
  const initialTypedValue = initialInputCurrency || initialOutputCurrency ? parsedCurrencyState.value : undefined
  const initialFieldUpper =
    parsedCurrencyState.field && typeof parsedCurrencyState.field === 'string'
      ? parsedCurrencyState.field.toUpperCase()
      : undefined
  const initialField =
    initialTypedValue && initialFieldUpper && initialFieldUpper in CurrencyField
      ? CurrencyField[initialFieldUpper as keyof typeof CurrencyField]
      : undefined

  return {
    initialInputCurrency,
    initialOutputCurrency,
    initialTypedValue,
    initialField,
    initialInputChainId: initialChainId,
    initialOutputChainId: supportedOutputChainId,
    triggerConnect: !!parsedQs.connect,
  }
}
