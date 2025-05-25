import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { ReactNode, useEffect, useMemo, useRef } from 'react'
import { Flex, Text, TextProps, isWeb } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes, zIndexes } from 'ui/src/theme'
import { useRefetchAnimationStyle } from 'uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/types'
import {
  LargePriceDifferenceTooltip,
  SwapFeeOnTransferTooltip,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips'
import { UsePriceDifferenceReturnType } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'

const Outer = ({ children }: { children: ReactNode }): JSX.Element => {
  return (
    <Flex row justifyContent="space-between">
      {children}
    </Flex>
  )
}

const Label = ({
  label,
  tooltip,
  analyticsTitle,
}: {
  label: string
  tooltip: ReactNode
  analyticsTitle: string
}): JSX.Element => {
  return (
    <Flex row gap="$spacing4" alignItems="center">
      <Text variant="body3" color="$neutral2">
        {label}
      </Text>
      {isWeb && (
        <WarningInfo
          tooltipProps={{
            text: tooltip,
            placement: 'top',
            maxWidth: 300,
          }}
          trigger={<InfoCircleFilled color="$neutral3" size={iconSizes.icon12} />}
          // doesn't matter for web, but required prop
          modalProps={{
            modalName: ModalName.SwapWarning,
            zIndex: zIndexes.popover,
          }}
          analyticsTitle={analyticsTitle}
        />
      )}
    </Flex>
  )
}

const ValueLabel = ({ value, color = '$neutral1' }: { value: string; color?: TextProps['color'] }): JSX.Element => {
  return (
    <Text variant="body3" color={color}>
      {value}
    </Text>
  )
}

type PanelTextDisplay = {
  value: string | undefined
  color: '$neutral1' | '$neutral3'
}

function useIndicativeTextDisplay({
  currencyAmount,
  isLoading,
  value,
  valueIsIndicative,
}: {
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  isLoading: boolean
  value?: string
  valueIsIndicative: boolean
}): PanelTextDisplay {
  const lastDisplayRef = useRef<PanelTextDisplay>({
    value: undefined,
    color: '$neutral3',
  })
  const hasInput = Boolean(isLoading || currencyAmount)
  // Clear the lastDisplayRef if input is cleared, so that it is not used upon subsequent input
  useEffect(() => {
    if (!hasInput) {
      lastDisplayRef.current = { value: undefined, color: '$neutral3' }
    }
  }, [hasInput])
  return useMemo(() => {
    if (!value) {
      return hasInput ? lastDisplayRef.current : { value, color: '$neutral3' }
    }
    const color = valueIsIndicative ? '$neutral3' : '$neutral1'
    const display = { value, color } as const
    lastDisplayRef.current = display
    return display
  }, [value, hasInput, valueIsIndicative])
}

const ReceivingAmount = ({
  amount,
  formattedAmount,
  priceDifferenceWarning,
  isIndicative = false,
  isLoading = false,
  feeOnTransferProps,
  isLoadingIndicative,
}: {
  amount: Maybe<CurrencyAmount<Currency>>
  formattedAmount?: string
  priceDifferenceWarning?: UsePriceDifferenceReturnType
  isIndicative?: boolean
  isLoading?: boolean
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
  isLoadingIndicative?: boolean
}): JSX.Element => {
  const hasFeeOnTransfer =
    feeOnTransferProps &&
    (feeOnTransferProps?.inputTokenInfo.fee.greaterThan(0) || feeOnTransferProps?.outputTokenInfo.fee.greaterThan(0))
  const { value: userReceivesOutputAmount, color: userReceivesOutputAmountColor } = useIndicativeTextDisplay({
    currencyAmount: amount,
    isLoading,
    value: formattedAmount,
    valueIsIndicative: isIndicative,
  })

  const priceDifferenceWarningColor = priceDifferenceWarning?.priceDifferenceColor

  const refetchAnimationStyle = useRefetchAnimationStyle({
    currencyAmount: amount,
    isLoading,
    isIndicativeLoading: isLoadingIndicative,
    valueIsIndicative: isIndicative,
  })

  return (
    <WarningInfo
      tooltipProps={{
        enabled: hasFeeOnTransfer || priceDifferenceWarning?.showPriceDifferenceWarning,
        text: hasFeeOnTransfer ? (
          <SwapFeeOnTransferTooltip {...feeOnTransferProps} />
        ) : priceDifferenceWarning?.showPriceDifferenceWarning ? (
          <LargePriceDifferenceTooltip />
        ) : null,
        placement: 'top',
        maxWidth: 300,
      }}
      modalProps={{
        modalName: ModalName.SwapWarning,
        severity: hasFeeOnTransfer ? WarningSeverity.Medium : WarningSeverity.High,
        rejectText: 'Close',
        zIndex: zIndexes.popover,
      }}
      trigger={
        <AnimatedFlex row gap="$spacing4" alignItems="center" style={refetchAnimationStyle}>
          {(hasFeeOnTransfer || priceDifferenceWarning?.showPriceDifferenceWarning) && (
            <AlertTriangleFilled color={priceDifferenceWarningColor ?? 'neutral2'} size="$icon.16" />
          )}
          <Text variant="body3" color={priceDifferenceWarningColor ?? userReceivesOutputAmountColor}>
            {userReceivesOutputAmount}
          </Text>
        </AnimatedFlex>
      }
    />
  )
}

export { Label, Outer, ReceivingAmount, ValueLabel }
