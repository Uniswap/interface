import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import {
  getLiquidityRangeChartProps,
  WrappedLiquidityPositionRangeChart,
} from 'components/Charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { ErrorCallout } from 'components/ErrorCallout'
import { BaseQuoteFiatAmount } from 'components/Liquidity/BaseQuoteFiatAmount'
import { PoolOutOfSyncError } from 'components/Liquidity/Create/PoolOutOfSyncError'
import { LiquidityPositionInfoBadges } from 'components/Liquidity/LiquidityPositionInfoBadges'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { DetailLineItem } from 'components/swap/DetailLineItem'
import { MouseoverTooltip } from 'components/Tooltip'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useCreateLiquidityContext } from 'pages/CreatePosition/CreateLiquidityContextProvider'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PositionField } from 'types/position'
import { Button, Flex, Separator, Text } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Passkey } from 'ui/src/components/icons/Passkey'
import { iconSizes } from 'ui/src/theme'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useGetPasskeyAuthStatus } from 'uniswap/src/features/passkey/hooks/useGetPasskeyAuthStatus'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { TransactionStep } from 'uniswap/src/features/transactions/steps/types'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'

export interface ReviewModalProps {
  modalName: ModalNameType
  headerTitle: string
  depositText?: string
  confirmButtonText: string
  formattedAmounts?: { [field in PositionField]?: string }
  currencyAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  currencyAmountsUSDValue?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
  refundedAmounts?: { [field in PositionField]?: Maybe<CurrencyAmount<Currency>> }
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

  return (
    currencyAmount &&
    currencyAmount.greaterThan(0) && (
      <Flex row justifyContent="space-between">
        <Flex gap="$gap4">
          <Flex row gap="$gap8">
            <Text variant="body1">
              {formattedAmount
                ? formattedAmount
                : formatCurrencyAmount({ value: currencyAmount, type: NumberType.TokenTx })}
            </Text>
            <Text variant="body1">{currencyAmount.currency.symbol}</Text>
          </Flex>
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

export function ReviewModal({
  modalName,
  headerTitle,
  depositText,
  confirmButtonText,
  formattedAmounts,
  currencyAmounts,
  currencyAmountsUSDValue,
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
    protocolVersion,
    creatingPoolOrPair,
    positionState: { fee, hook },
    currentTransactionStep,
    price,
    poolOrPair,
    ticks,
    ticksAtLimit,
    pricesAtTicks,
    priceRangeState: { priceInverted },
    refetch,
  } = useCreateLiquidityContext()

  const token0 = currencyAmounts?.TOKEN0?.currency
  const token1 = currencyAmounts?.TOKEN1?.currency
  const token0CurrencyInfo = useCurrencyInfo(token0)
  const token1CurrencyInfo = useCurrencyInfo(token1)
  const chainId = token0?.chainId

  const { formatNumberOrString, formatCurrencyAmount } = useLocalizationContext()

  const baseCurrency = price?.baseCurrency
  const quoteCurrency = price?.quoteCurrency

  const formattedPrices = useMemo(() => {
    if (protocolVersion === ProtocolVersion.V2) {
      return ['', '']
    }

    const lowerPriceFormatted = ticksAtLimit[0]
      ? '0'
      : formatNumberOrString({ value: pricesAtTicks[0]?.toSignificant(), type: NumberType.TokenTx })

    const upperPriceFormatted = ticksAtLimit[1]
      ? '∞'
      : formatNumberOrString({ value: pricesAtTicks[1]?.toSignificant(), type: NumberType.TokenTx })

    const postfix = `${quoteCurrency?.symbol + '/' + baseCurrency?.symbol}`
    return [`${lowerPriceFormatted} ${postfix}`, `${upperPriceFormatted} ${postfix}`]
  }, [formatNumberOrString, pricesAtTicks, ticksAtLimit, protocolVersion, baseCurrency, quoteCurrency])

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
          <GetHelpHeader
            title={
              <Text variant="subheading2" color="$neutral2">
                {headerTitle}
              </Text>
            }
            closeDataTestId={TestID.LiquidityModalHeaderClose}
            closeModal={() => onClose()}
          />
          <Flex py="$spacing12" gap="$spacing12" mt="$spacing16">
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex>
                <Flex row gap="$gap8">
                  <Text variant="heading3">{currencyAmounts?.TOKEN0?.currency.symbol}</Text>
                  <Text variant="heading3">/</Text>
                  <Text variant="heading3">{currencyAmounts?.TOKEN1?.currency.symbol}</Text>
                </Flex>
                <Flex row gap={2} alignItems="center">
                  <LiquidityPositionInfoBadges size="small" version={protocolVersion} v4hook={hook} feeTier={fee} />
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
                isDisabled={isDisabled}
                fill={false}
                icon={needsPasskeySignin ? <Passkey size="$icon.24" /> : undefined}
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
