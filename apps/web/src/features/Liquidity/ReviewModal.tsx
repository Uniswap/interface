import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount, Price, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Flex, Separator, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { replaceSeparators } from 'uniswap/src/components/AmountInput/utils/replaceSeparators'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { DetailLineItem } from '~/components/DetailLineItem'
import { ErrorCallout } from '~/components/ErrorCallout'
import { DoubleCurrencyLogo } from '~/components/Logo/DoubleLogo'
import { MouseoverTooltip } from '~/components/Tooltip'
import { BaseQuoteFiatAmount } from '~/features/Liquidity/BaseQuoteFiatAmount'
import {
  getLiquidityRangeChartProps,
  WrappedLiquidityPositionRangeChart,
} from '~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { PoolOutOfSyncError } from '~/features/Liquidity/Create/PoolOutOfSyncError'
import { useSelectedFeeBreakdown } from '~/features/Liquidity/hooks/useSelectedFeeBreakdown'
import { LiquidityPositionInfoBadges } from '~/features/Liquidity/LiquidityPositionInfoBadges'
import { LowLPSlippageWarning } from '~/features/Liquidity/LowLPSlippageWarning'
import { PartialMigrationWarning } from '~/features/Liquidity/PartialMigrationWarning'
import { getBaseAndQuoteCurrencies } from '~/features/Liquidity/utils/currency'
import { getTickToPrice, getV4TickToPrice } from '~/features/Liquidity/utils/getTickToPrice'
import { getTicksAtLimit } from '~/features/Liquidity/utils/priceRangeInfo'
import { useCurrencyInfo } from '~/hooks/Tokens'
import { useAccount } from '~/hooks/useAccount'
import { useCreateLiquidityContext } from '~/pages/CreatePosition/CreateLiquidityContextProvider'
import { CurrencyAmountMap } from '~/types/liquidity'
import { PositionField } from '~/types/position'

export interface ReviewModalProps {
  modalName: ModalNameType
  headerTitle: string
  depositText?: string
  confirmButtonText: string
  formattedAmounts?: { [field in PositionField]?: string }
  currencyAmounts?: CurrencyAmountMap
  currencyAmountsUSDValue?: CurrencyAmountMap
  feeAmounts?: CurrencyAmountMap
  refundedAmounts?: CurrencyAmountMap
  isDisabled?: boolean
  gasFeeEstimateUSD?: Maybe<CurrencyAmount<Currency>>
  transactionError: string | boolean
  steps: TransactionStep[]
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

function TokenInfo({
  formattedAmount,
  currencyAmount,
  currencyUSDAmount,
  logoUrl,
}: {
  formattedAmount?: Maybe<string>
  currencyAmount: Maybe<CurrencyAmount<Currency>>
  currencyUSDAmount: Maybe<CurrencyAmount<Currency>>
  logoUrl: Maybe<string>
}) {
  const { formatCurrencyAmount } = useLocalizationContext()
  const { decimalSeparator } = useAppFiatCurrencyInfo()

  const displayAmount = formattedAmount
    ? replaceSeparators({
        value: formattedAmount,
        decimalSeparator: '.',
        decimalOverride: decimalSeparator,
      })
    : formatCurrencyAmount({ value: currencyAmount, type: NumberType.TokenTx })

  return (
    currencyAmount &&
    currencyAmount.greaterThan(0) && (
      <Flex row justifyContent="space-between" gap="$gap8">
        <Flex gap="$gap4" flex={1} minWidth={0}>
          <MouseoverTooltip text={`${displayAmount} ${currencyAmount.currency.symbol}`} placement="top">
            <Flex row gap="$gap8" minWidth={0}>
              <Text variant="body1" numberOfLines={1} ellipsizeMode="tail">
                {displayAmount}
              </Text>
              <Text variant="body1" flexShrink={0}>
                {currencyAmount.currency.symbol}
              </Text>
            </Flex>
          </MouseoverTooltip>
          <Text variant="body3" color="$neutral2">
            {formatCurrencyAmount({ value: currencyUSDAmount, type: NumberType.FiatTokenPrice })}
          </Text>
        </Flex>
        <TokenLogo
          size={iconSizes.icon36}
          chainId={currencyAmount.currency.chainId}
          name={currencyAmount.currency.name}
          symbol={currencyAmount.currency.symbol}
          url={logoUrl}
        />
      </Flex>
    )
  )
}

// oxlint-disable-next-line complexity
export function ReviewModal({
  modalName,
  headerTitle,
  depositText,
  confirmButtonText,
  formattedAmounts,
  currencyAmounts,
  currencyAmountsUSDValue,
  feeAmounts,
  refundedAmounts,
  isDisabled,
  gasFeeEstimateUSD,
  transactionError,
  steps,
  isOpen,
  onClose,
  onConfirm,
}: ReviewModalProps) {
  const { t } = useTranslation()
  const {
    currencies,
    protocolVersion,
    creatingPoolOrPair,
    positionState: { fee, hook },
    protocolFee,
    currentTransactionStep,
    price,
    poolOrPair,
    ticks,
    priceRangeState: { priceInverted, fullRange, minTick, maxTick },
    refetch,
  } = useCreateLiquidityContext()

  const token0 = currencyAmounts?.TOKEN0?.currency
  const token1 = currencyAmounts?.TOKEN1?.currency
  const token0CurrencyInfo = useCurrencyInfo(token0)
  const token1CurrencyInfo = useCurrencyInfo(token1)
  const chainId = token0?.chainId

  // Breakdown for the fee badge below the pair header, from the context's served protocol fee (existing
  // pool) or the curve (not-yet-created vanilla v4). Shared with the select step and edit summary.
  const feeBreakdown = useSelectedFeeBreakdown({ protocolVersion, fee, servedProtocolFee: protocolFee, hook })

  const { formatNumberOrString, formatCurrencyAmount } = useLocalizationContext()

  const { baseCurrency, quoteCurrency } = getBaseAndQuoteCurrencies(currencies.sdk, priceInverted)

  const ticksAtLimit = useMemo(() => {
    return getTicksAtLimit({
      tickSpacing: fee?.tickSpacing,
      lowerTick: minTick,
      upperTick: maxTick,
      fullRange,
    })
  }, [fee?.tickSpacing, minTick, maxTick, fullRange])

  const pricesAtTicks: [Maybe<Price<Currency, Currency>>, Maybe<Price<Currency, Currency>>] = useMemo(() => {
    // oxlint-disable-next-line no-shadow
    let pricesAtTicks: [Maybe<Price<Currency, Currency>>, Maybe<Price<Currency, Currency>>] = [undefined, undefined]
    if (protocolVersion === ProtocolVersion.V4) {
      pricesAtTicks = [
        getV4TickToPrice({ baseCurrency, quoteCurrency, tick: ticks[0] }),
        getV4TickToPrice({ baseCurrency, quoteCurrency, tick: ticks[1] }),
      ]
    }

    if (protocolVersion === ProtocolVersion.V3) {
      pricesAtTicks = [
        getTickToPrice({ baseToken: baseCurrency as Token, quoteToken: quoteCurrency as Token, tick: ticks[0] }),
        getTickToPrice({ baseToken: baseCurrency as Token, quoteToken: quoteCurrency as Token, tick: ticks[1] }),
      ]
    }

    return priceInverted ? [pricesAtTicks[1], pricesAtTicks[0]] : pricesAtTicks
  }, [ticks, baseCurrency, quoteCurrency, protocolVersion, priceInverted])

  const formattedPrices = useMemo(() => {
    const minPrice = pricesAtTicks[0]
    const maxPrice = pricesAtTicks[1]

    const lowerPriceFormatted = ticksAtLimit[0]
      ? '0'
      : formatNumberOrString({ value: minPrice?.toSignificant(), type: NumberType.TokenTx })

    const upperPriceFormatted = ticksAtLimit[1]
      ? '∞'
      : formatNumberOrString({ value: maxPrice?.toSignificant(), type: NumberType.TokenTx })

    const postfix = `${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`
    return [`${lowerPriceFormatted} ${postfix}`, `${upperPriceFormatted} ${postfix}`]
  }, [formatNumberOrString, pricesAtTicks, ticksAtLimit, baseCurrency, quoteCurrency])

  const connectedAccount = useAccount()
  const { isSignedInWithPasskey, isSessionAuthenticated, needsPasskeySignin } = useGetPasskeyAuthStatus(
    connectedAccount.connector?.id,
  )

  const liquidityRangeChartProps = useMemo(
    () =>
      getLiquidityRangeChartProps({
        protocolVersion,
        sdkCurrencies: {
          TOKEN0: currencyAmounts?.TOKEN0?.currency,
          TOKEN1: currencyAmounts?.TOKEN1?.currency,
        },
        ticks,
        poolOrPair,
        pricesAtTicks,
        priceInverted,
      }),
    [protocolVersion, currencyAmounts, priceInverted, ticks, pricesAtTicks, poolOrPair],
  )

  const refundedToken0USD = useUSDCValue(refundedAmounts?.TOKEN0)
  const refundedToken1USD = useUSDCValue(refundedAmounts?.TOKEN1)

  return (
    <Modal name={modalName} padding="$none" onClose={onClose} isDismissible isModalOpen={isOpen}>
      <Flex px="$spacing8" pt="$spacing12" pb="$spacing8" gap="$spacing24">
        <Flex px="$spacing12">
          <Flex row justifyContent="space-between" alignItems="center" width="100%">
            <Text variant="subheading2" color="$neutral2">
              {headerTitle}
            </Text>
            <GetHelpHeader
              width="auto"
              closeDataTestId={TestID.LiquidityModalHeaderClose}
              closeModal={() => onClose()}
            />
          </Flex>
          <Flex py="$spacing12" gap="$spacing12" mt="$spacing16">
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex>
                <Flex row gap="$gap8">
                  <Text variant="heading3">{currencyAmounts?.TOKEN0?.currency.symbol}</Text>
                  <Text variant="heading3">/</Text>
                  <Text variant="heading3">{currencyAmounts?.TOKEN1?.currency.symbol}</Text>
                </Flex>
                <Flex row gap={2} alignItems="center">
                  <LiquidityPositionInfoBadges
                    size="small"
                    version={protocolVersion}
                    v4hook={hook}
                    chainId={chainId as UniverseChainId | undefined}
                    feeTier={fee}
                    feeBreakdown={feeBreakdown}
                  />
                </Flex>
              </Flex>
              <DoubleCurrencyLogo
                currencies={[currencyAmounts?.TOKEN0?.currency, currencyAmounts?.TOKEN1?.currency]}
                size={iconSizes.icon36}
              />
            </Flex>
            {(protocolVersion === ProtocolVersion.V3 || protocolVersion === ProtocolVersion.V4) && (
              <>
                {!creatingPoolOrPair && !!liquidityRangeChartProps && (
                  <WrappedLiquidityPositionRangeChart width="100%" {...liquidityRangeChartProps} />
                )}
                <Flex row>
                  <Flex fill gap="$gap4">
                    <Text variant="body3" color="$neutral2">
                      {t('common.min')}
                    </Text>
                    <Text variant="body3">{formattedPrices[0]}</Text>
                  </Flex>
                  <Flex fill gap="$gap4">
                    <Text variant="body3" color="$neutral2">
                      {t('common.max')}
                    </Text>
                    <Text variant="body3">{formattedPrices[1]}</Text>
                  </Flex>
                </Flex>
              </>
            )}
          </Flex>
          {creatingPoolOrPair && (
            <Flex gap="$spacing12" mt="$spacing32">
              <Text variant="body3" color="$neutral2">
                {t('position.initialPrice')}
              </Text>
              <BaseQuoteFiatAmount variant="body1" price={price} base={baseCurrency} quote={quoteCurrency} />
            </Flex>
          )}
          <Flex gap="$spacing12" pb="$spacing8" mt="$spacing32">
            <Text variant="body3" color="$neutral2">
              {depositText ?? t('common.depositing')}
            </Text>
            <TokenInfo
              formattedAmount={formattedAmounts?.TOKEN0}
              currencyAmount={currencyAmounts?.TOKEN0}
              currencyUSDAmount={currencyAmountsUSDValue?.TOKEN0}
              logoUrl={token0CurrencyInfo?.logoUrl}
            />
            <TokenInfo
              formattedAmount={formattedAmounts?.TOKEN1}
              currencyAmount={currencyAmounts?.TOKEN1}
              currencyUSDAmount={currencyAmountsUSDValue?.TOKEN1}
              logoUrl={token1CurrencyInfo?.logoUrl}
            />
          </Flex>
          {refundedAmounts && (refundedAmounts.TOKEN0?.greaterThan(0) || refundedAmounts.TOKEN1?.greaterThan(0)) && (
            <Flex gap="$spacing12" pb="$spacing8" mt="$spacing32">
              <Flex row gap="$gap4">
                <Text variant="body3" color="$neutral2">
                  {t('migrate.refund.title')}
                </Text>
                <MouseoverTooltip text={t('migrate.refund')}>
                  <InfoCircleFilled size="$icon.16" color="$neutral2" />
                </MouseoverTooltip>
              </Flex>
              <TokenInfo
                currencyAmount={refundedAmounts.TOKEN0}
                currencyUSDAmount={refundedToken0USD}
                logoUrl={token0CurrencyInfo?.logoUrl}
              />
              <TokenInfo
                currencyAmount={refundedAmounts.TOKEN1}
                currencyUSDAmount={refundedToken1USD}
                logoUrl={token1CurrencyInfo?.logoUrl}
              />
            </Flex>
          )}
          <Flex gap="$spacing12">
            <LowLPSlippageWarning
              isNativePool={Boolean(currencies.sdk.TOKEN0?.isNative || currencies.sdk.TOKEN1?.isNative)}
            />
            <PartialMigrationWarning
              currencyAmounts={currencyAmounts}
              currencyAmountsUSDValue={currencyAmountsUSDValue}
              feeAmounts={feeAmounts}
              refundedAmounts={refundedAmounts}
              refundedAmountsUSDValue={{ TOKEN0: refundedToken0USD, TOKEN1: refundedToken1USD }}
            />
            <ErrorCallout errorMessage={transactionError} onPress={refetch} />
            <PoolOutOfSyncError />
          </Flex>
        </Flex>
        {currentTransactionStep && steps.length > 1 ? (
          <ProgressIndicator steps={steps} currentStep={currentTransactionStep} />
        ) : (
          <>
            {gasFeeEstimateUSD && (
              <>
                <Separator mx="$padding12" />
                <Flex mx="$padding12">
                  <DetailLineItem
                    LineItem={{
                      Label: () => (
                        <Text variant="body3" color="$neutral2">
                          {t('common.networkCost')}
                        </Text>
                      ),
                      Value: () => (
                        <Flex row gap="$gap4" alignItems="center">
                          <NetworkLogo chainId={chainId ?? null} size={iconSizes.icon16} shape="square" />
                          <Text variant="body3">
                            {formatCurrencyAmount({ value: gasFeeEstimateUSD, type: NumberType.FiatGasPrice })}
                          </Text>
                        </Flex>
                      ),
                    }}
                  />
                </Flex>
              </>
            )}
            {currentTransactionStep ? (
              <Button size="large" variant="branded" loading={true} key="create-position-confirm" fill={false}>
                {isSignedInWithPasskey ? t('swap.button.submitting.passkey') : t('common.confirmWallet')}
              </Button>
            ) : (
              <Button
                size="large"
                variant="branded"
                onPress={onConfirm}
                disabled={isDisabled}
                fill={false}
                icon={needsPasskeySignin ? <Passkey size="$icon.24" color="$white" /> : undefined}
              >
                {isSignedInWithPasskey && isSessionAuthenticated ? t('position.create.confirm') : confirmButtonText}
              </Button>
            )}
          </>
        )}
      </Flex>
    </Modal>
  )
}
