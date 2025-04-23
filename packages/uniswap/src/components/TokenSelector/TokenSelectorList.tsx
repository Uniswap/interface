import { memo, useCallback, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Text } from 'ui/src'
import { HorizontalTokenList } from 'uniswap/src/components/TokenSelector/lists/HorizontalTokenList/HorizontalTokenList'
import { OnSelectCurrency, TokenSection } from 'uniswap/src/components/TokenSelector/types'
import { SelectorBaseList } from 'uniswap/src/components/lists/SelectorBaseList'
import { ItemRowInfo } from 'uniswap/src/components/lists/TokenSectionBaseList/TokenSectionBaseList'
import { TokenOptionItem as BaseTokenOptionItem } from 'uniswap/src/components/lists/items/tokens/TokenOptionItem'
import { TokenOption, TokenSelectorItemTypes } from 'uniswap/src/components/lists/types'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { setHasSeenBridgingTooltip } from 'uniswap/src/features/behaviorHistory/slice'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import TokenWarningModal from 'uniswap/src/features/tokens/TokenWarningModal'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import { CurrencyId } from 'uniswap/src/types/currency'
import { NumberType } from 'utilities/src/format/types'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'

function isHorizontalListTokenItem(data: TokenSelectorItemTypes): data is TokenOption[] {
  return Array.isArray(data)
}

const TokenOptionItem = memo(function _TokenOptionItem({
  tokenOption,
  onSelectCurrency,
  section,
  index,
  showWarnings,
  showTokenAddress,
  isKeyboardOpen,
}: {
  tokenOption: TokenOption
  section: TokenSection<TokenOption>
  index: number
  showWarnings: boolean
  showTokenAddress?: boolean
  isKeyboardOpen?: boolean
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const { currencyInfo } = tokenOption
  const searchRevampEnabled = useFeatureFlag(FeatureFlags.SearchRevamp)

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
  const shouldShowWarningModalOnPress = isBlocked || (severity !== WarningSeverity.None && !tokenWarningDismissed)

  const onAcceptTokenWarning = useCallback(() => {
    setShowWarningModal(false)
    onPress()
  }, [onPress])

  const legacyTokenOptionItemProps = {
    balance: balanceText,
    isKeyboardOpen,
    quantity: tokenOption.quantity,
    quantityFormatted: quantityText,
    showWarnings,
    tokenWarningDismissed,
  }

  return (
    <BaseTokenOptionItem
      option={tokenOption}
      showTokenAddress={showTokenAddress}
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
        modal: (
          <TokenWarningModal
            currencyInfo0={currencyInfo}
            isVisible={showWarningModal}
            closeModalOnly={(): void => setShowWarningModal(false)}
            onAcknowledge={onAcceptTokenWarning}
          />
        ),
        modalShouldShow: showWarnings && shouldShowWarningModalOnPress,
        modalSetIsOpen: setShowWarningModal,
      }}
      onPress={onPressTokenOption}
      {...(!searchRevampEnabled && legacyTokenOptionItemProps)} // TODO: clean up legacy token selector variables
    />
  )
})

interface TokenSelectorListProps {
  onSelectCurrency: OnSelectCurrency
  sections?: TokenSection<TokenSelectorItemTypes>[]
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
  isKeyboardOpen,
  refetch,
  loading,
  hasError,
  emptyElement,
  errorText,
  showTokenAddress,
}: TokenSelectorListProps): JSX.Element {
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  usePerformanceLogger(DDRumManualTiming.TokenSelectorListRender, [chainFilter])

  const handleExpand = useCallback(
    (item: TokenSelectorItemTypes) => {
      setExpandedItems((prev) => [...prev, key(item)])
    },
    [setExpandedItems],
  )

  const isExpandedItem = useCallback(
    (item: TokenOption[]) => {
      return expandedItems.includes(key(item))
    },
    [expandedItems],
  )

  const renderItem = useCallback(
    ({ item, section, index }: ItemRowInfo<TokenSelectorItemTypes>) => {
      if (isHorizontalListTokenItem(item)) {
        return (
          <HorizontalTokenList
            tokens={item}
            section={section as TokenSection<TokenOption[]>}
            index={index}
            expanded={isExpandedItem(item)}
            onSelectCurrency={onSelectCurrency}
            onExpand={() => handleExpand(item)}
          />
        )
      }
      return (
        <TokenOptionItem
          index={index}
          isKeyboardOpen={isKeyboardOpen}
          section={section as TokenSection<TokenOption>}
          showTokenAddress={showTokenAddress}
          showWarnings={showTokenWarnings}
          tokenOption={item}
          onSelectCurrency={onSelectCurrency}
        />
      )
    },
    [onSelectCurrency, showTokenAddress, showTokenWarnings, isKeyboardOpen, handleExpand, isExpandedItem],
  )

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

function key(item: TokenSelectorItemTypes): CurrencyId {
  if (isHorizontalListTokenItem(item)) {
    return item.map((token) => token.currencyInfo.currencyId).join('-')
  }

  return item.currencyInfo.currencyId
}

export const TokenSelectorList = memo(_TokenSelectorList)
