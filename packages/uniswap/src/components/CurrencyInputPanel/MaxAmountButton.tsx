import { SwapEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ComponentProps, memo, useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Text, TouchableArea, TouchableAreaEvent } from 'ui/src'
import { useMaxAmountSpend } from 'uniswap/src/features/gas/useMaxAmountSpend'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { MaxBalanceInfoModal } from 'uniswap/src/features/transactions/modals/MaxBalanceInfoModal'
import { TransactionType } from 'uniswap/src/features/transactions/types/transactionDetails'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'

interface MaxAmountButtonProps {
  currencyAmount: CurrencyAmount<Currency> | null | undefined
  currencyBalance: CurrencyAmount<Currency> | null | undefined
  onSetMax: (amount: string) => void
  currencyField: CurrencyField
  transactionType?: TransactionType
}

export function MaxAmountButton({
  currencyAmount,
  currencyBalance,
  onSetMax,
  currencyField,
  transactionType,
}: MaxAmountButtonProps): JSX.Element {
  const isNativeAsset = !!currencyAmount?.currency.isNative
  const [isShowingMaxNativeBalanceModal, setIsShowingMaxNativeBalanceModal] = useState(false)

  const maxInputAmount = useMaxAmountSpend({ currencyAmount: currencyBalance, txType: transactionType })

  // Disable max button if max already set or when balance is not sufficient
  const disableMaxButton =
    !maxInputAmount || !maxInputAmount.greaterThan(0) || currencyAmount?.toExact() === maxInputAmount.toExact()

  const maxInputAmountRef = useRef(maxInputAmount)
  maxInputAmountRef.current = maxInputAmount

  const onPress = useCallback(
    (event: TouchableAreaEvent): void => {
      event.stopPropagation()

      if (disableMaxButton) {
        if (isNativeAsset) {
          setIsShowingMaxNativeBalanceModal(true)
        }
        return
      }

      if (maxInputAmountRef.current) {
        // We use `maxInputAmountRef` instead of `maxInputAmount` so that we can get the latest value
        // and avoid this callback function having to depend on `maxInputAmount` because that would mean
        // it would recreate this function on every render (which would cause the button to re-render and ignore the `memo`).
        onSetMax(maxInputAmountRef.current.toExact())
      }
    },
    [disableMaxButton, onSetMax, isNativeAsset],
  )

  // We split this out into 2 components so it can be efficiently memoized.
  return (
    <MaxButtonContent
      isShowingMaxNativeBalanceModal={isShowingMaxNativeBalanceModal}
      disabled={disableMaxButton}
      currencyField={currencyField}
      isNativeAsset={isNativeAsset}
      setIsShowingMaxNativeBalanceModal={setIsShowingMaxNativeBalanceModal}
      onPress={onPress}
    />
  )
}

const MaxButtonContent = memo(function _MaxButtonContent({
  disabled,
  onPress,
  currencyField,
  isShowingMaxNativeBalanceModal,
  isNativeAsset,
  setIsShowingMaxNativeBalanceModal,
}: {
  disabled: boolean
  onPress: (event: TouchableAreaEvent) => void
  currencyField: CurrencyField
  isShowingMaxNativeBalanceModal: boolean
  isNativeAsset: boolean
  setIsShowingMaxNativeBalanceModal: (value: boolean) => void
}): JSX.Element {
  const { t } = useTranslation()

  const hoverStyle: {
    backgroundColor: ComponentProps<typeof TouchableArea>['backgroundColor']
  } = useMemo(() => ({ backgroundColor: disabled ? '$surface3' : '$accent2Hovered' }), [disabled])

  const handleMaxBalanceInfoModalClose = useCallback(() => {
    setIsShowingMaxNativeBalanceModal(false)
  }, [setIsShowingMaxNativeBalanceModal])

  return (
    <Trace
      logPress
      eventOnTrigger={SwapEventName.SWAP_MAX_TOKEN_AMOUNT_SELECTED}
      element={currencyField === CurrencyField.INPUT ? ElementName.SetMaxInput : ElementName.SetMaxOutput}
    >
      <MaxBalanceInfoModal
        // triggers on tap (mob)
        isModalOpen={isShowingMaxNativeBalanceModal}
        // triggers on hover (ext/web)
        isTooltipEnabled={isNativeAsset && disabled}
        onClose={handleMaxBalanceInfoModalClose}
      >
        <TouchableArea
          backgroundColor={disabled ? '$surface3' : '$accent2'}
          borderRadius="$rounded12"
          opacity={disabled ? 0.5 : 1}
          px="$spacing6"
          py="$spacing4"
          testID={currencyField === CurrencyField.INPUT ? TestID.SetMaxInput : TestID.SetMaxOutput}
          scaleTo={0.98}
          hoverStyle={hoverStyle}
          onPress={onPress}
        >
          <Text color={disabled ? '$neutral2' : '$accent1'} variant="buttonLabel4">
            {t('swap.button.max')}
          </Text>
        </TouchableArea>
      </MaxBalanceInfoModal>
    </Trace>
  )
})
