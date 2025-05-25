import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, HeightAnimator, Separator, Text, TouchableArea, UniswapXText, isWeb } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { AnglesDownUp } from 'ui/src/components/icons/AnglesDownUp'
import { SortVertical } from 'ui/src/components/icons/SortVertical'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { AcrossLogo } from 'ui/src/components/logos/AcrossLogo'
import { WarningLabel, WarningWithStyle } from 'uniswap/src/components/modals/WarningModal/types'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/types'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import * as SwapDetailsRow from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapDetailsRow'
import {
  AcrossRoutingInfoTooltip,
  AutoSlippageBadge,
  BestRouteTooltip,
  BestRouteUniswapXTooltip,
  LargePriceDifferenceTooltip,
  MaxSlippageTooltip,
  SwapFeeOnTransferTooltip,
  YouReceiveDetailsTooltip,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips'
import { useSlippageSettings } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/slippage/useSlippageSettings'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import {
  UsePriceDifferenceReturnType,
  usePriceDifference,
} from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { slippageToleranceToPercent } from 'uniswap/src/features/transactions/swap/utils/format'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { isInterfaceDesktop } from 'utilities/src/platform'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

const ZERO_PERCENT = new Percent(0, 100)
const MAX_TOOLTIP_WIDTH = 300

function YouReceiveDisplay({
  isBridge,
  outputAmountUserWillReceive,
  formattedPostFeesAmount,
  priceDifference,
  feeOnTransferProps,
  isIndicative,
  isLoading,
  isLoadingIndicative,
  isOpen,
}: {
  isBridge: boolean
  outputAmountUserWillReceive: Maybe<CurrencyAmount<Currency>>
  formattedPostFeesAmount?: string
  priceDifference?: UsePriceDifferenceReturnType
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
  isIndicative: boolean
  isLoading: boolean
  isLoadingIndicative: boolean
  isOpen: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const ExpandoIcon = isOpen ? AnglesDownUp : SortVertical

  return (
    <SwapDetailsRow.Outer>
      <SwapDetailsRow.Label
        label={t('common.youReceive')}
        analyticsTitle="You receive"
        tooltip={
          isBridge ? (
            <AcrossRoutingInfoTooltip />
          ) : (
            <YouReceiveDetailsTooltip
              receivedAmount={formattedPostFeesAmount ?? '-'}
              feeOnTransferProps={feeOnTransferProps}
            />
          )
        }
      />
      <Flex row gap="$spacing6" alignItems="center">
        <SwapDetailsRow.ReceivingAmount
          amount={outputAmountUserWillReceive}
          formattedAmount={formattedPostFeesAmount}
          priceDifferenceWarning={priceDifference}
          isIndicative={isIndicative}
          isLoading={isLoading}
          feeOnTransferProps={feeOnTransferProps}
          isLoadingIndicative={isLoadingIndicative}
        />
        {isInterfaceDesktop && (
          <Flex rotate={isOpen ? '180deg' : '0deg'} animation="simple" transition="ease-in-out">
            <ExpandoIcon color="$neutral2" size="$icon.24" />
          </Flex>
        )}
      </Flex>
    </SwapDetailsRow.Outer>
  )
}

function FeeOnTransferDisplay({
  feeOnTransferProps,
}: {
  feeOnTransferProps?: FeeOnTransferFeeGroupProps
}): JSX.Element {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  return (
    <>
      {feeOnTransferProps?.inputTokenInfo.fee.greaterThan(0) && (
        <SwapDetailsRow.Outer>
          <SwapDetailsRow.Label
            label={t('swap.details.feeOnTransfer.symbol', {
              tokenSymbol: feeOnTransferProps.inputTokenInfo.tokenSymbol,
            })}
            analyticsTitle="Token fee (input)"
            tooltip={
              <SwapFeeOnTransferTooltip
                {...feeOnTransferProps}
                outputTokenInfo={{
                  ...feeOnTransferProps.outputTokenInfo,
                  fee: ZERO_PERCENT,
                }}
              />
            }
          />
          <Flex row gap="$spacing6" alignItems="center">
            <AlertTriangleFilled color="$neutral2" size="$icon.16" />
            <SwapDetailsRow.ValueLabel value={formatPercent(feeOnTransferProps.inputTokenInfo.fee.toFixed(8))} />
          </Flex>
        </SwapDetailsRow.Outer>
      )}
      {feeOnTransferProps?.outputTokenInfo.fee.greaterThan(0) && (
        <SwapDetailsRow.Outer>
          <SwapDetailsRow.Label
            analyticsTitle="Token fee (output)"
            label={t('swap.details.feeOnTransfer.symbol', {
              tokenSymbol: feeOnTransferProps.outputTokenInfo.tokenSymbol,
            })}
            tooltip={
              <SwapFeeOnTransferTooltip
                {...feeOnTransferProps}
                inputTokenInfo={{
                  ...feeOnTransferProps.inputTokenInfo,
                  fee: ZERO_PERCENT,
                }}
              />
            }
          />
          <Flex row gap="$spacing6" alignItems="center">
            <AlertTriangleFilled color="$neutral2" size="$icon.16" />
            <SwapDetailsRow.ValueLabel value={formatPercent(feeOnTransferProps.outputTokenInfo.fee.toFixed(8))} />
          </Flex>
        </SwapDetailsRow.Outer>
      )}
    </>
  )
}

function PriceDifferenceDisplay({
  priceDifference,
}: {
  priceDifference: UsePriceDifferenceReturnType
}): JSX.Element | null {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()

  if (!priceDifference.showPriceDifferenceWarning) {
    return null
  }

  return (
    <SwapDetailsRow.Outer>
      <SwapDetailsRow.Label
        label={t('large.price.difference')}
        analyticsTitle="Large price difference"
        tooltip={<LargePriceDifferenceTooltip />}
      />
      <Flex row gap="$spacing4" alignItems="center">
        <AlertTriangleFilled color={priceDifference.priceDifferenceColor} size="$icon.16" />
        <SwapDetailsRow.ValueLabel
          value={formatPercent(priceDifference.priceDifferencePercentage)}
          color={priceDifference.priceDifferenceColor}
        />
      </Flex>
    </SwapDetailsRow.Outer>
  )
}

function MaxSlippageDisplay({
  formattedPostFeesAmount,
  formattedMinimumAmount,
  formattedCurrentSlippageTolerance,
  autoSlippageEnabled,
}: {
  formattedPostFeesAmount?: string
  formattedMinimumAmount: string
  formattedCurrentSlippageTolerance: string
  autoSlippageEnabled: boolean
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <SwapDetailsRow.Outer>
      <SwapDetailsRow.Label
        label={t('settings.maxSlippage')}
        analyticsTitle="Max slippage"
        tooltip={
          <MaxSlippageTooltip
            receivedAmount={formattedPostFeesAmount ?? '-'}
            minimumAmount={formattedMinimumAmount}
            autoSlippageEnabled={autoSlippageEnabled}
            currentSlippageTolerance={formattedCurrentSlippageTolerance}
          />
        }
      />
      <Flex row gap="$spacing6" alignItems="center">
        {!autoSlippageEnabled && <AutoSlippageBadge />}
        <SwapDetailsRow.ValueLabel value={formattedCurrentSlippageTolerance} />
      </Flex>
    </SwapDetailsRow.Outer>
  )
}

function RouteDisplay({ isBridge, isUniswapXContext }: { isBridge: boolean; isUniswapXContext: boolean }): JSX.Element {
  const { t } = useTranslation()
  const tooltip = isBridge ? (
    <AcrossRoutingInfoTooltip />
  ) : isUniswapXContext ? (
    <BestRouteUniswapXTooltip />
  ) : (
    <BestRouteTooltip />
  )

  return (
    <SwapDetailsRow.Outer>
      <SwapDetailsRow.Label label={t('common.bestRoute')} analyticsTitle="Route" tooltip={tooltip} />
      {isBridge ? (
        <Flex row gap="$spacing6" alignItems="center">
          <AcrossLogo size="$icon.16" />
          <SwapDetailsRow.ValueLabel value="Across API" />
        </Flex>
      ) : isUniswapXContext ? (
        <Flex row gap="$spacing1">
          <UniswapX size="$icon.16" />
          <UniswapXText variant="body3">Uniswap X</UniswapXText>
        </Flex>
      ) : (
        <SwapDetailsRow.ValueLabel value="Uniswap API" />
      )}
    </SwapDetailsRow.Outer>
  )
}

function InlineWarningDisplay({ warning }: { warning: WarningWithStyle }): JSX.Element {
  return (
    <SwapDetailsRow.Outer>
      <Flex row gap="$spacing6" alignItems="center">
        {isWeb && (
          <InfoTooltip
            text={warning.warning.message}
            placement="top"
            maxWidth={MAX_TOOLTIP_WIDTH}
            trigger={<AlertTriangleFilled color="$neutral2" size="$icon.16" />}
          />
        )}
        <Text variant="body3" color="$neutral2">
          {warning.warning.title}
        </Text>
      </Flex>
    </SwapDetailsRow.Outer>
  )
}

export function YouReceiveDetails({
  isIndicative,
  isLoading,
  isLoadingIndicative,
  isBridge,
}: {
  isIndicative: boolean
  isLoading: boolean
  isLoadingIndicative: boolean
  isBridge: boolean
}): JSX.Element | null {
  const account = useAccountMeta()
  const { value: isOpen, toggle } = useBooleanState(false)
  const { formatPercent } = useLocalizationContext()

  const { currentSlippageTolerance } = useSlippageSettings()
  const { customSlippageTolerance } = useTransactionSettingsContext()
  const { derivedSwapInfo } = useSwapFormContext()
  const priceDifference = usePriceDifference(derivedSwapInfo)
  const { isBlocked } = useIsBlocked(account?.address)
  const { formScreenWarning } = useParsedSwapWarnings()
  const inlineWarning =
    formScreenWarning && formScreenWarning.displayedInline && !isBlocked ? formScreenWarning : undefined
  const isPriceImpactWarning =
    inlineWarning?.warning.type === WarningLabel.PriceImpactHigh ||
    inlineWarning?.warning.type === WarningLabel.PriceImpactMedium
  const feeOnTransferProps = useFeeOnTransferAmounts(derivedSwapInfo)
  const swapTxContext = useSwapTxContext()
  const isUniswapXContext = isUniswapX(swapTxContext)
  const receivedAmountPostFees = derivedSwapInfo.outputAmountUserWillReceive
    ? formatCurrencyAmount({
        amount: derivedSwapInfo.outputAmountUserWillReceive,
        locale: 'en-US',
        type: NumberType.TokenTx,
        placeholder: '',
      })
    : undefined

  const outputCurrency = derivedSwapInfo.currencies.output
  const formattedPostFeesAmount =
    outputCurrency && receivedAmountPostFees ? `${receivedAmountPostFees} ${outputCurrency.currency.symbol}` : undefined
  const minimumAmount = swapTxContext.trade?.minimumAmountOut(slippageToleranceToPercent(currentSlippageTolerance))
  const formattedMinimumAmount = `${formatCurrencyAmount({
    amount: minimumAmount,
    locale: 'en-US',
    type: NumberType.TokenTx,
    placeholder: '-',
  })} ${outputCurrency?.currency.symbol}`

  const formattedCurrentSlippageTolerance = formatPercent(currentSlippageTolerance)

  const showDropdown =
    derivedSwapInfo.wrapType === WrapType.NotApplicable &&
    !!derivedSwapInfo.currencies.output &&
    !!derivedSwapInfo.currencies.input &&
    derivedSwapInfo.exactCurrencyField &&
    derivedSwapInfo.currencyAmounts[derivedSwapInfo.exactCurrencyField]

  return (
    <TouchableArea
      transition="all 0.3s ease-in-out"
      maxHeight={showDropdown ? 300 : 0}
      opacity={showDropdown ? 1 : 0}
      mb={showDropdown ? '$spacing4' : '$none'}
      onPress={toggle}
    >
      <Flex
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        borderColor="$surface3"
        backgroundColor="$surface1"
        p="$spacing16"
        hoverStyle={{
          borderColor: '$surface3Hovered',
        }}
      >
        {inlineWarning && !isPriceImpactWarning ? (
          <InlineWarningDisplay warning={inlineWarning} />
        ) : (
          <YouReceiveDisplay
            isBridge={isBridge}
            outputAmountUserWillReceive={derivedSwapInfo.outputAmountUserWillReceive}
            formattedPostFeesAmount={formattedPostFeesAmount}
            priceDifference={priceDifference}
            feeOnTransferProps={feeOnTransferProps}
            isIndicative={isIndicative}
            isLoading={isLoading}
            isLoadingIndicative={isLoadingIndicative}
            isOpen={isOpen}
          />
        )}
        <HeightAnimator open={isOpen}>
          <Separator my="$spacing16" />
          <Flex gap="$spacing12">
            <FeeOnTransferDisplay feeOnTransferProps={feeOnTransferProps} />
            <PriceDifferenceDisplay priceDifference={priceDifference} />
            {!isBridge && (
              <MaxSlippageDisplay
                formattedPostFeesAmount={formattedPostFeesAmount}
                formattedMinimumAmount={formattedMinimumAmount}
                formattedCurrentSlippageTolerance={formattedCurrentSlippageTolerance}
                autoSlippageEnabled={!customSlippageTolerance}
              />
            )}
            {swapTxContext.trade && <RouteDisplay isBridge={isBridge} isUniswapXContext={isUniswapXContext} />}
          </Flex>
        </HeightAnimator>
      </Flex>
    </TouchableArea>
  )
}
