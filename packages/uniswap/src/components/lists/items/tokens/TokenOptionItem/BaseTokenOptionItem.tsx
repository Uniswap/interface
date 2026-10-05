import { Flex, Text } from '@universe/mycelium'
import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { OptionItem } from 'uniswap/src/components/lists/items/OptionItem'
import { TokenOptionItemStats } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/TokenOptionItemStats'
import { tokenOptionTitleSuffix } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/TokenOptionTitleSuffix'
import {
  TokenContextMenuVariant,
  type TokenOptionItemProps,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItem/types'
import { TokenOptionWarningBadge } from 'uniswap/src/components/lists/items/tokens/TokenOptionWarningBadge'
import { useSearchFdvLabel } from 'uniswap/src/components/lists/items/useSearchFdvLabel'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { getWarningIconColors } from 'uniswap/src/components/warnings/utils'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { shortenAddress } from 'utilities/src/addresses'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'

export const BaseTokenOptionItem = memo(function BaseTokenOptionItemInner(
  props: TokenOptionItemProps & { openContextMenu?: () => void },
): JSX.Element {
  const {
    option,
    onPress,
    showTokenAddress,
    networkCount,
    hideNetworkCount,
    hideNetworkLogo,
    rightElement,
    categoryTag,
    categoryTagPlacement = 'right',
    showDisabled,
    modalInfo,
    focusedRowControl,
    openContextMenu,
    displayName,
    issuer,
    showIssuerTag,
    modifierPressHref,
    onModifierPress,
    contextMenuVariant,
    searchStats,
    earnApyPercent,
    symbolMaxCharacters,
  } = props
  const titleCategoryTag = categoryTagPlacement === 'title' ? categoryTag : undefined
  const { currencyInfo } = option
  const { currency } = currencyInfo
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const fdvLabel = useSearchFdvLabel(searchStats?.fdvUsd)

  const isMultichain = networkCount !== undefined && networkCount > 1
  const isSingleChainMultichainResult = networkCount !== undefined && networkCount === 1
  const statsElement =
    searchStats?.priceUsd != null ? (
      <TokenOptionItemStats priceUsd={searchStats.priceUsd} pricePercentChange1d={searchStats.pricePercentChange1d} />
    ) : undefined

  // search and token selector only badge >=Medium severity (Low/info-only warnings are too noisy to surface here)
  const severity = getTokenWarningSeverity(currencyInfo)
  const { colorSecondary: warningIconColor } = getWarningIconColors(severity)
  const showSearchWarningBadge =
    contextMenuVariant === TokenContextMenuVariant.Search && severity >= WarningSeverity.Medium

  return (
    <OptionItem
      image={
        <TokenLogo
          chainId={currency.chainId}
          name={currency.name}
          symbol={currency.symbol}
          url={currencyInfo.logoUrl ?? undefined}
          hideNetworkLogo={hideNetworkLogo || isMultichain}
          alwaysShowNetworkLogo={isSingleChainMultichainResult}
        />
      }
      title={displayName ?? currency.name ?? currency.symbol ?? ''}
      titleSuffix={tokenOptionTitleSuffix({ issuer, showIssuerTag, categoryTag: titleCategoryTag })}
      subtitle={
        <Flex row alignItems="center" gap="$spacing8">
          {earnApyPercent != null ? (
            <Text color="$accent1" numberOfLines={1} variant="body3">
              {t('search.results.stats.apy', { apy: formatPercent(earnApyPercent) })}
            </Text>
          ) : (
            <Text color="$neutral2" numberOfLines={1} variant="body3">
              {getSymbolDisplayText(currency.symbol, symbolMaxCharacters)}
            </Text>
          )}
          {fdvLabel ? (
            <Text color="$neutral3" numberOfLines={1} variant="body3">
              {fdvLabel}
            </Text>
          ) : isMultichain && !hideNetworkCount ? (
            <Text color="$neutral3" numberOfLines={1} variant="body3">
              {t('search.results.networks', { count: networkCount })}
            </Text>
          ) : (
            !currency.isNative &&
            showTokenAddress && (
              <Flex shrink>
                <Text color="$neutral3" numberOfLines={1} variant="body3">
                  {shortenAddress({ address: currency.address })}
                </Text>
              </Flex>
            )
          )}
        </Flex>
      }
      badge={
        showSearchWarningBadge ? (
          <TokenOptionWarningBadge currencyInfo={currencyInfo} severity={severity} />
        ) : warningIconColor ? (
          <Flex>
            <WarningIcon severity={severity} size="$icon.16" strokeColorOverride={warningIconColor} />
          </Flex>
        ) : undefined
      }
      rightElement={rightElement ?? statsElement}
      categoryTag={titleCategoryTag ? undefined : categoryTag}
      disabled={showDisabled}
      testID={`token-option-${currency.chainId}-${currency.symbol}`}
      modalInfo={modalInfo}
      focusedRowControl={focusedRowControl}
      modifierPressHref={modifierPressHref}
      onPress={onPress}
      onLongPress={
        openContextMenu
          ? (): void => {
              dismissNativeKeyboard()
              openContextMenu()
            }
          : undefined
      }
      onModifierPress={onModifierPress}
    />
  )
})
