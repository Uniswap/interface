import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { GeneratedIcon } from 'ui/src'
import { Bank, SwapDotted } from 'ui/src/components/icons'
import { CurrencyField } from 'uniswap/src/types/currency'

interface TokenCTAButtonVariant {
  title: string
  icon?: GeneratedIcon
  onPress: () => void
}

interface UseTokenDetailsCTAVariantParams {
  hasTokenBalance: boolean
  isNativeCurrency: boolean
  nativeFiatOnRampCurrency: unknown | undefined
  fiatOnRampCurrency: unknown | undefined
  bridgingTokenWithHighestBalance: unknown | undefined
  hasZeroGasBalance: boolean | undefined
  tokenSymbol: string | undefined
  onPressBuyFiatOnRamp: (isOfframp: boolean) => void
  onPressGet: () => void
  onPressSwap: (currencyField: CurrencyField) => void
}

interface MultichainBuyVariant {
  title?: string
  icon?: GeneratedIcon
  onPress: () => void
}

interface UseMultichainBuyVariantParams {
  hasTokenBalance: boolean
  isNativeCurrency: boolean
  nativeFiatOnRampCurrency: unknown | undefined
  fiatOnRampCurrency: unknown | undefined
  bridgingTokenWithHighestBalance: unknown | undefined
  hasZeroGasBalance: boolean | undefined
  tokenSymbol: string | undefined
  onPressBuyWithCash: () => void
  onPressGet: () => void
  onPressBuy: () => void
}

/** Determines the Buy button title and handler for the multichain TDP variant. */
export function useMultichainBuyVariant({
  hasTokenBalance,
  isNativeCurrency,
  nativeFiatOnRampCurrency,
  fiatOnRampCurrency,
  bridgingTokenWithHighestBalance,
  hasZeroGasBalance,
  tokenSymbol,
  onPressBuyWithCash,
  onPressGet,
  onPressBuy,
}: UseMultichainBuyVariantParams): MultichainBuyVariant {
  const { t } = useTranslation()

  return useMemo(() => {
    if (hasTokenBalance) {
      return { onPress: onPressBuy }
    }

    const isOnrampCurrency = (isNativeCurrency && nativeFiatOnRampCurrency) || fiatOnRampCurrency

    if (isOnrampCurrency && !bridgingTokenWithHighestBalance) {
      return { title: t('fiatOnRamp.action.buyWithCash'), icon: Bank, onPress: onPressBuyWithCash }
    }

    if (hasZeroGasBalance) {
      return {
        title: tokenSymbol ? t('tdp.button.getToken', { tokenSymbol }) : t('tdp.button.getTokenFallback'),
        onPress: onPressGet,
      }
    }

    return { onPress: onPressBuy }
  }, [
    hasTokenBalance,
    isNativeCurrency,
    fiatOnRampCurrency,
    nativeFiatOnRampCurrency,
    bridgingTokenWithHighestBalance,
    hasZeroGasBalance,
    tokenSymbol,
    t,
    onPressBuyWithCash,
    onPressGet,
    onPressBuy,
  ])
}

export function useTokenDetailsCTAVariant({
  hasTokenBalance,
  isNativeCurrency,
  nativeFiatOnRampCurrency,
  fiatOnRampCurrency,
  bridgingTokenWithHighestBalance,
  hasZeroGasBalance,
  tokenSymbol,
  onPressBuyFiatOnRamp,
  onPressGet,
  onPressSwap,
}: UseTokenDetailsCTAVariantParams): TokenCTAButtonVariant {
  const { t } = useTranslation()

  return useMemo(() => {
    const swapVariant = {
      title: t('common.button.swap'),
      icon: SwapDotted,
      onPress: () => onPressSwap(hasTokenBalance ? CurrencyField.INPUT : CurrencyField.OUTPUT),
    }

    if (hasTokenBalance) {
      return swapVariant
    }

    const isOnrampCurrency = (isNativeCurrency && nativeFiatOnRampCurrency) || fiatOnRampCurrency

    if (isOnrampCurrency && !bridgingTokenWithHighestBalance) {
      return {
        title: t('common.button.buy'),
        icon: Bank,
        onPress: () => onPressBuyFiatOnRamp(false),
      }
    }

    if (!isNativeCurrency && hasZeroGasBalance) {
      return {
        title: tokenSymbol ? t('tdp.button.getToken', { tokenSymbol }) : t('tdp.button.getTokenFallback'),
        onPress: onPressGet,
      }
    }

    return swapVariant
  }, [
    hasTokenBalance,
    isNativeCurrency,
    fiatOnRampCurrency,
    nativeFiatOnRampCurrency,
    bridgingTokenWithHighestBalance,
    hasZeroGasBalance,
    tokenSymbol,
    t,
    onPressBuyFiatOnRamp,
    onPressGet,
    onPressSwap,
  ])
}
