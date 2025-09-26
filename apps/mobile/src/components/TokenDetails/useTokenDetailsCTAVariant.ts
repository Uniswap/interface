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
  hasZeroNativeBalance: boolean | undefined
  tokenSymbol: string | undefined
  onPressBuyFiatOnRamp: (isOfframp: boolean) => void
  onPressGet: () => void
  onPressSwap: (currencyField: CurrencyField) => void
}

export function useTokenDetailsCTAVariant({
  hasTokenBalance,
  isNativeCurrency,
  nativeFiatOnRampCurrency,
  fiatOnRampCurrency,
  bridgingTokenWithHighestBalance,
  hasZeroNativeBalance,
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

    if (!isNativeCurrency && hasZeroNativeBalance) {
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
    hasZeroNativeBalance,
    tokenSymbol,
    t,
    onPressBuyFiatOnRamp,
    onPressGet,
    onPressSwap,
  ])
}
