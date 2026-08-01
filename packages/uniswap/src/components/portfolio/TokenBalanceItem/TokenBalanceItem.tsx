import { isExtensionApp, isWebPlatform } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Shine, Text, useIsDarkMode } from 'ui/src'
import { ChevronsIn } from 'ui/src/components/icons/ChevronsIn'
import { ChevronsOut } from 'ui/src/components/icons/ChevronsOut'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GroupHoverTransition } from 'uniswap/src/components/GroupHoverTransition'
import { NetworkIconList } from 'uniswap/src/components/network/NetworkIconList/NetworkIconList'
import { TokenBalanceItemContextMenu } from 'uniswap/src/components/portfolio/TokenBalanceItem/TokenBalanceItemContextMenu'
import { RelativeChange } from 'uniswap/src/components/RelativeChange/RelativeChange'
import { useRestTokenBalanceMainParts, useRestTokenBalanceQuantityParts } from 'uniswap/src/data/rest/getPortfolio'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CurrencyInfo, PortfolioBalance, PortfolioMultichainBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getPortfolioBalanceDisplayQuantity } from 'uniswap/src/features/portfolio/balances/getPortfolioBalanceDisplayQuantity'
import { TokenMenuActionType } from 'uniswap/src/features/portfolio/balances/hooks/useTokenContextMenuOptions'
import { sortPortfolioChainBalances } from 'uniswap/src/features/portfolio/balances/sortPortfolioBalances'
import { useTokenBalanceItemConfig } from 'uniswap/src/features/portfolio/TokenBalanceListContext'
import { CurrencyId } from 'uniswap/src/types/currency'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { NumberType } from 'utilities/src/format/types'

/**
 * IMPORTANT: if you modify the UI of this component, update `TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT`
 * and the corresponding Skeleton component.
 */

/** When set (e.g. mobile portfolio), wraps the row in {@link TokenBalanceItemContextMenu}. */
export interface TokenBalanceItemContextMenuConfig {
  openReportTokenModal: () => void
  copyAddressToClipboard?: (address: string) => Promise<void>
}

interface TokenBalanceItemProps {
  currencyInfo: CurrencyInfo
  portfolioBalance?: PortfolioMultichainBalance
  isLoading?: boolean
  padded?: boolean
  contextMenuActions?: TokenBalanceItemContextMenuConfig
}

const MULTICHAIN_BALANCES_SLOT_HEIGHT = 20

/** Row tap navigates to TDP — View details in the long-press menu is redundant. */
const EXCLUDED_ACTIONS = [TokenMenuActionType.ViewDetails]

/**
 * Estimated row height for list virtualization (FlatList `getItemLayout`, scroll windowing).
 * Update when `TokenBalanceItem` layout changes (logo, padding, or text lines).
 */
export const TOKEN_BALANCE_ITEM_ESTIMATED_HEIGHT = 64

/**
 * If you add any props to this component, make sure you use the react-devtools profiler to confirm that this doesn't break the memoization.
 * This component needs to be as fast as possible and shouldn't re-render often or else it causes performance issues.
 */
export const TokenBalanceItem = memo(function TokenBalanceItemInner({
  currencyInfo,
  portfolioBalance,
  isLoading,
  padded,
  contextMenuActions,
}: TokenBalanceItemProps) {
  const { currency } = currencyInfo
  const { isTestnetModeEnabled } = useEnabledChains()
  const { evmOwner, svmOwner, expandedCurrencyIds, multichainRowExpansionEnabled, onPressToken, hiddenBalanceRowIds } =
    useTokenBalanceItemConfig()

  // Ensure items rerender when theme is switched
  useIsDarkMode()

  const name = portfolioBalance?.name ?? currency.name
  const symbol = portfolioBalance?.symbol ?? currency.symbol
  const logoUrl = portfolioBalance?.logoUrl ?? currencyInfo.logoUrl
  const shortenedSymbol = getSymbolDisplayText(symbol)

  const showBalancesHoverTransition = Boolean(
    isExtensionApp && multichainRowExpansionEnabled && portfolioBalance && portfolioBalance.tokens.length > 1,
  )

  const isMultichainRowExpanded = Boolean(portfolioBalance && expandedCurrencyIds.has(portfolioBalance.id))

  const isHiddenSectionRow = Boolean(portfolioBalance && hiddenBalanceRowIds.has(portfolioBalance.id))

  const multichainChainIds = useMemo((): UniverseChainId[] => {
    if (!portfolioBalance) {
      return []
    }
    return sortPortfolioChainBalances({
      tokens: portfolioBalance.tokens,
      isTestnetModeEnabled,
    }).map((token) => token.chainId as UniverseChainId)
  }, [portfolioBalance, isTestnetModeEnabled])

  const portfolioBalanceForMenu = useMemo((): PortfolioBalance | undefined => {
    if (!portfolioBalance?.tokens[0]) {
      return undefined
    }
    const primaryToken = portfolioBalance.tokens[0]
    return {
      id: portfolioBalance.id,
      cacheId: portfolioBalance.cacheId,
      quantity: primaryToken.quantity,
      balanceUSD: portfolioBalance.totalValueUsd,
      currencyInfo: primaryToken.currencyInfo,
      relativeChange24: portfolioBalance.pricePercentChange1d,
      isHidden: portfolioBalance.isHidden,
    }
  }, [portfolioBalance])

  const handleMenuRowPress = useCallback((): void => {
    const isMultichainAsset = (portfolioBalance?.tokens.length ?? 0) > 1
    onPressToken?.(currencyInfo.currencyId, { isMultichainAsset })
  }, [currencyInfo.currencyId, onPressToken, portfolioBalance?.tokens.length])

  const row = (
    <Flex
      group
      alignItems="flex-start"
      backgroundColor="$surface1"
      borderRadius="$rounded16"
      flexDirection="row"
      justifyContent="space-between"
      hoverStyle={{ backgroundColor: '$surface2' }}
      px={padded ? '$spacing24' : '$spacing8'}
      py="$spacing8"
      testID={`TokenBalanceItem_${symbol}`}
    >
      <Flex row shrink alignItems="center" gap="$spacing12" overflow="hidden">
        <TokenLogo
          chainId={currency.chainId}
          name={name}
          symbol={symbol}
          url={logoUrl ?? undefined}
          networkCount={portfolioBalance?.tokens.length}
          alwaysShowNetworkLogo={portfolioBalance?.tokens.length === 1}
        />
        <Flex shrink alignItems="flex-start">
          <Text ellipsizeMode="tail" numberOfLines={1} variant={isWebPlatform ? 'body2' : 'body1'}>
            {name ?? shortenedSymbol}
          </Text>
          {showBalancesHoverTransition && portfolioBalance ? (
            <TokenBalanceItemMultichainBalancesHoverSlot
              shortenedSymbol={shortenedSymbol}
              currencyId={currencyInfo.currencyId}
              evmAddress={evmOwner}
              svmAddress={svmOwner}
              portfolioBalance={portfolioBalance}
              isMultichainRowExpanded={isMultichainRowExpanded}
              multichainChainIds={multichainChainIds}
            />
          ) : (
            <Flex row alignItems="center" gap="$spacing8" minHeight={20}>
              <TokenBalanceQuantity
                shortenedSymbol={shortenedSymbol}
                currencyId={currencyInfo.currencyId}
                evmAddress={evmOwner}
                svmAddress={svmOwner}
                portfolioBalance={portfolioBalance}
              />
            </Flex>
          )}
        </Flex>
      </Flex>

      {isHiddenSectionRow ? null : (
        <TokenBalanceRightSideColumn
          isLoading={isLoading}
          currencyId={currencyInfo.currencyId}
          evmAddress={evmOwner}
          svmAddress={svmOwner}
          portfolioBalance={portfolioBalance}
        />
      )}
    </Flex>
  )

  if (contextMenuActions && portfolioBalanceForMenu) {
    const isMultichainAsset = (portfolioBalance?.tokens.length ?? 0) > 1
    return (
      <TokenBalanceItemContextMenu
        portfolioBalance={portfolioBalanceForMenu}
        isMultichainAsset={isMultichainAsset}
        excludedActions={EXCLUDED_ACTIONS}
        copyAddressToClipboard={contextMenuActions.copyAddressToClipboard}
        openReportTokenModal={contextMenuActions.openReportTokenModal}
        onPressToken={handleMenuRowPress}
      >
        {row}
      </TokenBalanceItemContextMenu>
    )
  }

  return row
})

interface TokenBalanceItemMultichainBalancesHoverSlotProps {
  shortenedSymbol: Maybe<string>
  currencyId: CurrencyId
  evmAddress?: string
  svmAddress?: string
  portfolioBalance: PortfolioMultichainBalance
  isMultichainRowExpanded: boolean
  multichainChainIds: UniverseChainId[]
}

function TokenBalanceItemMultichainBalancesHoverSlot({
  shortenedSymbol,
  currencyId,
  evmAddress,
  svmAddress,
  portfolioBalance,
  isMultichainRowExpanded,
  multichainChainIds,
}: TokenBalanceItemMultichainBalancesHoverSlotProps): JSX.Element {
  const { t } = useTranslation()

  return (
    <GroupHoverTransition
      showTransition
      height={MULTICHAIN_BALANCES_SLOT_HEIGHT}
      defaultContent={
        <Flex height={MULTICHAIN_BALANCES_SLOT_HEIGHT} justifyContent="center" width="100%">
          <TokenBalanceQuantity
            shortenedSymbol={shortenedSymbol}
            currencyId={currencyId}
            evmAddress={evmAddress}
            svmAddress={svmAddress}
            portfolioBalance={portfolioBalance}
          />
        </Flex>
      }
      hoverContent={
        <Flex
          row
          gap="$gap4"
          alignItems="center"
          height={MULTICHAIN_BALANCES_SLOT_HEIGHT}
          $platform-web={{ minWidth: 'fit-content' }}
        >
          <Text variant="body3" color="$neutral2" numberOfLines={1}>
            {t('portfolio.tokens.table.balances')}
          </Text>
          {!isMultichainRowExpanded ? <NetworkIconList chainIds={multichainChainIds} size={12} /> : null}
          {isMultichainRowExpanded ? (
            <ChevronsIn color="$neutral2" size="$icon.16" />
          ) : (
            <ChevronsOut color="$neutral2" size="$icon.16" />
          )}
        </Flex>
      }
    />
  )
}

function TokenBalanceQuantity({
  shortenedSymbol,
  currencyId,
  evmAddress,
  svmAddress,
  portfolioBalance,
}: {
  shortenedSymbol: Maybe<string>
  currencyId: CurrencyId
  evmAddress?: string
  svmAddress?: string
  portfolioBalance?: PortfolioMultichainBalance
}): JSX.Element {
  const { formatNumberOrString } = useLocalizationContext()

  // By relying on this cached data we can avoid re-renders unless these specific fields change.
  const restTokenBalance = useRestTokenBalanceQuantityParts({
    currencyId,
    evmAddress,
    svmAddress,
  })

  const quantity = getPortfolioBalanceDisplayQuantity(portfolioBalance) ?? restTokenBalance.data?.quantity

  return (
    <Text color="$neutral2" numberOfLines={1} variant={isWebPlatform ? 'body3' : 'body2'}>
      {formatNumberOrString({ value: quantity })} {shortenedSymbol}
    </Text>
  )
}

function TokenBalanceRightSideColumn({
  isLoading,
  currencyId,
  evmAddress,
  svmAddress,
  portfolioBalance,
}: {
  isLoading?: boolean
  currencyId: CurrencyId
  evmAddress?: string
  svmAddress?: string
  portfolioBalance?: PortfolioMultichainBalance
}): JSX.Element {
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
  const { t } = useTranslation()
  const { isTestnetModeEnabled } = useEnabledChains()
  const { convertFiatAmountFormatted } = useLocalizationContext()

  // By relying on this cached data we can avoid re-renders unless these specific fields change.
  const restTokenBalance = useRestTokenBalanceMainParts({
    currencyId,
    evmAddress,
    svmAddress,
  })
  const tokenBalance = restTokenBalance.data

  const balanceUSD = portfolioBalance ? portfolioBalance.totalValueUsd : tokenBalance?.denominatedValue?.value
  const relativeChange24 = portfolioBalance
    ? portfolioBalance.pricePercentChange1d
    : tokenBalance?.tokenProjectMarket?.relativeChange24?.value

  const balanceFormatted = convertFiatAmountFormatted(balanceUSD, NumberType.FiatTokenQuantity)

  const isTestnetModeWithNoBalance = isTestnetModeEnabled && !balanceUSD

  return isTestnetModeWithNoBalance ? (
    <></>
  ) : (
    <Flex justifyContent="space-between" position="relative">
      <Shine disabled={!isLoading}>
        {!balanceUSD ? (
          <Flex centered fill>
            <Text color="$neutral2">{t('common.text.notAvailable')}</Text>
          </Flex>
        ) : (
          <Flex alignItems="flex-end" pl="$spacing8">
            <AnimatedNumber
              alignRight
              numericValue={balanceUSD}
              value={balanceFormatted}
              textVariant={isWebPlatform ? '$body2' : '$body1'}
              disableAnimations={!isDataLivelinessEnabled}
              warmLoading={isLoading}
            />
            <RelativeChange
              alignRight
              change={relativeChange24 ?? undefined}
              negativeChangeColor="$statusCritical"
              positiveChangeColor="$statusSuccess"
              variant={isWebPlatform ? 'body3' : 'body2'}
            />
          </Flex>
        )}
      </Shine>
    </Flex>
  )
}
