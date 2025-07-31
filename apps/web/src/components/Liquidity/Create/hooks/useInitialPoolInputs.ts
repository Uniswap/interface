import { FeeAmount, TICK_SPACINGS } from '@uniswap/v3-sdk'
import { DEFAULT_FEE_DATA, FeeData } from 'components/Liquidity/Create/types'
import { isDynamicFeeTier } from 'components/Liquidity/utils/feeTiers'
import { checkIsNative, useCurrencyWithLoading } from 'hooks/Tokens'
import { ParsedQs } from 'qs'
import { useMemo } from 'react'
import { parseCurrencyFromURLParameter } from 'state/swap/hooks'
import { WRAPPED_NATIVE_CURRENCY, nativeOnChain } from 'uniswap/src/constants/tokens'
import { useUrlContext } from 'uniswap/src/contexts/UrlContext'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { getParsedChainId } from 'utils/chainParams'

function getParsedHookAddrParam(params: ParsedQs): string | undefined {
  const hookAddr = params.hook
  if (!hookAddr || typeof hookAddr !== 'string') {
    return undefined
  }
  const validAddress = getValidAddress({ address: hookAddr, withEVMChecksum: true, platform: Platform.EVM })
  return validAddress || undefined
}

function getParsedFeeTierParam(params: ParsedQs): FeeData | undefined {
  const feeTier = params.feeTier
  const isDynamic = params.isDynamic === 'true'
  if (!feeTier || typeof feeTier !== 'string') {
    return DEFAULT_FEE_DATA
  }
  const feeTierNumber = parseInt(feeTier)
  if (isNaN(feeTierNumber)) {
    return DEFAULT_FEE_DATA
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const tickSpacing = TICK_SPACINGS[feeTierNumber as FeeAmount] ?? TICK_SPACINGS[FeeAmount.MEDIUM]

  return {
    feeAmount: feeTierNumber,
    tickSpacing,
    isDynamic: isDynamicFeeTier({
      feeAmount: feeTierNumber,
      tickSpacing,
      isDynamic,
    }),
  }
}

// Prefill currency inputs from URL search params ?currencyA=ETH&currencyB=0x123...&chain=base&feeTier=10000&hook=0x123...
export function useInitialPoolInputs() {
  const { defaultChainId } = useEnabledChains()
  const defaultInitialToken = nativeOnChain(defaultChainId)

  const { useParsedQueryString } = useUrlContext()
  const parsedQs = useParsedQueryString()
  const hook = getParsedHookAddrParam(parsedQs)
  const parsedChainId = getParsedChainId(parsedQs, CurrencyField.INPUT)
  const supportedChainId = useSupportedChainId(parsedChainId) ?? defaultChainId
  const fee = getParsedFeeTierParam(parsedQs)
  const { currencyAddressA, currencyAddressB } = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const currencyAddressA = parseCurrencyFromURLParameter(parsedQs.currencyA ?? parsedQs.currencya)
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const parsedCurrencyAddressB = parseCurrencyFromURLParameter(parsedQs.currencyB ?? parsedQs.currencyb)
    const currencyAddressB = parsedCurrencyAddressB === currencyAddressA ? undefined : parsedCurrencyAddressB

    // prevent weth + eth
    const isETHOrWETHA =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      checkIsNative(currencyAddressA) || currencyAddressA === WRAPPED_NATIVE_CURRENCY[supportedChainId]?.address
    const isETHOrWETHB =
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      checkIsNative(currencyAddressB) || currencyAddressB === WRAPPED_NATIVE_CURRENCY[supportedChainId]?.address

    return {
      currencyAddressA,
      currencyAddressB: currencyAddressB && !(isETHOrWETHA && isETHOrWETHB) ? currencyAddressB : undefined,
    }
  }, [parsedQs.currencyA, parsedQs.currencyB, parsedQs.currencya, parsedQs.currencyb, supportedChainId])

  const { currency: currencyA, loading: loadingA } = useCurrencyWithLoading({
    address: currencyAddressA,
    chainId: supportedChainId,
  })
  const { currency: currencyB, loading: loadingB } = useCurrencyWithLoading({
    address: currencyAddressB,
    chainId: supportedChainId,
  })

  return useMemo(() => {
    return {
      tokenA: currencyA ?? defaultInitialToken,
      tokenB: currencyB,
      fee,
      hook,
      loading: loadingA || loadingB,
    }
  }, [currencyA, currencyB, fee, hook, defaultInitialToken, loadingA, loadingB])
}
