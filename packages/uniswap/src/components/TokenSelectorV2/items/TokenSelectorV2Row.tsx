import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { TokenOption } from 'uniswap/src/components/lists/items/types'
import { shouldShowCategoryTag } from 'uniswap/src/components/TokenSelector/TokenSelectorList'
import { getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { formatIssuerLabel } from 'uniswap/src/data/apiClients/dataApiService/rwa/formatIssuerDisplaySymbol'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { CategoryTag } from 'uniswap/src/features/expandableAsset/CategoryTag'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { shortenAddress } from 'utilities/src/addresses'
import { NumberType } from 'utilities/src/format/types'

/**
 * Net-new V2 token row (Figma 750:13106 / 750:15766): 40px thumbnail + network badge,
 * name over symbol + address (or "N networks"), price + colored 24h change on the right.
 * Deliberately dumb: warnings and context menus are hoisted to the list parent — the row only reports presses.
 * `dimmed` is visual-only (blocked rows stay pressable so the warning modal can explain the block);
 * `disabled` hard-disables presses (unsupported tokens).
 */
export const TokenSelectorV2Row = memo(function TokenSelectorV2Row({
  option,
  showTokenAddress,
  disabled,
  dimmed,
  onPress,
}: {
  option: TokenOption
  showTokenAddress?: boolean
  disabled?: boolean
  dimmed?: boolean
  onPress: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted, formatNumberOrString, formatPercent } = useLocalizationContext()
  const { isTestnetModeEnabled } = useEnabledChains()

  const { currencyInfo, quantity, balanceUSD, priceUsd, pricePercentChange24h, rwaCategory } = option
  const { currency } = currencyInfo

  const networkCount = option.networkCount ?? currencyInfo.searchMultichainParent?.tokenCurrencyIds.length

  const hasBalance = Boolean(quantity && quantity !== 0)

  // Pre-tap risk cue for Medium+ severity, mirroring legacy TokenOptionItem's badge.
  const severity = getTokenWarningSeverity(currencyInfo)
  const { colorSecondary: warningIconColor } = getWarningIconColors(severity)

  const subtitle = useMemo(() => {
    const symbol = currency.symbol ?? ''
    if (networkCount && networkCount > 1) {
      return { symbol, detail: t('explore.tokens.table.networks', { count: networkCount }) }
    }
    if (showTokenAddress && currency.isToken) {
      return { symbol, detail: shortenAddress({ address: currency.address }) }
    }
    return { symbol, detail: undefined }
  }, [currency, networkCount, showTokenAddress, t])

  const rightElement = useMemo(() => {
    // Held tokens keep showing the user's balance (legacy behavior: balance owns the right slot).
    if (hasBalance) {
      const tokenBalance = formatNumberOrString({ value: quantity, type: NumberType.TokenTx })
      const fiatBalance = convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenQuantity)
      return (
        <Flex alignItems="flex-end">
          <Text variant="body2">{isTestnetModeEnabled ? tokenBalance : fiatBalance}</Text>
          {!isTestnetModeEnabled && (
            <Text color="$neutral2" variant="body3">
              {tokenBalance}
            </Text>
          )}
        </Flex>
      )
    }

    if (priceUsd != null) {
      const isNegative = (pricePercentChange24h ?? 0) < 0
      return (
        <Flex alignItems="flex-end">
          <Text variant="body2">{convertFiatAmountFormatted(priceUsd, NumberType.FiatTokenPrice)}</Text>
          {pricePercentChange24h != null && (
            <Text color={isNegative ? '$statusCritical' : '$statusSuccess'} variant="body3">
              {isNegative ? '▼' : '▲'} {formatPercent(Math.abs(pricePercentChange24h))}
            </Text>
          )}
        </Flex>
      )
    }

    if (rwaCategory != null && shouldShowCategoryTag({ rwaCategory, hasBalance })) {
      return <CategoryTag category={rwaCategory} />
    }

    return undefined
  }, [
    hasBalance,
    quantity,
    balanceUSD,
    priceUsd,
    pricePercentChange24h,
    rwaCategory,
    isTestnetModeEnabled,
    convertFiatAmountFormatted,
    formatNumberOrString,
    formatPercent,
  ])

  const displayName = option.rwaName ?? currency.name
  const issuerLabel = option.rwaIssuerSlug ? formatIssuerLabel(option.rwaIssuerSlug) : undefined

  return (
    <TouchableArea
      accessibilityRole="button"
      disabled={disabled}
      opacity={dimmed ? 0.5 : 1}
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      onPress={onPress}
    >
      <Flex row alignItems="center" gap="$spacing12" px="$spacing12" py="$spacing8">
        <TokenLogo
          chainId={currency.chainId}
          name={currency.name}
          size={iconSizes.icon40}
          symbol={currency.symbol}
          url={currencyInfo.logoUrl}
          hideNetworkLogo={networkCount !== undefined && networkCount > 1}
          networkCount={networkCount}
        />
        <Flex fill>
          <Flex row alignItems="center" gap="$spacing4">
            <Text color="$neutral1" numberOfLines={1} variant="body2">
              {displayName}
            </Text>
            {issuerLabel && (
              <Text color="$neutral2" numberOfLines={1} variant="body3">
                {issuerLabel}
              </Text>
            )}
            {warningIconColor && (
              <Flex>
                <WarningIcon severity={severity} size="$icon.16" strokeColorOverride={warningIconColor} />
              </Flex>
            )}
          </Flex>
          <Flex row alignItems="center" gap="$spacing8">
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {subtitle.symbol}
            </Text>
            {subtitle.detail && (
              <Text color="$neutral3" numberOfLines={1} variant="body3">
                {subtitle.detail}
              </Text>
            )}
          </Flex>
        </Flex>
        {rightElement}
      </Flex>
    </TouchableArea>
  )
})
