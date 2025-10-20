import { memo, useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Text } from 'ui/src'
import { BridgedAssetModal } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { checkIsBridgedAsset } from 'uniswap/src/components/BridgedAsset/utils'
import {
  TokenOptionItem as BaseTokenOptionItem,
  TokenContextMenuVariant,
} from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { TokenOption, TokenSelectorOption } from 'uniswap/src/components/lists/items/types'
import { ItemRowInfo } from 'uniswap/src/components/lists/OnchainItemList/OnchainItemList'
import type { OnchainItemSection } from 'uniswap/src/components/lists/OnchainItemList/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { HorizontalTokenList } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { setHasSeenBridgingTooltip } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { useDismissedBridgedAssetWarnings, useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { CurrencyId } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { useEvent } from 'utilities/src/react/hooks'

function isHorizontalListTokenItem(data: TokenSelectorOption): data is TokenOption[] {
  return Array.isArray(data)
}

const TokenOptionItem = memo(function _TokenOptionItem({
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
  const fiatBalance = convertFiatAmountFormatted(tokenOption.balanceUSD, NumberType.FiatTokenPrice)

  const { isTestnetModeEnabled } = useEnabledChains()
  const balanceText = isTestnetModeEnabled ? tokenBalance : fiatBalance
  const quantityText = isTestnetModeEnabled ? undefined : tokenBalance

  // Token protection modal
  const severity = getTokenWarningSeverity(currencyInfo)
  const [showWarningModal, setShowWarningModal] = useState(false)
  const { tokenWarningDismissed } = useDismissedTokenWarnings(currencyInfo.currency)
  const isBlocked = severity === WarningSeverity.Blocked
  const shouldShowWarningModalOnPress =
    showWarnings && (isBlocked || (severity !== WarningSeverity.None && !tokenWarningDismissed))

  const isBridgedAsset = checkIsBridgedAsset(currencyInfo)
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

  return (
    <BaseTokenOptionItem
      option={tokenOption}
      showTokenAddress={showTokenAddress}
      contextMenuVariant={TokenContextMenuVariant.TokenSelector}
      rightElement={
        tokenOption.quantity && tokenOption.quantity !== 0 ? (
          <>
            <Text variant="body1">{balanceText}</Text>
            {quantityText && (
              <Text color="$neutral2" variant="body3">
                {quantityText}
              </Text>
            )}
          </>
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
  sections?: OnchainItemSection<TokenSelectorOption>[]
  chainFilter?: UniverseChainId | null
  showTokenWarnings: boolean
  refetch?: () => void
  loading?: boolean
  hasError?: boolean
  emptyElement?: JSX.Element
  errorText?: string
  showTokenAddress?: boolean
  isKeyboardOpen?: boolean
}

function _TokenSelectorList({
  onSelectCurrency,
  sections,
  chainFilter,
  showTokenWarnings,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  showTokenAddress,
}: TokenSelectorListProps): JSX.Element {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  usePerformanceLogger(DDRumManualTiming.TokenSelectorListRender, [chainFilter])

  const handleExpand = useEvent((item: TokenSelectorOption) => {
    setExpandedItems((prev) => [...prev, key(item)])
  })

  const isExpandedItem = useEvent((item: TokenOption[]) => {
    return expandedItems.includes(key(item))
  })

  const renderItem = useEvent(({ item, section, index }: ItemRowInfo<TokenSelectorOption>): JSX.Element => {
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
    return (
      <TokenOptionItem
        index={index}
        section={section as OnchainItemSection<TokenOption>}
        showTokenAddress={showTokenAddress}
        showWarnings={showTokenWarnings}
        tokenOption={item}
        onSelectCurrency={onSelectCurrency}
      />
    )
  })

  return (
    <SelectorBaseList
      renderItem={renderItem}
      sections={sections}
      chainFilter={chainFilter}
      refetch={refetch}
      loading={loading}
      hasError={hasError}
      emptyElement={emptyElement}
      errorText={errorText}
      keyExtractor={key}
      expandedItems={expandedItems}
    />
  )
}

function key(item: TokenSelectorOption): CurrencyId {
  if (isHorizontalListTokenItem(item)) {
    return item.map((token) => token.currencyInfo.currencyId).join('-')
  }

  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(_TokenSelectorList)
