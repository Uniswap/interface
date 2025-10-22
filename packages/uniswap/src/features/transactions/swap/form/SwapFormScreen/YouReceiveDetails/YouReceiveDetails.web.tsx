import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Percent } from '@uniswap/sdk-core'
import { useTranslation } from 'react-i18next'
import { Flex, HeightAnimator, Separator, Text, TouchableArea, UniswapXText } from 'ui/src'
import { AlertTriangleFilled } from 'ui/src/components/icons/AlertTriangleFilled'
import { AnglesDownUp } from 'ui/src/components/icons/AnglesDownUp'
import { SortVertical } from 'ui/src/components/icons/SortVertical'
import { AnimatedUniswapX } from 'ui/src/components/icons/UniswapX'
import { AcrossLogo } from 'ui/src/components/logos/AcrossLogo'
import type { WarningWithStyle } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningLabel } from 'uniswap/src/components/modals/WarningModal/types'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { isSVMChain } from 'uniswap/src/features/platforms/utils/chains'
import { useSlippageSettings } from 'uniswap/src/features/transactions/components/settings/settingsConfigurations/slippage/useSlippageSettings'
import { useTransactionSettingsStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { AcrossRoutingInfoTooltip } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/AcrossRoutingTooltip'
import {
  BestRouteTooltip,
  BestRouteUniswapXTooltip,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/BestRouteTooltip'
import { SwapFeeOnTransferTooltip } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/FeeDetailsTooltip'
import { LargePriceDifferenceTooltip } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/LargePriceDifferenceTooltip'
import {
  AutoSlippageBadge,
  MaxSlippageTooltip,
} from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/MaxSlippageTooltip'
import { YouReceiveDetailsTooltip } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormTooltips/YouReceiveDetailsTooltip'
import { SwapDetailsRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/YouReceiveDetails/SwapDetailsRow'
import type { YouReceiveDetailsProps } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/YouReceiveDetails/YouReceiveDetails'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import type { UsePriceDifferenceReturnType } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/hooks/usePriceDifference'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import type { FeeOnTransferFeeGroupProps } from 'uniswap/src/features/transactions/TransactionDetails/types'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { useIsBlocked } from 'uniswap/src/features/trm/hooks'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'
// biome-ignore lint/style/noRestrictedImports: legacy import will be migrated
import { formatCurrencyAmount } from 'utilities/src/format/localeBased'
import { NumberType } from 'utilities/src/format/types'
import { isWebAppDesktop, isWebPlatform } from 'utilities/src/platform'
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
        {isWebAppDesktop && (
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
  currentSlippageTolerance,
  autoSlippageEnabled,
}: {
  formattedPostFeesAmount?: string
  formattedMinimumAmount: string
  currentSlippageTolerance: number
  autoSlippageEnabled: boolean
}): JSX.Element {
  const { t } = useTranslation()

  const formatter = useLocalizationContext()
  const { formatPercent } = formatter

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
            currentSlippageTolerance={formatPercent(currentSlippageTolerance)}
          />
        }
      />
      <Flex row gap="$spacing6" alignItems="center">
        {autoSlippageEnabled && <AutoSlippageBadge />}
        <SwapDetailsRow.ValueLabel
          value={currentSlippageTolerance === 0 ? t('common.none') : formatPercent(currentSlippageTolerance)}
        />
      </Flex>
    </SwapDetailsRow.Outer>
  )
}

function RouteDisplay({
  isBridge,
  isUniswapXContext,
  loading,
}: {
  isBridge: boolean
  isUniswapXContext: boolean
  loading: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const trade = useSwapTxStore((s) => s.trade)

  const routingProvider = useRoutingProvider({ routing: trade?.routing })

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
          <SwapDetailsRow.ValueLabel color={loading ? '$neutral2' : '$neutral1'} value="Across API" />
        </Flex>
      ) : isUniswapXContext ? (
        <Flex row gap="$spacing1">
          <AnimatedUniswapX size="$icon.16" opacity={loading ? 0 : 1} animation="simple" />
          <UniswapXText variant="body3" color={loading ? '$neutral2' : undefined}>
            Uniswap X
          </UniswapXText>
        </Flex>
      ) : (
        <Flex row gap="$spacing6" alignItems="center">
          {routingProvider?.icon && <routingProvider.icon size="$icon.16" color={routingProvider.iconColor} />}
          <SwapDetailsRow.ValueLabel color={loading ? '$neutral2' : '$neutral1'} value={routingProvider?.name ?? ''} />
        </Flex>
      )}
    </SwapDetailsRow.Outer>
  )
}

function InlineWarningDisplay({ warning }: { warning: WarningWithStyle }): JSX.Element {
  return (
    <SwapDetailsRow.Outer>
      <Flex row gap="$spacing6" alignItems="center">
        {isWebPlatform && (
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
}: YouReceiveDetailsProps): JSX.Element | null {
  const { value: isOpen, toggle } = useBooleanState(false)

  const { currentSlippageTolerance } = useSlippageSettings()
  const { customSlippageTolerance } = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
  }))
  const derivedSwapInfo = useSwapFormStore((s) => s.derivedSwapInfo)
  const priceDifference = usePriceDifference(derivedSwapInfo)

  const wallet = useWallet()
  const account = isSVMChain(derivedSwapInfo.chainId) ? wallet.svmAccount?.address : wallet.evmAccount?.address
  const { isBlocked } = useIsBlocked(account)

  const { formScreenWarning } = useParsedSwapWarnings()
  const inlineWarning =
    formScreenWarning && formScreenWarning.displayedInline && !isBlocked ? formScreenWarning : undefined
  const isPriceImpactWarning =
    inlineWarning?.warning.type === WarningLabel.PriceImpactHigh ||
    inlineWarning?.warning.type === WarningLabel.PriceImpactMedium
  const feeOnTransferProps = useFeeOnTransferAmounts(derivedSwapInfo)
  const isUniswapXContext = useSwapTxStore((s) => isUniswapX({ routing: s.routing }))
  const trade = useSwapTxStore((s) => s.trade)
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
  const minimumAmount = trade?.minAmountOut
  const formattedMinimumAmount = `${formatCurrencyAmount({
    amount: minimumAmount,
    locale: 'en-US',
    type: NumberType.TokenTx,
    placeholder: '-',
  })} ${outputCurrency?.currency.symbol}`

  const showDropdown =
    derivedSwapInfo.wrapType === WrapType.NotApplicable &&
    !!derivedSwapInfo.currencies.output &&
    !!derivedSwapInfo.currencies.input &&
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
                currentSlippageTolerance={currentSlippageTolerance}
                autoSlippageEnabled={!customSlippageTolerance}
              />
            )}
            <RouteDisplay isBridge={isBridge} isUniswapXContext={isUniswapXContext} loading={!trade} />
          </Flex>
        </HeightAnimator>
      </Flex>
    </TouchableArea>
  )
}
