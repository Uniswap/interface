import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { ZERO } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft } from 'react-feather'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as TutorialIcon } from 'assets/svg/play_circle_outline.svg'
import RangeBadge from 'components/Badge/RangeBadge'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import { BlackCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Copy from 'components/Copy'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import FormattedCurrencyAmount from 'components/FormattedCurrencyAmount'
import Loader from 'components/Loader'
import { StyledMenuButton } from 'components/NavigationTabs'
import ProAmmFee from 'components/ProAmm/ProAmmFee'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import Slider from 'components/Slider'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import TransactionSettings from 'components/TransactionSettings'
import Tutorial, { TutorialType } from 'components/Tutorial'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import usePrevious from 'hooks/usePrevious'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { MaxButton as MaxBtn } from 'pages/RemoveLiquidity/styled'
import { useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/burn/proamm/actions'
import { useBurnProAmmActionHandlers, useBurnProAmmState, useDerivedProAmmBurnInfo } from 'state/burn/proamm/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { MEDIA_WIDTHS } from 'theme'
import { basisPointsToPercent, calculateGasMargin, formattedNum, formattedNumLong, shortenAddress } from 'utils'
import { ErrorName } from 'utils/sentry'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'

import {
  AmoutToRemoveContent,
  Container,
  Content,
  FirstColumn,
  GridColumn,
  SecondColumn,
  TokenId,
  TokenInputWrapper,
} from './styled'

const MaxButton = styled(MaxBtn)`
  margin: 0;
  flex: unset;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  height: max-content;
  width: max-content;
  background: transparent;
  border-color: ${({ theme }) => theme.border};
  color: ${({ theme }) => theme.subText};

  ${({ theme }) => theme.mediaWidth.upToSmall`
    padding: 0.375rem 0.75rem;
    font-size: 0.875rem;
  `}

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    flex: 1;
  `}
`

const MaxButtonGroup = styled(Flex)`
  gap: 0.5rem;
  justify-content: flex-end;
  flex: 1;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    gap: 0.25rem
  `}
`

const PercentText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    font-size: 28px !important;
    min-width: 72px !important;
  `}
`

export default function RemoveLiquidityProAmm() {
  const { tokenId } = useParams()

  const location = useLocation()
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId)
    } catch {
      return null
    }
  }, [tokenId])

  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Navigate to={{ ...location, pathname: '/myPools' }} />
  }
  return <Remove tokenId={parsedTokenId} />
}

function Remove({ tokenId }: { tokenId: BigNumber }) {
  const { position } = useProAmmPositionsFromTokenId(tokenId)
  const positionManager = useProAmmNFTPositionManagerContract()
  const theme = useTheme()
  const { account, chainId, isEVM } = useActiveWeb3React()
  const { library } = useWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const [removeLiquidityError, setRemoveLiquidityError] = useState<string>('')

  const owner = useSingleCallResult(!!tokenId ? positionManager : null, 'ownerOf', [tokenId.toNumber()]).result?.[0]
  const ownsNFT = owner === account
  const navigate = useNavigate()
  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (!!chainId && !!prevChainId && chainId !== prevChainId) {
      navigate('/myPools')
    }
  }, [chainId, prevChainId, navigate])
  // flag for receiving WETH
  const [receiveWETH, setReceiveWETH] = useState(false)

  // burn state
  const { independentField, typedValue } = useBurnProAmmState()
  const {
    position: positionSDK,
    liquidityPercentage,
    liquidityValue0,
    liquidityValue1,
    pooledAmount0,
    pooledAmount1,
    feeValue0,
    feeValue1,
    outOfRange,
    error,
    parsedAmounts,
  } = useDerivedProAmmBurnInfo(position, receiveWETH)
  const currency0IsETHER = !!(chainId && liquidityValue0?.currency.isNative)
  const currency0IsWETH = !!(chainId && liquidityValue0?.currency.equals(WETH[chainId]))
  const currency1IsETHER = !!(chainId && liquidityValue1?.currency.isNative)
  const currency1IsWETH = !!(chainId && liquidityValue1?.currency.equals(WETH[chainId]))
  const { onUserInput } = useBurnProAmmActionHandlers()
  const removed = position?.liquidity?.eq(0)

  const poolAddress = useProAmmPoolInfo(
    positionSDK?.pool?.token0,
    positionSDK?.pool?.token1,
    positionSDK?.pool?.fee as FeeAmount,
  )
  // boilerplate for the slider
  const liquidityPercentChangeCallback = useCallback(
    (value: number) => {
      onUserInput(Field.LIQUIDITY_PERCENT, value.toString())
    },
    [onUserInput],
  )

  const [percentForSlider, onPercentSelectForSlider] = useDebouncedChangeHandler(
    Number.parseInt(parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0)),
    liquidityPercentChangeCallback,
    0,
  )
  const formattedAmounts = {
    [Field.LIQUIDITY_PERCENT]: parsedAmounts[Field.LIQUIDITY_PERCENT].equalTo('0')
      ? '0'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].lessThan(new Percent('1', '100'))
      ? '<1'
      : parsedAmounts[Field.LIQUIDITY_PERCENT].toFixed(0),
    [Field.CURRENCY_A]:
      independentField === Field.CURRENCY_A ? typedValue : parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '',
    [Field.CURRENCY_B]:
      independentField === Field.CURRENCY_B ? typedValue : parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '',
  }
  const address0 = pooledAmount0?.currency.wrapped.address || ''
  const address1 = pooledAmount1?.currency.wrapped.address || ''

  const usdPrices = useTokenPrices([address0, address1])

  const totalPooledUSD =
    parseFloat(pooledAmount0?.toExact() || '0') * usdPrices[address0] +
    parseFloat(pooledAmount1?.toExact() || '0') * usdPrices[address1]

  const totalFeeRewardUSD =
    parseFloat(feeValue0?.toExact() || '0') * usdPrices[address0] +
    parseFloat(feeValue1?.toExact() || '0') * usdPrices[address1]

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[address0]
      ? parseFloat((parsedAmounts[Field.CURRENCY_A] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[address0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[address1]
      ? parseFloat((parsedAmounts[Field.CURRENCY_B] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[address1]
      : 0

  const deadline = useTransactionDeadline() // custom from users settings
  const allowedSlippage = useUserSlippageTolerance()
  const [showConfirm, setShowConfirm] = useState(false)
  const [attemptingTxn, setAttemptingTxn] = useState(false)
  const [txnHash, setTxnHash] = useState<string | undefined>()
  const addTransactionWithType = useTransactionAdder()

  const burn = useCallback(async () => {
    setAttemptingTxn(true)
    if (
      !positionManager ||
      !liquidityValue0 ||
      !liquidityValue1 ||
      !deadline ||
      !account ||
      !chainId ||
      !feeValue0 ||
      !feeValue1 ||
      !positionSDK ||
      !liquidityPercentage ||
      !library
    ) {
      setAttemptingTxn(false)
      setRemoveLiquidityError('Some things went wrong')

      const e = new Error('Remove Elastic Liquidity Error')
      e.name = ErrorName.RemoveElasticLiquidityError
      captureException(e, {
        extra: {
          positionManager,
          liquidityValue0,
          liquidityValue1,
          deadline,
          account,
          chainId,
          feeValue0,
          feeValue1,
          positionSDK,
          liquidityPercentage,
        },
      })

      return
    }
    // const partialPosition = new Position({
    //   pool: positionSDK.pool,
    //   liquidity: liquidityPercentage.multiply(positionSDK.liquidity).quotient,
    //   tickLower: positionSDK.tickLower,
    //   tickUpper: positionSDK.tickUpper,
    // })
    const { calldata, value } = NonfungiblePositionManager.removeCallParameters(positionSDK, {
      tokenId: tokenId.toString(),
      liquidityPercentage,
      slippageTolerance: basisPointsToPercent(allowedSlippage[0]),
      deadline: deadline.toString(),
      collectOptions: {
        expectedCurrencyOwed0: feeValue0.subtract(feeValue0.multiply(basisPointsToPercent(allowedSlippage[0]))),
        expectedCurrencyOwed1: feeValue1.subtract(feeValue1.multiply(basisPointsToPercent(allowedSlippage[0]))),
        recipient: account,
        deadline: deadline.toString(),
        isRemovingLiquid: true,
        havingFee: !(feeValue0.equalTo(JSBI.BigInt('0')) && feeValue1.equalTo(JSBI.BigInt('0'))),
      },
    })
    const txn = {
      to: positionManager.address,
      data: calldata,
      value,
    }
    library
      .getSigner()
      .estimateGas(txn)
      .then(async (estimate: BigNumber) => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setAttemptingTxn(false)
            const tokenAmountIn = liquidityValue0?.toSignificant(6)
            const tokenAmountOut = liquidityValue1?.toSignificant(6)
            const tokenSymbolIn = liquidityValue0?.currency.symbol ?? ''
            const tokenSymbolOut = liquidityValue1?.currency.symbol ?? ''
            addTransactionWithType({
              hash: response.hash,
              type: TRANSACTION_TYPE.ELASTIC_REMOVE_LIQUIDITY,
              extraInfo: {
                tokenAmountIn,
                tokenAmountOut,
                tokenSymbolIn,
                tokenSymbolOut,
                tokenAddressIn: liquidityValue0?.currency.wrapped.address,
                tokenAddressOut: liquidityValue1?.currency.wrapped.address,
                contract: poolAddress,
                nftId: tokenId.toString(),
              },
            })
            setTxnHash(response.hash)
          })
      })
      .catch((error: any) => {
        setAttemptingTxn(false)

        if (error?.code !== 'ACTION_REJECTED') {
          const e = new Error('Remove Elastic Liquidity Error', { cause: error })
          e.name = ErrorName.RemoveElasticLiquidityError
          captureException(e, {
            extra: {
              calldata,
              value,
              to: positionManager.address,
            },
          })
        }

        setRemoveLiquidityError(error?.message || JSON.stringify(error))
      })
  }, [
    positionManager,
    liquidityValue0,
    liquidityValue1,
    deadline,
    account,
    chainId,
    feeValue0,
    feeValue1,
    positionSDK,
    liquidityPercentage,
    library,
    tokenId,
    allowedSlippage,
    addTransactionWithType,
    poolAddress,
  ])
  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txnHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setAttemptingTxn(false)
    setTxnHash('')
    setRemoveLiquidityError('')
  }, [onUserInput, txnHash])

  const pendingText = (
    <Trans>
      Removing {liquidityValue0?.toSignificant(6)} {liquidityValue0?.currency?.symbol} and{' '}
      {liquidityValue1?.toSignificant(6)} {liquidityValue1?.currency?.symbol}
      {feeValue0?.greaterThan(ZERO) || feeValue1?.greaterThan(ZERO) ? <br /> : ''}
      {feeValue0?.greaterThan(ZERO) || feeValue1?.greaterThan(ZERO)
        ? `Collecting fee of ${feeValue0?.toSignificant(6)} ${
            feeValue0?.currency?.symbol
          } and ${feeValue1?.toSignificant(6)} ${feeValue1?.currency?.symbol}`
        : ''}
    </Trans>
  )

  function modalFooter() {
    return (
      <ButtonPrimary mt="16px" onClick={burn}>
        <Trans>Remove</Trans>
      </ButtonPrimary>
    )
  }
  const onCurrencyAInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue),
    [onUserInput],
  )
  const onCurrencyBInput = useCallback(
    (typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue),
    [onUserInput],
  )

  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)

  if (!isEVM) return <Navigate to="/" />

  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash}
        content={() =>
          removeLiquidityError ? (
            <TransactionErrorContent onDismiss={handleDismissConfirmation} message={removeLiquidityError} />
          ) : (
            <ConfirmationModalContent
              title={t`Remove Liquidity`}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <>
                  <Flex marginTop="1.5rem" />
                  {positionSDK && <ProAmmPoolInfo position={positionSDK} tokenId={tokenId.toString()} />}
                  <ProAmmPooledTokens
                    liquidityValue0={liquidityValue0}
                    liquidityValue1={liquidityValue1}
                    title={t`Remove Amount`}
                  />
                  {positionSDK ? (
                    <ProAmmFee
                      totalFeeRewardUSD={totalFeeRewardUSD}
                      feeValue0={feeValue0}
                      feeValue1={feeValue1}
                      position={positionSDK}
                      tokenId={tokenId}
                    />
                  ) : (
                    <Loader />
                  )}
                </>
              )}
              bottomContent={modalFooter}
            />
          )
        }
        pendingText={pendingText}
      />
      <Container>
        <Flex justifyContent="space-between" alignItems="center" marginTop="32px" marginBottom="24px">
          <Flex
            role="button"
            onClick={() => navigate(-1)}
            alignItems="center"
            sx={{ cursor: 'pointer', ':hover': { opacity: '0.8' } }}
          >
            <ChevronLeft size={28} color={theme.subText} />
            <Text fontSize="24px" fontWeight="500" marginLeft="8px">
              Remove Liquidity
            </Text>
          </Flex>

          <Flex>
            {owner && account && !ownsNFT && (
              <Text
                fontSize="12px"
                fontWeight="500"
                color={theme.subText}
                display="flex"
                alignItems="center"
                marginRight="8px"
              >
                <Trans>The owner of this liquidity position is {shortenAddress(chainId, owner)}</Trans>
                <Copy toCopy={owner} />
              </Text>
            )}

            <Tutorial
              type={TutorialType.ELASTIC_REMOVE_LIQUIDITY}
              customIcon={
                <StyledMenuButton>
                  <TutorialIcon />
                </StyledMenuButton>
              }
            />
            <TransactionSettings hoverBg={theme.buttonBlack} />
          </Flex>
        </Flex>

        <Content>
          {position ? (
            <AutoColumn gap="md" style={{ textAlign: 'left' }}>
              <GridColumn>
                <FirstColumn>
                  {positionSDK ? (
                    <ProAmmPoolInfo position={positionSDK} tokenId={tokenId.toString()} showRangeInfo={false} />
                  ) : (
                    <Loader />
                  )}

                  <BlackCard style={{ borderRadius: '1rem', padding: '1rem' }}>
                    <Flex alignItems="center" sx={{ gap: '4px' }}>
                      <TokenId color={removed ? theme.red : outOfRange ? theme.warning : theme.primary}>
                        #{tokenId.toString()}
                      </TokenId>
                      <RangeBadge removed={removed} inRange={!outOfRange} hideText size={14} />
                    </Flex>

                    <Flex
                      justifyContent="space-between"
                      fontSize="12px"
                      fontWeight="500"
                      marginTop="1rem"
                      marginBottom="0.75rem"
                    >
                      <Text>
                        <Trans>My Liquidity</Trans>
                      </Text>
                      <Text>{formattedNumLong(totalPooledUSD, true)}</Text>
                    </Flex>

                    <Divider />

                    <Flex justifyContent="space-between" fontSize="12px" marginTop="0.75rem">
                      <Text color={theme.subText}>Pooled {pooledAmount0?.currency.symbol}</Text>
                      <Flex alignItems="center">
                        <CurrencyLogo currency={pooledAmount0?.currency} size="16px" />
                        <Text fontWeight="500" marginLeft="4px">
                          {pooledAmount0 && <FormattedCurrencyAmount currencyAmount={pooledAmount0} />}{' '}
                          {pooledAmount0?.currency?.symbol}
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex justifyContent="space-between" fontSize="12px" marginTop="0.75rem">
                      <Text color={theme.subText}>Pooled {pooledAmount1?.currency.symbol}</Text>
                      <Flex alignItems="center">
                        <CurrencyLogo currency={pooledAmount1?.currency} size="16px" />
                        <Text fontWeight="500" marginLeft="4px">
                          {pooledAmount1?.toSignificant(10)} {pooledAmount1?.currency.symbol}
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex
                      justifyContent="space-between"
                      fontSize="12px"
                      fontWeight="500"
                      marginTop="1.25rem"
                      marginBottom="0.75rem"
                    >
                      <Text>My Fee Earnings</Text>
                      <Text>{formattedNumLong(totalFeeRewardUSD, true)}</Text>
                    </Flex>

                    <Divider />

                    <Flex justifyContent="space-between" fontSize="12px" marginTop="0.75rem">
                      <Text color={theme.subText}>{feeValue0?.currency.symbol} Fee Earned</Text>
                      <Flex alignItems="center">
                        <CurrencyLogo currency={feeValue0?.currency} size="16px" />
                        <Text fontWeight="500" marginLeft="4px">
                          {feeValue0 && <FormattedCurrencyAmount currencyAmount={feeValue0} />}{' '}
                          {feeValue0?.currency?.symbol}
                        </Text>
                      </Flex>
                    </Flex>

                    <Flex justifyContent="space-between" fontSize="12px" marginTop="0.75rem">
                      <Text color={theme.subText}>{feeValue1?.currency.symbol} Fee Earned</Text>
                      <Flex alignItems="center">
                        <CurrencyLogo currency={feeValue1?.currency} size="16px" />
                        <Text fontWeight="500" marginLeft="4px">
                          {feeValue1?.toSignificant(10)} {feeValue1?.currency.symbol}
                        </Text>
                      </Flex>
                    </Flex>
                  </BlackCard>
                </FirstColumn>

                <SecondColumn>
                  <AmoutToRemoveContent>
                    <Text fontSize={12} color={theme.subText} fontWeight="500">
                      <Trans>Amount to remove</Trans>
                    </Text>

                    <BlackCard
                      padding="1rem"
                      marginTop="1rem"
                      style={{ borderRadius: '1rem', border: `1px solid ${theme.border}` }}
                    >
                      <Flex sx={{ gap: '1rem' }} alignItems="center">
                        <PercentText fontSize={36} fontWeight="500">
                          {percentForSlider}%
                        </PercentText>

                        <MaxButtonGroup>
                          <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '25')}>
                            <Trans>25%</Trans>
                          </MaxButton>
                          <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '50')}>
                            <Trans>50%</Trans>
                          </MaxButton>
                          <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '75')}>
                            <Trans>75%</Trans>
                          </MaxButton>
                          <MaxButton onClick={() => onUserInput(Field.LIQUIDITY_PERCENT, '100')}>
                            <Trans>Max</Trans>
                          </MaxButton>
                        </MaxButtonGroup>
                      </Flex>

                      <Slider
                        value={percentForSlider}
                        onChange={onPercentSelectForSlider}
                        size={16}
                        style={{ width: '100%', margin: '1rem 0 0', padding: '0.75rem 0' }}
                      />
                    </BlackCard>

                    <TokenInputWrapper>
                      <div
                        style={{
                          flex: 1,
                          border: `1px solid ${theme.border}`,
                          borderRadius: '1rem',
                        }}
                      >
                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_A]}
                          onUserInput={onCurrencyAInput}
                          onMax={null}
                          onHalf={null}
                          currency={liquidityValue0?.currency}
                          onCurrencySelect={() => null}
                          id="remove-liquidity-tokena"
                          estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                          disableCurrencySelect={!currency0IsETHER && !currency0IsWETH}
                          isSwitchMode={currency0IsETHER || currency0IsWETH}
                          onSwitchCurrency={() => setReceiveWETH(prev => !prev)}
                        />
                      </div>

                      <div style={{ flex: 1, border: `1px solid ${theme.border}`, borderRadius: '1rem' }}>
                        <CurrencyInputPanel
                          value={formattedAmounts[Field.CURRENCY_B]}
                          onUserInput={onCurrencyBInput}
                          onMax={null}
                          onHalf={null}
                          currency={liquidityValue1?.currency}
                          onCurrencySelect={() => null}
                          id="remove-liquidity-tokenb"
                          estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                          disableCurrencySelect={!currency1IsETHER && !currency1IsWETH}
                          isSwitchMode={currency1IsETHER || currency1IsWETH}
                          onSwitchCurrency={() => setReceiveWETH(prev => !prev)}
                        />
                      </div>
                    </TokenInputWrapper>

                    <Text fontSize="0.75rem" fontStyle="italic" textAlign="left" marginTop="12px" color={theme.subText}>
                      <Trans>
                        Note: When you remove liquidity (even partially), you will receive 100% of your fee earnings
                      </Trans>
                    </Text>
                  </AmoutToRemoveContent>

                  <Flex justifyContent="flex-end">
                    <ButtonConfirmed
                      style={{ marginTop: '24px', width: upToMedium ? '100%' : 'fit-content', minWidth: '164px' }}
                      confirmed={false}
                      disabled={
                        removed ||
                        liquidityPercentage?.equalTo(new Percent(0, 100)) ||
                        !liquidityValue0 ||
                        (!!owner && !!account && !ownsNFT)
                      }
                      onClick={() => {
                        if (!account) {
                          toggleWalletModal()
                        } else setShowConfirm(true)
                      }}
                    >
                      {removed ? <Trans>Closed</Trans> : error ?? <Trans>Preview</Trans>}
                    </ButtonConfirmed>
                  </Flex>
                </SecondColumn>
              </GridColumn>
            </AutoColumn>
          ) : (
            <Loader />
          )}
        </Content>
      </Container>
    </>
  )
}
