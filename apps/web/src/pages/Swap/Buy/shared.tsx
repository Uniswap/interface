import { Currency } from '@uniswap/sdk-core'
import { Flex, type FlexCompatProps, TouchableArea } from '@universe/mycelium'
import { styled } from '@universe/mycelium/styled'
import { TestID } from '@universe/test'
import { forwardRef, type ForwardRefExoticComponent, PropsWithChildren, type RefAttributes } from 'react'
import { ModalCloseIcon, useSporeColors } from 'ui/src'
import { ReactComponent as ForConnectingBackground } from 'ui/src/assets/backgrounds/for-connecting-v2.svg'
import { ArrowLeft } from 'ui/src/components/icons/ArrowLeft'
import { FiatCurrencyInfo, FORCountry, RampDirection } from 'uniswap/src/features/fiatOnRamp/types'
import { LocalizedFormatter } from 'uniswap/src/features/language/formatter'
import { navigatorLocale } from 'uniswap/src/features/language/navigatorLocale'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
export const ContentWrapper: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function ContentWrapper(props, ref) {
  return <Flex ref={ref} backgroundColor="$surface1" width="100%" flex={1} position="relative" {...props} />
})

// The SVGR component has no compat primitive, so this stays on the house factory.
// apps/web only, so `platform: 'web'` is safe.
const ConnectingBackgroundImage = styled(ForConnectingBackground, {
  platform: 'web',
  base: 'absolute z-0 w-full h-full',
})

const ConnectingBackgroundImageFadeLayer = forwardRef<HTMLDivElement, FlexCompatProps>(
  function ConnectingBackgroundImageFadeLayer(props, ref) {
    return <Flex ref={ref} position="absolute" zIndex={1} width="100%" height="100%" top={0} left={0} {...props} />
  },
)

interface ConnectingViewWrapperProps {
  closeModal?: () => void
  onBack?: () => void
  showDottedBackground?: boolean
}

export function ConnectingViewWrapper({
  children,
  closeModal,
  onBack,
  showDottedBackground = true,
}: PropsWithChildren<ConnectingViewWrapperProps>) {
  const colors = useSporeColors()

  return (
    <Flex gap="$spacing16" position="relative" $sm={{ px: '$spacing8', pb: '$spacing16' }}>
      {showDottedBackground && (
        <>
          <ConnectingBackgroundImage color={colors.neutral2.val} />
          <ConnectingBackgroundImageFadeLayer
            background={`radial-gradient(70% 50% at center, transparent 0%, ${colors.surface1.val} 100%)`}
          />
        </>
      )}
      <Flex flexDirection="row-reverse" alignItems="center" justifyContent="space-between" zIndex={2}>
        {closeModal && <ModalCloseIcon testId={TestID.ConnectingViewWrapperClose} onClose={closeModal} />}
        {onBack && (
          <TouchableArea data-testid={TestID.ConnectingViewWrapperBack} onPress={onBack}>
            <ArrowLeft color="$neutral2" size="$icon.24" hoverColor="$neutral2Hovered" />
          </TouchableArea>
        )}
      </Flex>
      <Flex mt="$spacing40" zIndex={2} width="100%" height="100%">
        {children}
      </Flex>
    </Flex>
  )
}

export function formatFiatOnRampFiatAmount(amount: number, fiatCurrencyInfo: FiatCurrencyInfo) {
  return fiatCurrencyInfo.symbolAtFront ? `${fiatCurrencyInfo.symbol}${amount}` : `${amount}${fiatCurrencyInfo.symbol}`
}

export function parseAndFormatFiatOnRampFiatAmount(amount: string, fiatCurrencyInfo: FiatCurrencyInfo) {
  const match = /\d+\.\d+/.exec(amount)

  if (match) {
    return formatFiatOnRampFiatAmount(parseFloat(match[0]), fiatCurrencyInfo)
  }

  return undefined
}

export function formatFORErrorAmount({
  amount,
  isFiat,
  fiatCurrencyInfo,
  quoteCurrency,
  formatNumberOrString,
  getSymbolDisplayText,
}: {
  amount: number
  isFiat: boolean
  fiatCurrencyInfo: FiatCurrencyInfo
  quoteCurrency?: Currency
  formatNumberOrString: LocalizedFormatter['formatNumberOrString']
  getSymbolDisplayText: (symbol: Maybe<string>) => Maybe<string>
}): string | undefined {
  if (isFiat) {
    return formatFiatOnRampFiatAmount(amount, fiatCurrencyInfo)
  }

  if (quoteCurrency) {
    return `${formatNumberOrString({
      value: amount,
      type: NumberType.TokenNonTx,
    })} ${getSymbolDisplayText(quoteCurrency.symbol)}`
  }

  return undefined
}

export function getOnRampInputAmount({
  rampDirection,
  inputAmount,
  amountOut,
  inputInFiat,
}: {
  rampDirection: RampDirection
  inputAmount: string
  amountOut: string
  inputInFiat: boolean
}) {
  if (rampDirection === RampDirection.ON_RAMP) {
    return inputInFiat ? inputAmount : amountOut
  }
  return inputInFiat ? amountOut : inputAmount
}

/**
 * Gets the display name for a country code using Intl.DisplayNames
 * @param countryCode - The country code (e.g., 'US', 'GB')
 * @param locale - The locale to use for the display name (defaults to navigator.language)
 * @returns The display name of the country, or empty string if unable to determine
 */
function getCountryDisplayName(countryCode: string, locale?: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale || navigator.language || 'en'], { type: 'region' })
    return displayNames.of(countryCode) || ''
  } catch (_error) {
    logger.debug('BuyForm', 'getCountryDisplayName', 'Error getting country display name', _error)
    return ''
  }
}

/**
 * Extracts country from browser locale, defaults to provided default if unable to determine
 * @param defaultCountry - The default country to use if unable to determine from locale (defaults to US)
 * @returns FORCountry object with country code and display name
 */
export function getCountryFromLocale(
  defaultCountry: FORCountry = { countryCode: 'US', displayName: 'United States', state: undefined },
): FORCountry {
  try {
    // Try to get country from navigator.language (e.g., 'en-US' -> 'US', 'zh-Hans-CN' -> 'CN')
    const locale = navigatorLocale()
    if (locale) {
      // Locale format can be 'language-COUNTRY' (e.g., 'en-US') or 'language-script-COUNTRY' (e.g., 'zh-Hans-CN')
      // Country code is typically the last part when present
      const parts = locale.split('-')
      if (parts.length > 1) {
        const countryCode = parts[parts.length - 1].toUpperCase()
        const displayName = getCountryDisplayName(countryCode, locale)
        return { countryCode, displayName, state: undefined }
      }
    }

    // Fallback: try navigator.language directly
    if (navigator.language) {
      const parts = navigator.language.split('-')
      if (parts.length > 1) {
        const countryCode = parts[parts.length - 1].toUpperCase()
        const displayName = getCountryDisplayName(countryCode)
        return { countryCode, displayName, state: undefined }
      }
    }
  } catch (_error) {
    logger.debug('BuyForm', 'getCountryFromLocale', 'Error getting country code from locale', _error)
  }

  // Return the default country with its display name
  return defaultCountry
}
