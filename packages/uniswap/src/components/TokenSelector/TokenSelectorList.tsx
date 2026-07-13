import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { GatedFeature, useIsFeatureGated } from '@universe/compliance'
import { memo, useCallback, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Flex, Text } from 'ui/src'
import { BridgedAssetModal } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import {
  TokenOptionItem as BaseTokenOptionItem,
  TokenContextMenuVariant,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import {
  OnchainItemListOptionType,
  RwaTokenOption,
  TokenOption,
  TokenSelectorListOption,
} from 'uniswap/src/components/lists/items/types'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { HorizontalTokenList } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'
import { StocksHorizontalRow } from 'uniswap/src/components/TokenSelector/lists/StocksHorizontalRow/StocksHorizontalRow'
import { tagRwaTokenSelectorSections } from 'uniswap/src/components/TokenSelector/tagRwaTokenSelectorSections'
import { useTokenSelectorHoverConfig } from 'uniswap/src/components/TokenSelector/TokenSelectorHoverConfig'
import { OnSelectCurrency, OnSelectRwaToken } from 'uniswap/src/components/TokenSelector/types'
import { formatIssuerLabel } from 'uniswap/src/data/rest/rwa/formatIssuerDisplaySymbol'
import { setHasSeenBridgingTooltip } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { CategoryTag } from 'uniswap/src/features/expandableAsset/CategoryTag'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useRwaIndex } from 'uniswap/src/features/search/SearchModal/stocks/useRwaIndex'
import { getTokenProtectionWarning, getTokenWarningSeverity } from 'uniswap/src/features/tokens/warnings/safetyUtils'
import {
  useDismissedBridgedAssetWarnings,
  useDismissedTokenWarnings,
} from 'uniswap/src/features/tokens/warnings/slice/hooks'
import TokenWarningModal from 'uniswap/src/features/tokens/warnings/TokenWarningModal'
import { NumberType } from 'utilities/src/format/types'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { useEvent } from 'utilities/src/react/hooks'
import { noop } from 'utilities/src/react/noop'

export function isStocksRowItem(data: TokenSelectorListOption): data is RwaTokenOption[] {
  return Array.isArray(data) && data[0]?.type === OnchainItemListOptionType.Rwa
}

/** A row shows its category tag (e.g. "Stocks") when it is a classified RWA AND the user holds no balance — per
 *  design, the balance overrides the tag (both share the row's single right-hand slot). */
export function shouldShowCategoryTag({
  rwaCategory,
  hasBalance,
}: {
  rwaCategory?: RwaCategory
  hasBalance: boolean
}): boolean {
  return rwaCategory != null && rwaCategory !== RwaCategory.UNSPECIFIED && !hasBalance
}

function isHorizontalListTokenItem(data: TokenSelectorListOption): data is TokenOption[] {
  return Array.isArray(data) && data[0]?.type === OnchainItemListOptionType.Token
}

const TokenOptionItem = memo(function TokenOptionItemInner({
  tokenOption,
  onSelectCurrency,
  section,
  index,
  showWarnings,
  showTokenAddress,
}: {
  tokenOption: TokenOption
  section: OnchainItemSection<TokenOption>
  index: number
  showWarnings: boolean
  showTokenAddress?: boolean
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const { currencyInfo } = tokenOption

  const onPress = useCallback(
    () => onSelectCurrency(currencyInfo, section, index),
    [index, onSelectCurrency, section, currencyInfo],
  )

  const dispatch = useDispatch()
  const onPressTokenOption = useCallback(() => {
    dispatch(setHasSeenBridgingTooltip(true))
    onPress()
  }, [dispatch, onPress])

  // Balance & quantity formatting
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()

  const tokenBalance = formatNumberOrString({
    value: tokenOption.quantity,
    type: NumberType.TokenTx,
  })
  const fiatBalance = convertFiatAmountFormatted(tokenOption.balanceUSD, NumberType.FiatTokenQuantity)

  const { isTestnetModeEnabled } = useEnabledChains()
  const balanceText = isTestnetModeEnabled ? tokenBalance : fiatBalance
  const quantityText = isTestnetModeEnabled ? undefined : tokenBalance

  // Token protection modal
  const severity = getTokenWarningSeverity(currencyInfo)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const tokenProtectionWarning = getTokenProtectionWarning(currencyInfo)
  const { tokenWarningDismissed } = useDismissedTokenWarnings(currencyInfo.currency, tokenProtectionWarning)
  const isBlocked = severity === WarningSeverity.Blocked
  const shouldShowWarningModalOnPress =
    showWarnings && (isBlocked || (severity !== WarningSeverity.None && !tokenWarningDismissed))

  const isBridgedAsset = Boolean(currencyInfo.isBridged)
  const [showBridgedAssetWarningModal, setShowBridgedAssetWarningModal] = useState(false)
  const { tokenWarningDismissed: bridgedAssetTokenWarningDismissed } = useDismissedBridgedAssetWarnings(
    currencyInfo.currency,
  )
  const shouldShowBridgedAssetWarningModalOnPress = showWarnings && isBridgedAsset && !bridgedAssetTokenWarningDismissed
  const hasWarningModals = shouldShowWarningModalOnPress || shouldShowBridgedAssetWarningModalOnPress

  const setWarningModalVisible = useCallback(
    (visible: boolean) => {
      // Handle token warning modal visibility as first priority
      if (shouldShowWarningModalOnPress) {
        setShowWarningModal(visible)
        return
      }

      // Handle bridged asset warning modal visibility
      setShowBridgedAssetWarningModal(visible)
    },
    [shouldShowWarningModalOnPress],
  )

  const onAcceptTokenWarning = useCallback(() => {
    // Handle token warning modal dismissal
    if (showWarningModal) {
      setShowWarningModal(false)

      // If the bridged asset warning modal should not be shown, proceed to the next step
      if (!shouldShowBridgedAssetWarningModalOnPress) {
        onPress()
      } else {
        setShowBridgedAssetWarningModal(true)
      }

      return
    }

    // Handle bridged asset warning modal dismissal
    if (showBridgedAssetWarningModal) {
      setShowBridgedAssetWarningModal(false)
      onPress()

      return
    }

    // No modals showing - proceed with action
    onPress()
  }, [onPress, showWarningModal, showBridgedAssetWarningModal, shouldShowBridgedAssetWarningModalOnPress])

  // Balance and the category tag share the row's single right-hand slot; a balance overrides the tag.
  const { rwaCategory } = tokenOption
  const hasBalance = Boolean(tokenOption.quantity && tokenOption.quantity !== 0)

  return (
    <BaseTokenOptionItem
      option={tokenOption}
      displayName={tokenOption.rwaName}
      issuerLabel={tokenOption.rwaIssuerSlug ? formatIssuerLabel(tokenOption.rwaIssuerSlug) : undefined}
      showTokenAddress={showTokenAddress}
      contextMenuVariant={TokenContextMenuVariant.TokenSelector}
      categoryTag={
        rwaCategory != null && shouldShowCategoryTag({ rwaCategory, hasBalance }) ? (
          <CategoryTag category={rwaCategory} />
        ) : undefined
      }
      rightElement={
        hasBalance ? (
          <Flex alignItems="flex-end">
            <Text variant="body1">{balanceText}</Text>
            {quantityText && (
              <Text color="$neutral2" variant="body3">
                {quantityText}
              </Text>
            )}
          </Flex>
        ) : undefined
      }
      showDisabled={Boolean((showWarnings && isBlocked) || tokenOption.isUnsupported)}
      modalInfo={{
        modal: showBridgedAssetWarningModal ? (
          <BridgedAssetModal
            currencyInfo0={currencyInfo}
            isOpen={showBridgedAssetWarningModal}
            onClose={(): void => setShowBridgedAssetWarningModal(false)}
            onContinue={onAcceptTokenWarning}
          />
        ) : (
          <TokenWarningModal
            currencyInfo0={currencyInfo}
            isVisible={showWarningModal}
            closeModalOnly={(): void => setShowWarningModal(false)}
            onAcknowledge={onAcceptTokenWarning}
          />
        ),
        modalShouldShow: hasWarningModals,
        modalSetIsOpen: setWarningModalVisible,
      }}
      onPress={onPressTokenOption}
    />
  )
})

interface TokenSelectorListProps {
  onSelectCurrency: OnSelectCurrency
  onSelectRwaToken?: OnSelectRwaToken
  sections?: OnchainItemSection<TokenSelectorListOption>[]
  chainFilter?: UniverseChainId | null
  showTokenWarnings: boolean
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  showTokenAddress?: boolean
  isKeyboardOpen?: boolean
  renderedInModal: boolean
}

function TokenSelectorListInner({
  onSelectCurrency,
  onSelectRwaToken,
  sections,
  chainFilter,
  showTokenWarnings,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  showTokenAddress,
  renderedInModal,
}: TokenSelectorListProps): JSX.Element {
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const wrapTokenRow = useTokenSelectorHoverConfig()

  // Tag tokenized-stock (RWA) rows so the inner row renders the category tag. `useRwaIndex` returns an empty
  // index (and skips the fetch) for RWA-blocked regions, so this is a no-op pass-through there.
  const isRwaRegionBlocked = useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)
  const rwaIndex = useRwaIndex(!isRwaRegionBlocked)
  const taggedSections = useMemo(() => tagRwaTokenSelectorSections({ sections, rwaIndex }), [sections, rwaIndex])

  usePerformanceLogger(DDRumManualTiming.TokenSelectorListRender, [chainFilter])

  const handleExpand = useEvent((item: TokenSelectorListOption) => {
    setExpandedItems((prev) => [...prev, key(item)])
  })

  const isExpandedItem = useEvent((item: TokenSelectorListOption) => {
    return expandedItems.includes(key(item))
  })

  const renderItem = useEvent(({ item, section, index }: ItemRowInfo<TokenSelectorListOption>): JSX.Element => {
    if (isStocksRowItem(item)) {
      return (
        <StocksHorizontalRow
          tokens={item}
          expanded={isExpandedItem(item)}
          onSelectRwaToken={onSelectRwaToken ?? noop}
          onExpand={handleExpand}
        />
      )
    }
    if (isHorizontalListTokenItem(item)) {
      return (
        <HorizontalTokenList
          tokens={item}
          section={section as OnchainItemSection<TokenOption[]>}
          index={index}
          expanded={isExpandedItem(item)}
          onSelectCurrency={onSelectCurrency}
          onExpand={handleExpand}
        />
      )
    }
    const tokenRow = (
      <TokenOptionItem
        index={index}
        section={section as OnchainItemSection<TokenOption>}
        showTokenAddress={showTokenAddress}
        showWarnings={showTokenWarnings}
        tokenOption={item}
        onSelectCurrency={onSelectCurrency}
      />
    )
    return wrapTokenRow ? wrapTokenRow(tokenRow, item.currencyInfo) : tokenRow
  })

  return (
    <SelectorBaseList
      renderItem={renderItem}
      sections={taggedSections}
      chainFilter={chainFilter}
      refetch={refetch}
      loading={loading}
      hasError={hasError}
      emptyElement={emptyElement}
      errorText={errorText}
      keyExtractor={key}
      expandedItems={expandedItems}
      renderedInModal={renderedInModal}
    />
  )
}

export function key(item: TokenSelectorListOption): string {
  if (isStocksRowItem(item)) {
    return item.map((option) => `${option.chainId}-${option.address}`).join('-')
  }
  if (isHorizontalListTokenItem(item)) {
    return item.map((token) => token.currencyInfo.currencyId).join('-')
  }
  // An empty list option (e.g. `[]`) matches neither guard above; return a safe key
  // rather than dereferencing `currencyInfo` on a non-existent row.
  if (Array.isArray(item)) {
    return ''
  }

  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(TokenSelectorListInner)
