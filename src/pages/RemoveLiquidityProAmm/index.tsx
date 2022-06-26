import React, { useCallback, useEffect, useState } from 'react'
import { TransactionResponse } from '@ethersproject/providers'
import { ChainId, Currency, CurrencyAmount, Percent, WETH } from '@kyberswap/ks-sdk-core'
import { Flex, Text } from 'rebass'
import { BigNumber } from '@ethersproject/bignumber'
import { useMemo } from 'react'
import { Redirect, RouteComponentProps } from 'react-router-dom'
import { useProAmmPositionsFromTokenId } from 'hooks/useProAmmPositions'
import useTheme from 'hooks/useTheme'
import { useActiveWeb3React } from 'hooks'
import { useBurnProAmmActionHandlers, useBurnProAmmState, useDerivedProAmmBurnInfo } from 'state/burn/proamm/hooks'
import useDebouncedChangeHandler from 'utils/useDebouncedChangeHandler'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { basisPointsToPercent, calculateGasMargin, formattedNum, shortenAddress } from 'utils'
import { Trans, t } from '@lingui/macro'
import { AutoColumn } from 'components/Column'
import { ButtonConfirmed, ButtonPrimary } from 'components/Button'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import Loader from 'components/Loader'
import { BlackCard } from 'components/Card'
import { MaxButton as MaxBtn } from 'pages/RemoveLiquidity/styled'
import Slider from 'components/Slider'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import styled from 'styled-components'
import Divider from 'components/Divider'
import { Container, FirstColumn, GridColumn, SecondColumn } from './styled'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { Field } from 'state/burn/proamm/actions'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmFee from 'components/ProAmm/ProAmmFee'
import { useHistory } from 'react-router'
import JSBI from 'jsbi'
import usePrevious from 'hooks/usePrevious'
import { useSingleCallResult } from 'state/multicall/hooks'
import Copy from 'components/Copy'
import { unwrappedToken } from 'utils/wrappedCurrency'
import { ZERO } from '@kyberswap/ks-sdk-classic'
import { VERSION } from 'constants/v2'

const MaxButton = styled(MaxBtn)`
  margin: 0;
  flex: unset;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  height: max-content;
  width: max-content;

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

export default function RemoveLiquidityProAmm({
  location,
  match: {
    params: { tokenId },
  },
}: RouteComponentProps<{ tokenId: string }>) {
  const parsedTokenId = useMemo(() => {
    try {
      return BigNumber.from(tokenId)
    } catch {
      return null
    }
  }, [tokenId])

  if (parsedTokenId === null || parsedTokenId.eq(0)) {
    return <Redirect to={{ ...location, pathname: '/myPools' }} />
  }
  return <Remove tokenId={parsedTokenId} />
}

function Remove({ tokenId }: { tokenId: BigNumber }) {
  const { position } = useProAmmPositionsFromTokenId(tokenId)
  const positionManager = useProAmmNFTPositionManagerContract()
  const theme = useTheme()
  const { account, chainId, library } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()

  const owner = useSingleCallResult(!!tokenId ? positionManager : null, 'ownerOf', [tokenId.toNumber()]).result?.[0]
  const ownsNFT = owner === account
  const history = useHistory()
  const prevChainId = usePrevious(chainId)

  useEffect(() => {
    if (!!chainId && !!prevChainId && chainId !== prevChainId) {
      history.push('/myPools')
    }
  }, [chainId, prevChainId, history])
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
    // outOfRange,
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
  const token0Shown = positionSDK && unwrappedToken(positionSDK.pool.token0)
  const token1Shown = positionSDK && unwrappedToken(positionSDK.pool.token1)
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
  const usdPrices = useTokensPrice(
    [liquidityValue0?.currency.wrapped, liquidityValue1?.currency.wrapped],
    VERSION.ELASTIC,
  )

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[0]
      ? parseFloat((parsedAmounts[Field.CURRENCY_A] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[1]
      ? parseFloat((parsedAmounts[Field.CURRENCY_B] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[1]
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
        expectedCurrencyOwed0: feeValue0,
        expectedCurrencyOwed1: feeValue1,
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
      .then(estimate => {
        const newTxn = {
          ...txn,
          gasLimit: calculateGasMargin(estimate),
        }
        return library
          .getSigner()
          .sendTransaction(newTxn)
          .then((response: TransactionResponse) => {
            setAttemptingTxn(false)

            addTransactionWithType(response, {
              type: 'Elastic Remove liquidity',
              summary:
                liquidityValue0?.toSignificant(6) +
                ' ' +
                liquidityValue0?.currency.symbol +
                ' and ' +
                liquidityValue1?.toSignificant(6) +
                ' ' +
                liquidityValue1?.currency.symbol,
              arbitrary: {
                poolAddress: poolAddress,
                token_1: token0Shown?.symbol,
                token_2: token1Shown?.symbol,
              },
            })
            setTxnHash(response.hash)
          })
      })
      .catch(error => {
        setAttemptingTxn(false)
        console.error(error)
        // const newTxn = {
        //   ...txn,
        //   gasLimit: '0x0827f6'
        // }
        // return library
        //   .getSigner()
        //   .sendTransaction(newTxn)
        //   .then((response: TransactionResponse) => {
        //     setAttemptingTxn(false)

        //     addTransactionWithType(response, {
        //       type: 'Remove liquidity',
        //       summary:
        //         liquidityValue0?.toSignificant(6) +
        //         ' ' +
        //         liquidityValue0?.currency.symbol +
        //         ' and ' +
        //         liquidityValue1?.toSignificant(6) +
        //         ' ' +
        //         liquidityValue1?.currency.symbol
        //     })
        //     setTxnHash(response.hash)
        //   })
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
    token0Shown,
    token1Shown,
  ])
  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txnHash) {
      onUserInput(Field.LIQUIDITY_PERCENT, '0')
    }
    setAttemptingTxn(false)
    setTxnHash('')
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
  const showCollectAsWeth = Boolean(
    liquidityValue0?.currency &&
      liquidityValue1?.currency &&
      (liquidityValue0.currency.isNative ||
        liquidityValue1.currency.isNative ||
        liquidityValue0.currency.wrapped.equals(WETH[liquidityValue0.currency.chainId as ChainId]) ||
        liquidityValue1.currency.wrapped.equals(WETH[liquidityValue1.currency.chainId as ChainId])),
  )

  const onCurrencyAInput = useCallback((typedValue: string): void => onUserInput(Field.CURRENCY_A, typedValue), [
    onUserInput,
  ])
  const onCurrencyBInput = useCallback((typedValue: string): void => onUserInput(Field.CURRENCY_B, typedValue), [
    onUserInput,
  ])

  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txnHash}
        content={() => (
          <ConfirmationModalContent
            title={t`Remove Liquidity`}
            onDismiss={handleDismissConfirmation}
            topContent={() => (
              <>
                <ProAmmPooledTokens
                  liquidityValue0={liquidityValue0}
                  liquidityValue1={liquidityValue1}
                  title={t`Remove Amount`}
                />
                {positionSDK ? <ProAmmFee position={positionSDK} tokenId={tokenId} /> : <Loader />}
              </>
            )}
            bottomContent={modalFooter}
          />
        )}
        pendingText={pendingText}
      />
      <Container>
        <AddRemoveTabs
          action={LiquidityAction.REMOVE}
          hideShare
          tooltip={t`You can remove your liquidity here. When you remove liquidity (even partially), you will receive 100% of your fee earnings`}
        />
        {owner && account && !ownsNFT ? (
          <Text
            fontSize="12px"
            fontWeight="500"
            paddingTop={'10px'}
            paddingBottom={'10px'}
            backgroundColor={theme.bg3Opacity4}
            color={theme.subText}
            style={{ borderRadius: '4px', marginBottom: '1.25rem' }}
          >
            The owner of this liquidity position is {shortenAddress(owner)}
            <span style={{ display: 'inline-block' }}>
              <Copy toCopy={owner}></Copy>
            </span>
          </Text>
        ) : (
          <Divider style={{ marginBottom: '1.25rem' }} />
        )}
        {position ? (
          <AutoColumn gap="md" style={{ textAlign: 'left' }}>
            {positionSDK ? <ProAmmPoolInfo position={positionSDK} tokenId={tokenId.toString()} /> : <Loader />}
            <GridColumn>
              <FirstColumn>
                <ProAmmPooledTokens pooled liquidityValue0={pooledAmount0} liquidityValue1={pooledAmount1} />
                {positionSDK ? (
                  <ProAmmFee
                    position={positionSDK}
                    tokenId={tokenId}
                    text={t`When you remove liquidity (even partially), you will receive 100% of your fee earnings`}
                  />
                ) : (
                  <Loader />
                )}
              </FirstColumn>
              <SecondColumn>
                <>
                  <BlackCard padding="1rem" marginTop="1rem">
                    <Text fontSize={12} color={theme.subText} fontWeight="500">
                      <Trans>Amount to remove</Trans>
                    </Text>

                    <Flex marginTop="0.5rem" sx={{ gap: '1rem' }} alignItems="center">
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
                  <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onCurrencyAInput}
                      showMaxButton={false}
                      currency={liquidityValue0?.currency}
                      onCurrencySelect={() => null}
                      disableCurrencySelect={true}
                      id="remove-liquidity-tokena"
                      estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                    />
                    <Flex justifyContent="flex-end" alignItems="center" marginTop="0.5rem">
                      {showCollectAsWeth && chainId && (currency0IsETHER || currency0IsWETH) && (
                        <Text
                          color={theme.primary}
                          role="button"
                          onClick={() => setReceiveWETH(prev => !prev)}
                          fontSize={14}
                          fontWeight="500"
                          sx={{ cursor: 'pointer' }}
                        >
                          {!receiveWETH ? <Trans>Receive Wrapped Token</Trans> : <Trans>Receive Native Token</Trans>}
                        </Text>
                      )}
                    </Flex>
                  </div>

                  <div>
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      onUserInput={onCurrencyBInput}
                      showMaxButton={false}
                      currency={liquidityValue1?.currency}
                      onCurrencySelect={() => null}
                      disableCurrencySelect={true}
                      id="remove-liquidity-tokenb"
                      estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                    />
                    <Flex justifyContent="flex-end" alignItems="center" marginTop="0.5rem">
                      {showCollectAsWeth && chainId && (currency1IsETHER || currency1IsWETH) && (
                        <Text
                          color={theme.primary}
                          role="button"
                          onClick={() => setReceiveWETH(prev => !prev)}
                          fontSize={14}
                          fontWeight="500"
                          sx={{ cursor: 'pointer' }}
                        >
                          {!receiveWETH ? <Trans>Receive Wrapped Token</Trans> : <Trans>Receive Native Token</Trans>}
                        </Text>
                      )}
                    </Flex>
                  </div>
                  <ButtonConfirmed
                    style={{ marginTop: '28px' }}
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
                </>
              </SecondColumn>
            </GridColumn>
          </AutoColumn>
        ) : (
          <Loader />
        )}
      </Container>
    </>
  )
}
