import { LiquidityEventName } from '@uniswap/analytics-events'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { LoaderButton } from 'components/Button/LoaderButton'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import { useModalLiquidityInitialState, useV3OrV4PositionDerivedInfo } from 'components/Liquidity/hooks'
import { getProtocolItems } from 'components/Liquidity/utils'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { ZERO_ADDRESS } from 'constants/misc'
import { useCurrencyInfo } from 'hooks/Tokens'
import { useAccount } from 'hooks/useAccount'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { useMemo } from 'react'
import { useCloseModal } from 'state/application/hooks'
import { PopupType, addPopup } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useClaimLpFeesCalldataQuery } from 'uniswap/src/data/apiClients/tradingApi/useClaimLpFeesCalldataQuery'
import { ClaimLPFeesRequest } from 'uniswap/src/data/tradingApi/__generated__'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTranslation } from 'uniswap/src/i18n'
import { NumberType } from 'utilities/src/format/types'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { currencyId } from 'utils/currencyId'

// eslint-disable-next-line import/no-unused-modules
export function ClaimFeeModal() {
  const { t } = useTranslation()
  const trace = useTrace()
  const { formatCurrencyAmount } = useLocalizationContext()
  const positionInfo = useModalLiquidityInitialState()
  const onClose = useCloseModal(ModalName.ClaimFee)
  const {
    feeValue0: token0Fees,
    feeValue1: token1Fees,
    fiatFeeValue0: token0FeesUsd,
    fiatFeeValue1: token1FeesUsd,
  } = useV3OrV4PositionDerivedInfo(positionInfo)

  const currencyInfo0 = useCurrencyInfo(token0Fees?.currency)
  const currencyInfo1 = useCurrencyInfo(token1Fees?.currency)
  const account = useAccount()
  const dispatch = useAppDispatch()
  const addTransaction = useTransactionAdder()

  const claimLpFeesParams = useMemo(() => {
    if (!positionInfo) {
      return undefined
    }

    return {
      protocol: getProtocolItems(positionInfo.version),
      tokenId: positionInfo.tokenId ? Number(positionInfo.tokenId) : undefined,
      walletAddress: account.address,
      chainId: positionInfo.currency0Amount.currency.chainId,
      position: {
        pool: {
          token0: positionInfo.currency0Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency0Amount.currency.address,
          token1: positionInfo.currency1Amount.currency.isNative
            ? ZERO_ADDRESS
            : positionInfo.currency1Amount.currency.address,
          fee: positionInfo.feeTier ? Number(positionInfo.feeTier) : undefined,
          tickSpacing: positionInfo?.tickSpacing ? Number(positionInfo?.tickSpacing) : undefined,
          hooks: positionInfo.v4hook,
        },
        tickLower: positionInfo.tickLower ? Number(positionInfo.tickLower) : undefined,
        tickUpper: positionInfo.tickUpper ? Number(positionInfo.tickUpper) : undefined,
      },
      expectedTokenOwed0RawAmount:
        positionInfo.version !== ProtocolVersion.V4 ? token0Fees?.quotient.toString() : undefined,
      expectedTokenOwed1RawAmount:
        positionInfo.version !== ProtocolVersion.V4 ? token1Fees?.quotient.toString() : undefined,
      collectAsWETH: positionInfo.version !== ProtocolVersion.V4 ? positionInfo.collectAsWeth : undefined,
    } satisfies ClaimLPFeesRequest
  }, [account.address, positionInfo, token0Fees, token1Fees])

  const { data, isLoading: calldataLoading } = useClaimLpFeesCalldataQuery({
    params: claimLpFeesParams,
  })

  const signer = useEthersSigner()

  return (
    <Modal name={ModalName.ClaimFee} onClose={onClose} isDismissible>
      <Flex gap="$gap16">
        <GetHelpHeader
          link={uniswapUrls.helpArticleUrls.lpCollectFees}
          title={t('pool.collectFees')}
          closeModal={onClose}
          closeDataTestId="ClaimFeeModal-close-icon"
        />
        {token0Fees && token1Fees && (
          <Flex backgroundColor="$surface3" borderRadius="$rounded12" p="$padding16" gap="$gap12">
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currencyInfo0} size={iconSizes.icon24} />
                <Text variant="body1" color="neutral1">
                  {token0Fees.currency.symbol}
                </Text>
              </Flex>
              <Flex row gap="$gap8" alignItems="center">
                <Text variant="body1" color="$neutral1">
                  {formatCurrencyAmount({ value: token0Fees })}
                </Text>
                {token0FeesUsd && (
                  <Text variant="body1" color="$neutral2">
                    ({formatCurrencyAmount({ value: token0FeesUsd, type: NumberType.FiatTokenPrice })})
                  </Text>
                )}
              </Flex>
            </Flex>
            <Flex row alignItems="center" justifyContent="space-between">
              <Flex row gap="$gap8" alignItems="center">
                <CurrencyLogo currencyInfo={currencyInfo1} size={iconSizes.icon24} />
                <Text variant="body1" color="neutral1">
                  {token1Fees.currency.symbol}
                </Text>
              </Flex>
              <Flex row gap="$gap8" alignItems="center">
                <Text variant="body1" color="$neutral1">
                  {formatCurrencyAmount({ value: token1Fees })}
                </Text>
                {token1FeesUsd && (
                  <Text variant="body1" color="$neutral2">
                    ({formatCurrencyAmount({ value: token1FeesUsd, type: NumberType.FiatTokenPrice })})
                  </Text>
                )}
              </Flex>
            </Flex>
          </Flex>
        )}
        <LoaderButton
          buttonKey="ClaimFeeModal-button"
          disabled={!data?.claim}
          loading={calldataLoading}
          onPress={async () => {
            if (signer && data?.claim) {
              const response = await signer.sendTransaction(data?.claim)

              addTransaction(response, {
                type: TransactionType.COLLECT_FEES,
                currencyId0: currencyId(token0Fees?.currency),
                currencyId1: currencyId(token1Fees?.currency),
                expectedCurrencyOwed0: token0Fees?.quotient.toString() || '',
                expectedCurrencyOwed1: token1Fees?.quotient.toString() || '',
              })

              if (positionInfo && token0Fees?.currency && token1Fees?.currency) {
                // typecheck only
                sendAnalyticsEvent(LiquidityEventName.COLLECT_LIQUIDITY_SUBMITTED, {
                  ...getLPBaseAnalyticsProperties({
                    trace,
                    poolId: positionInfo.poolId,
                    chainId: positionInfo.currency0Amount.currency.chainId,
                    currency0: token0Fees?.currency,
                    currency1: token1Fees?.currency,
                    currency0AmountUsd: token0FeesUsd,
                    currency1AmountUsd: token1FeesUsd,
                    version: positionInfo?.version,
                  }),
                  transaction_hash: response.hash,
                })
              }

              onClose()
              dispatch(
                addPopup({
                  content: {
                    type: PopupType.Transaction,
                    hash: response.hash,
                  },
                  key: response.hash,
                }),
              )
            }
          }}
        >
          <Text variant="buttonLabel2" color="$neutralContrast">
            {t('common.collect.button')}
          </Text>
        </LoaderButton>
      </Flex>
    </Modal>
  )
}
