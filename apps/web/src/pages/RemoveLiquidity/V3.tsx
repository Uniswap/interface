import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { LiquidityEventName } from '@uniswap/analytics-events'
// eslint-disable-next-line no-restricted-imports
import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { CurrencyAmount, Percent, V3_CORE_FACTORY_ADDRESSES } from '@uniswap/sdk-core'
import { NonfungiblePositionManager } from '@uniswap/v3-sdk'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button/buttons'
import { LightCard } from 'components/Card/cards'
import Loader from 'components/Icons/LoadingSpinner'
import { getLPBaseAnalyticsProperties } from 'components/Liquidity/analytics'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import { DoubleCurrencyLogo } from 'components/Logo/DoubleLogo'
import { AddRemoveTabs } from 'components/NavigationTabs'
import Slider from 'components/Slider'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { AutoColumn } from 'components/deprecated/Column'
import { AutoRow, RowBetween, RowFixed } from 'components/deprecated/Row'
import { Break } from 'components/earn/styled'
import { useAccount } from 'hooks/useAccount'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { useEthersSigner } from 'hooks/useEthersSigner'
import { PoolCache } from 'hooks/usePools'
import { useGetTransactionDeadline } from 'hooks/useTransactionDeadline'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import AppBody from 'pages/App/AppBody'
import { PositionPageUnsupportedContent } from 'pages/LegacyPool/PositionPage'
import { ResponsiveHeaderText, SmallMaxButton, Wrapper } from 'pages/RemoveLiquidity/styled'
import { useCallback, useMemo, useState } from 'react'
import { Trans } from 'react-i18next'
import { Navigate, useLocation, useParams } from 'react-router-dom'
import { useBurnV3ActionHandlers, useBurnV3State, useDerivedV3BurnInfo } from 'state/burn/v3/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { useUserSlippageToleranceWithDefault } from 'state/user/hooks'
import { ThemedText } from 'theme/components'
import { Switch, Text } from 'ui/src'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { logger } from 'utilities/src/logger/logger'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { calculateGasMargin } from 'utils/calculateGasMargin'
import { currencyId } from 'utils/currencyId'
import { WrongChainError } from 'utils/errors'
import { useFormatter } from 'utils/formatNumbers'

const DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

// redirect invalid tokenIds
export default function RemoveLiquidityV3() {
  const { chainId } = useAccount()
  const { defaultChainId } = useEnabledChains()
  const isSupportedChain = useIsSupportedChainId(chainId)
  const { tokenId } = useParams<{ tokenId: string }>()
  const location = useLocation()
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId)
    } catch {
      return null
    }
  }, [tokenId])

  const { position, loading } = useV3PositionFromTokenId(parsedTokenId ?? undefined)
  const isLPRedesignEnabled = useFeatureFlag(FeatureFlags.LPRedesign)
  if (isLPRedesignEnabled) {
    const chainName = getChainInfo(chainId ?? defaultChainId)?.urlParam
    const positionIdUrl = tokenId ? `/v3/${chainName}/${tokenId}` : ''
    return <Navigate to={`/positions${positionIdUrl}`} replace />
  }
  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Navigate to={{ ...location, pathname: '/pools' }} replace />
  }
  if (isSupportedChain && (loading || position)) {
    return <Remove tokenId={parsedTokenId} />
  } else {
    return <PositionPageUnsupportedContent />
  }
}
function Remove({ tokenId }: { tokenId: BigNumber }) {
  const { position } = useV3PositionFromTokenId(tokenId)
  const account = useAccount()
  const signer = useEthersSigner()
  const trace = useTrace()
  const { formatCurrencyAmount } = useFormatter()

  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)
  const nativeCurrency = useNativeCurrency(account.chainId)
  const nativeWrappedSymbol = nativeCurrency.wrapped.symbol

  // burn state
  const { percent } = useBurnV3State()
  const {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    feeValue0,
    feeValue1,
    outOfRange,
    error,
  } = useDerivedV3BurnInfo(position, receiveWETH)
  const { onPercentSelect } = useBurnV3ActionHandlers()

  const removed = position?.liquidity?.eq(0)

  // usd values
  const removedLiquidity0Usd = useUSDCValue(liquidityValue0)
  const removedLiquidity1Usd = useUSDCValue(liquidityValue1)

  // boilerplate for the slider
  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(percent, onPercentSelect)
  const getDeadline = useGetTransactionDeadline() // custom from users settings
  const allowedSlippage = useUserSlippageToleranceWithDefault(DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE) // custom from users

  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()
  const burn = useCallback(async () => {
    setAttemptingTxn(true)
    if (
      !positionManager ||
      !liquidityValue0 ||
      !liquidityValue1 ||
      account.status !== 'connected' ||
      !positionSDK ||
      !liquidityPercentage ||
      !signer
    ) {
      return
    }

    const deadline = await getDeadline()
    if (!deadline) {
      throw new Error('could not get deadline')
    }

    // we fall back to expecting 0 fees in case the fetch fails, which is safe in the
    // vast majority of cases
    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(positionSDK, {
      tokenId: tokenId.toString(),
      liquidityPercentage,
      slippageTolerance: allowedSlippage,
      deadline: deadline.toString(),
      collectOptions: {
        expectedCurrencyOwed0: feeValue0 ?? CurrencyAmount.fromRawAmount(liquidityValue0.currency, 0),
        expectedCurrencyOwed1: feeValue1 ?? CurrencyAmount.fromRawAmount(liquidityValue1.currency, 0),
        recipient: account.address,
      },
    })

    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }

    const connectedChainId = await signer.getChainId()
    if (account.chainId !== connectedChainId) {
      throw new WrongChainError()
    }

    signer
      .estimateGas(txn)
      .then((estimate) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }

        return signer.sendTransaction(newTxn).then((response: TransactionResponse) => {
          sendAnalyticsEvent(LiquidityEventName.REMOVE_LIQUIDITY_SUBMITTED, {
            ...getLPBaseAnalyticsProperties({
              trace,
              fee: position?.fee,
              poolId:
                account.chainId && position
                  ? PoolCache.getPoolAddress(
                      V3_CORE_FACTORY_ADDRESSES[account.chainId],
                      positionSDK.amount0.currency,
                      positionSDK.amount1.currency,
                      position.fee,
                      account.chainId,
                    )
                  : undefined,
              currency0: liquidityValue0.currency,
              currency1: liquidityValue1.currency,
              currency0AmountUsd: removedLiquidity0Usd,
              currency1AmountUsd: removedLiquidity1Usd,
              version: ProtocolVersion.V3,
            }),
            expectedAmountBaseRaw: liquidityValue0.quotient.toString(),
            expectedAmountQuoteRaw: liquidityValue1.quotient.toString(),
            transaction_hash: response.hash,
            closePosition: percent === 100,
          })
          setTxnHash(response.hash)
          setAttemptingTxn(false)
          addTransaction(response, {
            type: TransactionType.REMOVE_LIQUIDITY_V3,
            baseCurrencyId: currencyId(liquidityValue0.currency),
            quoteCurrencyId: currencyId(liquidityValue1.currency),
            expectedAmountBaseRaw: liquidityValue0.quotient.toString(),
            expectedAmountQuoteRaw: liquidityValue1.quotient.toString(),
          })
        })
      })
      .catch((error) => {
        setAttemptingTxn(false)
        logger.error(error, {
          tags: {
            file: 'RemoveLiquidity/V3',
            function: 'burn',
          },
        })
      })
  }, [
    positionManager,
    liquidityValue0,
    liquidityValue1,
    account.status,
    account.address,
    account.chainId,
    positionSDK,
    liquidityPercentage,
    signer,
    getDeadline,
    tokenId,
    allowedSlippage,
    feeValue0,
    feeValue1,
    trace,
    position,
    removedLiquidity0Usd,
    removedLiquidity1Usd,
    percent,
    addTransaction,
  ])

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txnHash) {
      onPercentSelectForSlider(0)
    }
    setAttemptingTxn(false)
    setTxnHash('')
  }, [onPercentSelectForSlider, txnHash])

  const pendingText = (
    <Trans
      i18nKey="removeLiquidity.removing"
      values={{
        amt1: liquidityValue0?.toSignificant(6),
        symbol1: liquidityValue0?.currency?.symbol,
        amt2: liquidityValue1?.toSignificant(6),
        symbol2: liquidityValue1?.currency?.symbol,
      }}
    />
  )

  function modalHeader() {
    return (
      <AutoColumn gap="sm" style={{ padding: '16px' }}>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight="$medium">
            <Trans
              i18nKey="removeLiquidity.pooled"
              values={{
                symbol: liquidityValue0?.currency?.symbol,
              }}
            />
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight="$medium" ml={6}>
              {liquidityValue0 && formatCurrencyAmount({ amount: liquidityValue0 })}
            </Text>
            <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
          </RowFixed>
        </RowBetween>
        <RowBetween align="flex-end">
          <Text fontSize={16} fontWeight="$medium">
            <Trans
              i18nKey="removeLiquidity.pooled"
              values={{
                symbol: liquidityValue1?.currency?.symbol,
              }}
            />
          </Text>
          <RowFixed>
            <Text fontSize={16} fontWeight="$medium" ml={6}>
              {liquidityValue1 && formatCurrencyAmount({ amount: liquidityValue1 })}
            </Text>
            <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
          </RowFixed>
        </RowBetween>
        {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) ? (
          <>
            <Text fontSize={12} color="$neutral2" textAlign="left" pt={8}>
              <Trans i18nKey="removeLiquidity.collectFees" />
            </Text>
            <RowBetween>
              <Text fontSize={16} fontWeight="$medium">
                <Trans i18nKey="common.feesEarned.label" values={{ symbol: feeValue0?.currency?.symbol }} />
              </Text>
              <RowFixed>
                <Text fontSize={16} fontWeight="$medium" ml={6}>
                  {feeValue0 && formatCurrencyAmount({ amount: feeValue0 })}
                </Text>
                <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={feeValue0?.currency} />
              </RowFixed>
            </RowBetween>
            <RowBetween>
              <Text fontSize={16} fontWeight="$medium">
                <Trans i18nKey="common.feesEarned.label" values={{ symbol: feeValue1?.currency?.symbol }} />
              </Text>
              <RowFixed>
                <Text fontSize={16} fontWeight="$medium" ml={6}>
                  {feeValue1 && formatCurrencyAmount({ amount: feeValue1 })}
                </Text>
                <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={feeValue1?.currency} />
              </RowFixed>
            </RowBetween>
          </>
        ) : null}
        <ButtonPrimary mt="16px" onClick={burn}>
          <Trans i18nKey="common.remove.label" />
        </ButtonPrimary>
      </AutoColumn>
    )
  }

  const showCollectAsWeth = Boolean(
    liquidityValue0?.currency &&
      liquidityValue1?.currency &&
      (liquidityValue0.currency.isNative ||
        liquidityValue1.currency.isNative ||
        WRAPPED_NATIVE_CURRENCY[liquidityValue0.currency.chainId]?.equals(liquidityValue0.currency.wrapped) ||
        WRAPPED_NATIVE_CURRENCY[liquidityValue1.currency.chainId]?.equals(liquidityValue1.currency.wrapped)),
  )
  return (
    <AutoColumn>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash ?? ''}
        reviewContent={() => (
          <ConfirmationModalContent
            title={<Trans i18nKey="pool.removeLiquidity" />}
            onDismiss={handleDismissConfirmation}
            topContent={modalHeader}
          />
        )}
        pendingText={pendingText}
      />
      <AppBody $maxWidth="unset">
        <AddRemoveTabs creating={false} adding={false} autoSlippage={DEFAULT_REMOVE_V3_LIQUIDITY_SLIPPAGE_TOLERANCE} />
        <Wrapper>
          {position ? (
            <AutoColumn gap="lg">
              <RowBetween>
                <RowFixed>
                  <DoubleCurrencyLogo currencies={[liquidityValue0?.currency, liquidityValue1?.currency]} size={20} />
                  <ThemedText.DeprecatedLabel
                    ml="10px"
                    fontSize="20px"
                    id="remove-liquidity-tokens"
                  >{`${liquidityValue0?.currency?.symbol}/${liquidityValue1?.currency?.symbol}`}</ThemedText.DeprecatedLabel>
                </RowFixed>
                <RangeBadge removed={removed} inRange={!outOfRange} />
              </RowBetween>
              <LightCard>
                <AutoColumn gap="md">
                  <ThemedText.DeprecatedMain fontWeight={485}>
                    <Trans i18nKey="common.amount.label" />
                  </ThemedText.DeprecatedMain>
                  <RowBetween>
                    <ResponsiveHeaderText>{percentForSlider}%</ResponsiveHeaderText>
                    <AutoRow gap="4px" justify="flex-end">
                      <SmallMaxButton onClick={() => onPercentSelect(25)} width="20%">
                        25%
                      </SmallMaxButton>
                      <SmallMaxButton onClick={() => onPercentSelect(50)} width="20%">
                        50%
                      </SmallMaxButton>
                      <SmallMaxButton onClick={() => onPercentSelect(75)} width="20%">
                        75%
                      </SmallMaxButton>
                      <SmallMaxButton onClick={() => onPercentSelect(100)} width="20%">
                        <Trans i18nKey="common.max" />
                      </SmallMaxButton>
                    </AutoRow>
                  </RowBetween>
                  <Slider value={percentForSlider} onChange={onPercentSelectForSlider} />
                </AutoColumn>
              </LightCard>
              <LightCard>
                <AutoColumn gap="md">
                  <RowBetween>
                    <Text fontSize={16} fontWeight="$medium" id="remove-pooled-tokena-symbol">
                      <Trans
                        i18nKey="removeLiquidity.pooled"
                        values={{
                          symbol: liquidityValue0?.currency?.symbol,
                        }}
                      />
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight="$medium" ml={6}>
                        {liquidityValue0 && formatCurrencyAmount({ amount: liquidityValue0 })}
                      </Text>
                      <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={liquidityValue0?.currency} />
                    </RowFixed>
                  </RowBetween>
                  <RowBetween>
                    <Text fontSize={16} fontWeight="$medium" id="remove-pooled-tokenb-symbol">
                      <Trans
                        i18nKey="removeLiquidity.pooled"
                        values={{
                          symbol: liquidityValue1?.currency?.symbol,
                        }}
                      />
                    </Text>
                    <RowFixed>
                      <Text fontSize={16} fontWeight="$medium" ml={6}>
                        {liquidityValue1 && formatCurrencyAmount({ amount: liquidityValue1 })}
                      </Text>
                      <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={liquidityValue1?.currency} />
                    </RowFixed>
                  </RowBetween>
                  {feeValue0?.greaterThan(0) || feeValue1?.greaterThan(0) ? (
                    <>
                      <Break />
                      <RowBetween>
                        <Text fontSize={16} fontWeight="$medium">
                          <Trans
                            i18nKey="common.feesEarned.label"
                            values={{
                              symbol: feeValue0?.currency?.symbol,
                            }}
                          />
                        </Text>
                        <RowFixed>
                          <Text fontSize={16} fontWeight="$medium" ml={6}>
                            {feeValue0 && formatCurrencyAmount({ amount: feeValue0 })}
                          </Text>
                          <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={feeValue0?.currency} />
                        </RowFixed>
                      </RowBetween>
                      <RowBetween>
                        <Text fontSize={16} fontWeight="$medium">
                          <Trans
                            i18nKey="common.feesEarned.label"
                            values={{
                              symbol: feeValue1?.currency?.symbol,
                            }}
                          />
                        </Text>
                        <RowFixed>
                          <Text fontSize={16} fontWeight="$medium" ml={6}>
                            {feeValue1 && formatCurrencyAmount({ amount: feeValue1 })}
                          </Text>
                          <CurrencyLogo size={20} style={{ marginLeft: '8px' }} currency={feeValue1?.currency} />
                        </RowFixed>
                      </RowBetween>
                    </>
                  ) : null}
                </AutoColumn>
              </LightCard>

              {showCollectAsWeth && (
                <RowBetween>
                  <ThemedText.DeprecatedMain>
                    <Trans
                      i18nKey="pool.collectAs"
                      values={{
                        nativeWrappedSymbol,
                      }}
                    />
                  </ThemedText.DeprecatedMain>
                  <Switch
                    id="receive-as-weth"
                    checked={receiveWETH}
                    onCheckedChange={() => setReceiveWETH((receiveWETH) => !receiveWETH)}
                    variant="branded"
                  />
                </RowBetween>
              )}

              <div style={{ display: 'flex' }}>
                <AutoColumn gap="md" style={{ flex: '1' }}>
                  <ButtonConfirmed
                    confirmed={false}
                    disabled={removed || percent === 0 || !liquidityValue0}
                    onClick={() => setShowConfirm(true)}
                  >
                    {removed ? <Trans i18nKey="common.closed" /> : error ?? <Trans i18nKey="common.remove.label" />}
                  </ButtonConfirmed>
                </AutoColumn>
              </div>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Wrapper>
      </AppBody>
    </AutoColumn>
  )
}
