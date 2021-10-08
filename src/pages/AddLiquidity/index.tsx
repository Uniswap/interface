import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, currencyEquals, ETHER, Fraction, JSBI, Price, Token, TokenAmount, WETH } from 'libs/sdk/src'
import React, { useCallback, useContext, useMemo, useState } from 'react'
import { Plus, AlertTriangle } from 'react-feather'
import { RouteComponentProps } from 'react-router-dom'
import { Text, Flex } from 'rebass'
import styled, { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'

import { ButtonError, ButtonLight, ButtonPrimary } from '../../components/Button'
import Card from '../../components/Card'
import { AutoColumn, ColumnCenter } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { MinimalPositionCard } from '../../components/PositionCard'
import Row, { AutoRow, RowBetween, RowFlat } from '../../components/Row'

import { ROUTER_ADDRESSES } from '../../constants'
import { PairState } from '../../data/Reserves'
import { useActiveWeb3React } from '../../hooks'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useTokensPrice, useWalletModalToggle } from '../../state/application/hooks'
import { Field } from '../../state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from '../../state/mint/hooks'
import useTokensMarketPrice from 'hooks/useTokensMarketPrice'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserSlippageTolerance } from '../../state/user/hooks'
import { StyledInternalLink, TYPE } from '../../theme'
import { calculateGasMargin, calculateSlippageAmount, formattedNum, getRouterContract } from '../../utils'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { wrappedCurrency } from '../../utils/wrappedCurrency'
import AppBody from '../AppBody'
import { Dots, Wrapper } from '../Pool/styleds'
import { ConfirmAddModalBottom } from 'components/ConfirmAddModalBottom'
import { currencyId } from '../../utils/currencyId'
import { PoolPriceBar, PoolPriceRangeBarToggle } from 'components/PoolPriceBar'
import QuestionHelper from 'components/QuestionHelper'
import { parseUnits } from 'ethers/lib/utils'
import isZero from 'utils/isZero'
import { useCurrencyConvertedToNative, feeRangeCalc, convertToNativeTokenFromETH } from 'utils/dmm'
import Loader from 'components/Loader'
import CurrentPrice from 'components/CurrentPrice'

const ActiveText = styled.div`
  font-weight: 500;
  font-size: 20px;
`

const RowFlat2 = (props: { children: React.ReactNode }) => {
  return (
    <div style={{ marginTop: '1rem' }}>
      <RowFlat>{props.children}</RowFlat>
    </div>
  )
}

const Section = styled(Card)`
  padding: 16px;
  border: 1px solid ${({ theme }) => theme.border4};
  border-radius: 8px;
`

const USDPrice = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: normal;
  letter-spacing: normal;
  padding-left: 8px;
  color: ${({ theme }) => theme.primaryText2};
`

const Warning = styled.div`
  display: flex;
  background: ${({ theme }) => `${theme.warning}20`};
  border-radius: 0.625rem;
  padding: 0.75rem 1rem;
`

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, pairAddress }
  }
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string; pairAddress: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const currencyAIsETHER = !!(chainId && currencyA && currencyEquals(currencyA, ETHER))
  const currencyAIsWETH = !!(chainId && currencyA && currencyEquals(currencyA, WETH[chainId]))
  const currencyBIsETHER = !!(chainId && currencyB && currencyEquals(currencyB, ETHER))
  const currencyBIsWETH = !!(chainId && currencyB && currencyEquals(currencyB, WETH[chainId]))

  const oneCurrencyIsWETH = currencyBIsWETH || currencyAIsWETH

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const expertMode = useIsExpertMode()

  // mint state
  const { independentField, typedValue, otherTypedValue } = useMintState()
  const {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    poolTokenPercentage,
    error,
    unAmplifiedPairAddress
  } = useDerivedMintInfo(currencyA ?? undefined, currencyB ?? undefined, pairAddress)

  const nativeA = useCurrencyConvertedToNative(currencies[Field.CURRENCY_A])
  const nativeB = useCurrencyConvertedToNative(currencies[Field.CURRENCY_B])

  const amp = pair?.amp || JSBI.BigInt(0)

  const ampConvertedInBps = !!amp.toString()
    ? new Fraction(JSBI.BigInt(parseUnits(amp.toString() || '1', 20)), JSBI.BigInt(parseUnits('1', 16)))
    : undefined

  const linkToUnamplifiedPool =
    !!ampConvertedInBps &&
    ampConvertedInBps.equalTo(JSBI.BigInt(10000)) &&
    !!unAmplifiedPairAddress &&
    !isZero(unAmplifiedPairAddress)
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !error

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm
  // txn values
  const deadline = useTransactionDeadline() // custom from users settings
  const [allowedSlippage] = useUserSlippageTolerance() // custom from users
  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? ''
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field])
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0')
      }
    },
    {}
  )
  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_A],
    !!chainId ? ROUTER_ADDRESSES[chainId] : undefined
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    parsedAmounts[Field.CURRENCY_B],
    !!chainId ? ROUTER_ADDRESSES[chainId] : undefined
  )

  const addTransaction = useTransactionAdder()
  async function onAdd() {
    // if (!pair) return
    if (!chainId || !library || !account) return
    const router = getRouterContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0]
    }
    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null

    if (!pair) return

    if (currencyA === ETHER || currencyB === ETHER) {
      const tokenBIsETH = currencyB === ETHER

      const virtualReserveToken = pair.virtualReserveOf(
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId) as Token
      )
      const virtualReserveETH = pair.virtualReserveOf(
        wrappedCurrency(tokenBIsETH ? currencyB : currencyA, chainId) as Token
      )

      const currentRate = JSBI.divide(
        JSBI.multiply(virtualReserveETH.raw, JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(112))),
        virtualReserveToken.raw
      )

      const allowedSlippageAmount = JSBI.divide(
        JSBI.multiply(currentRate, JSBI.BigInt(allowedSlippage)),
        JSBI.BigInt(10000)
      )

      const vReserveRatioBounds = [
        JSBI.subtract(currentRate, allowedSlippageAmount).toString(),
        JSBI.add(currentRate, allowedSlippageAmount).toString()
      ]

      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH
      args = [
        wrappedCurrency(tokenBIsETH ? currencyA : currencyB, chainId)?.address ?? '', // token
        pair.address,
        // 40000,                                                                              //ampBps
        (tokenBIsETH ? parsedAmountA : parsedAmountB).raw.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        vReserveRatioBounds,
        account,
        deadline.toHexString()
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).raw.toString())
    } else {
      const virtualReserveA = pair.virtualReserveOf(wrappedCurrency(currencyA, chainId) as Token)
      const virtualReserveB = pair.virtualReserveOf(wrappedCurrency(currencyB, chainId) as Token)

      const currentRate = JSBI.divide(
        JSBI.multiply(virtualReserveB.raw, JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(112))),
        virtualReserveA.raw
      )

      const allowedSlippageAmount = JSBI.divide(
        JSBI.multiply(currentRate, JSBI.BigInt(allowedSlippage)),
        JSBI.BigInt(10000)
      )

      const vReserveRatioBounds = [
        JSBI.subtract(currentRate, allowedSlippageAmount).toString(),
        JSBI.add(currentRate, allowedSlippageAmount).toString()
      ]

      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        wrappedCurrency(currencyA, chainId)?.address ?? '',
        wrappedCurrency(currencyB, chainId)?.address ?? '',
        pair.address,
        // 40000,                                                                              //ampBps
        parsedAmountA.raw.toString(),
        parsedAmountB.raw.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        vReserveRatioBounds,
        account,
        deadline.toHexString()
      ]
      value = null
    }

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit)
        }).then(response => {
          const cA = currencies[Field.CURRENCY_A]
          const cB = currencies[Field.CURRENCY_B]
          if (!!cA && !!cB) {
            setAttemptingTxn(false)
            addTransaction(response, {
              summary:
                'Add ' +
                parsedAmounts[Field.CURRENCY_A]?.toSignificant(3) +
                ' ' +
                convertToNativeTokenFromETH(cA, chainId).symbol +
                ' and ' +
                parsedAmounts[Field.CURRENCY_B]?.toSignificant(3) +
                ' ' +
                convertToNativeTokenFromETH(cB, chainId).symbol
            })

            setTxHash(response.hash)
          }
        })
      )
      .catch(error => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const modalHeader = () => {
    return (
      <AutoColumn gap="5px">
        <RowFlat style={{ marginTop: '20px' }}>
          <Text fontSize="24px" fontWeight={500} lineHeight="42px" marginRight={10}>
            {liquidityMinted?.toSignificant(6)}
          </Text>
        </RowFlat>
        <Row>
          <Text fontSize="24px">{'DMM ' + nativeA?.symbol + '/' + nativeB?.symbol + ' LP Tokens'}</Text>
        </Row>
        <TYPE.italic fontSize={12} textAlign="left" padding={'8px 0 0 0 '}>
          {`Output is estimated. If the price changes by more than ${allowedSlippage /
            100}% your transaction will revert.`}
        </TYPE.italic>
      </AutoColumn>
    )
  }

  const modalBottom = () => {
    return (
      <ConfirmAddModalBottom
        pair={pair}
        price={price}
        currencies={currencies}
        parsedAmounts={parsedAmounts}
        noLiquidity={false}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
        amplification={ampConvertedInBps}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    nativeA?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${nativeB?.symbol}`

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  const realPercentToken0 = pair
    ? pair.reserve0
        .divide(pair.virtualReserve0)
        .multiply('100')
        .divide(pair.reserve0.divide(pair.virtualReserve0).add(pair.reserve1.divide(pair.virtualReserve1)))
    : new Fraction(JSBI.BigInt(50))

  const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  const percentToken0 = realPercentToken0.toSignificant(4)
  const percentToken1 = realPercentToken1.toSignificant(4)

  const [showInverted, setShowInverted] = useState<boolean>(false)
  const currentPrice = pair
    ? new Price(pair.token0 as Currency, pair.token1 as Currency, pair.virtualReserve0.raw, pair.virtualReserve1.raw)
    : undefined

  const tokens = useMemo(
    () =>
      [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]].map(currency => wrappedCurrency(currency, chainId)),
    [chainId, currencies]
  )

  const usdPrices = useTokensPrice(tokens)
  const marketPrices = useTokensMarketPrice(tokens)

  const poolRatio = Number(pairAddress ? currentPrice?.toSignificant(6) : price?.toSignificant(6))
  const marketRatio = marketPrices[1] && marketPrices[0] / marketPrices[1]

  const showSanityPriceWarning = !!(poolRatio && marketRatio && Math.abs(poolRatio - marketRatio) / marketRatio > 0.05)

  return (
    <>
      <AppBody>
        <AddRemoveTabs creating={false} adding={true} />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            content={() =>
              !linkToUnamplifiedPool ? (
                <ConfirmationModalContent
                  title={t`You will receive`}
                  onDismiss={handleDismissConfirmation}
                  topContent={modalHeader}
                  bottomContent={modalBottom}
                />
              ) : (
                <ConfirmationModalContent
                  title={'Unamplified Pool existed'}
                  onDismiss={handleDismissConfirmation}
                  topContent={() => {
                    return null
                  }}
                  bottomContent={() => {
                    return (
                      <>
                        Please use the link below if you want to add liquidity to Unamplified Pool
                        <StyledInternalLink
                          onClick={handleDismissConfirmation}
                          id="unamplified-pool-link"
                          to={`/add/${currencyIdA}/${currencyIdB}/${unAmplifiedPairAddress}`}
                        >
                          Go to unamplified pool
                        </StyledInternalLink>
                      </>
                    )
                  }}
                />
              )
            }
            pendingText={pendingText}
          />
          <AutoColumn gap="20px">
            <div>
              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_A]}
                onUserInput={onFieldAInput}
                onMax={() => {
                  onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                currency={currencies[Field.CURRENCY_A]}
                id="add-liquidity-input-tokena"
                disableCurrencySelect={true}
                showCommonBases
              />
              <Flex justifyContent="space-between" alignItems="center" marginTop="0.5rem">
                <USDPrice>
                  {usdPrices[0] ? `1 ${nativeA?.symbol} = ${formattedNum(usdPrices[0].toString(), true)}` : <Loader />}
                </USDPrice>

                {pairAddress && chainId && (currencyAIsWETH || currencyAIsETHER) && (
                  <StyledInternalLink
                    replace
                    to={`/add/${
                      currencyAIsETHER ? currencyId(WETH[chainId], chainId) : currencyId(ETHER, chainId)
                    }/${currencyIdB}/${pairAddress}`}
                  >
                    {currencyAIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                  </StyledInternalLink>
                )}
              </Flex>
            </div>
            <ColumnCenter>
              <Plus size="16" color={theme.text2} />
            </ColumnCenter>
            <div>
              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_B]}
                onUserInput={onFieldBInput}
                onMax={() => {
                  onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                }}
                showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                currency={currencies[Field.CURRENCY_B]}
                disableCurrencySelect={true}
                id="add-liquidity-input-tokenb"
                showCommonBases
              />
              <Flex justifyContent="space-between" alignItems="center" marginTop="0.5rem">
                <USDPrice>
                  {usdPrices[1] ? `1 ${nativeB?.symbol} = ${formattedNum(usdPrices[1].toString(), true)}` : <Loader />}
                </USDPrice>

                {pairAddress && chainId && (currencyBIsWETH || currencyBIsETHER) && (
                  <StyledInternalLink
                    replace
                    to={`/add/${currencyIdA}/${
                      currencyBIsETHER ? currencyId(WETH[chainId], chainId) : currencyId(ETHER, chainId)
                    }/${pairAddress}`}
                  >
                    {currencyBIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                  </StyledInternalLink>
                )}
              </Flex>
            </div>

            {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
              <Section padding="0px" borderRadius={'20px'}>
                <Row padding="0 0 1rem 0">
                  <TYPE.subHeader fontWeight={500} fontSize={14} color={theme.subText}>
                    <Trans>Prices and Pool share</Trans>
                  </TYPE.subHeader>
                </Row>

                {!noLiquidity && (
                  <AutoRow justify="space-between" gap="4px" style={{ paddingBottom: '12px' }}>
                    <TYPE.subHeader fontWeight={500} fontSize={14} color={theme.subText}>
                      <Trans>Current Price:</Trans>
                    </TYPE.subHeader>
                    <TYPE.black fontWeight={500} fontSize={14}>
                      <CurrentPrice
                        price={currentPrice}
                        showInverted={showInverted}
                        setShowInverted={setShowInverted}
                      />
                    </TYPE.black>
                  </AutoRow>
                )}

                <AutoRow justify="space-between" gap="4px" style={{ paddingBottom: '12px' }}>
                  <TYPE.subHeader fontWeight={500} fontSize={14} color={theme.subText}>
                    <Trans>Inventory ratio:</Trans>
                  </TYPE.subHeader>
                  <TYPE.black fontWeight={500} fontSize={14}>
                    {percentToken0}% {pair?.token0.symbol} - {percentToken1}% {pair?.token1.symbol}
                  </TYPE.black>
                </AutoRow>

                <PoolPriceBar
                  currencies={currencies}
                  poolTokenPercentage={poolTokenPercentage}
                  noLiquidity={noLiquidity}
                  price={price}
                  pair={pair}
                />
              </Section>
            )}

            <RowFlat2>
              <ActiveText>
                AMP
                {!!pair ? <>&nbsp;=&nbsp;{new Fraction(pair.amp).divide(JSBI.BigInt(10000)).toSignificant(5)}</> : ''}
              </ActiveText>
              <QuestionHelper
                text={t({
                  id:
                    'Amplification Factor. Higher AMP, higher capital efficiency within a price range. Higher AMP recommended for more stable pairs, lower AMP for more volatile pairs.',
                  message:
                    'Amplification Factor. Higher AMP, higher capital efficiency within a price range. Higher AMP recommended for more stable pairs, lower AMP for more volatile pairs.'
                })}
              />
            </RowFlat2>

            {currencies[Field.CURRENCY_A] &&
              currencies[Field.CURRENCY_B] &&
              pairState !== PairState.INVALID &&
              (!!pairAddress || +amp >= 1) && (
                <PoolPriceRangeBarToggle
                  pair={pair}
                  currencies={currencies}
                  price={price}
                  amplification={ampConvertedInBps}
                />
              )}

            {(!!pairAddress || +amp >= 1) && (
              <Section>
                <AutoRow>
                  <Text fontWeight={500} fontSize={14} color={theme.text2}>
                    <Trans>Dynamic Fee Range</Trans>:{' '}
                    {feeRangeCalc(
                      !!pair?.amp ? +new Fraction(pair.amp).divide(JSBI.BigInt(10000)).toSignificant(5) : +amp
                    )}
                  </Text>
                  <QuestionHelper
                    text={t`Fees are adjusted dynamically according to market conditions to maximise returns for liquidity providers.`}
                  />
                </AutoRow>
              </Section>
            )}

            {showSanityPriceWarning && (
              <Warning>
                <AlertTriangle color={theme.yellow2} />
                <Text fontSize="0.75rem" marginLeft="0.75rem">
                  <Trans>The price is deviating quite a lot from that market price, please be careful!</Trans>
                </Text>
              </Warning>
            )}

            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>
                <Trans>Connect Wallet</Trans>
              </ButtonLight>
            ) : (
              <AutoColumn gap={'md'}>
                {(approvalA === ApprovalState.NOT_APPROVED ||
                  approvalA === ApprovalState.PENDING ||
                  approvalB === ApprovalState.NOT_APPROVED ||
                  approvalB === ApprovalState.PENDING) &&
                  isValid && (
                    <RowBetween>
                      {approvalA !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveACallback}
                          disabled={approvalA === ApprovalState.PENDING}
                          width={approvalB !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalA === ApprovalState.PENDING ? (
                            <Dots>Approving {currencies[Field.CURRENCY_A]?.symbol}</Dots>
                          ) : (
                            'Approve ' + currencies[Field.CURRENCY_A]?.symbol
                          )}
                        </ButtonPrimary>
                      )}
                      {approvalB !== ApprovalState.APPROVED && (
                        <ButtonPrimary
                          onClick={approveBCallback}
                          disabled={approvalB === ApprovalState.PENDING}
                          width={approvalA !== ApprovalState.APPROVED ? '48%' : '100%'}
                        >
                          {approvalB === ApprovalState.PENDING ? (
                            <Dots>Approving {currencies[Field.CURRENCY_B]?.symbol}</Dots>
                          ) : (
                            'Approve ' + currencies[Field.CURRENCY_B]?.symbol
                          )}
                        </ButtonPrimary>
                      )}
                    </RowBetween>
                  )}

                <ButtonError
                  onClick={() => {
                    expertMode ? onAdd() : setShowConfirm(true)
                  }}
                  disabled={!isValid || approvalA !== ApprovalState.APPROVED || approvalB !== ApprovalState.APPROVED}
                  error={
                    !isValid &&
                    !!parsedAmounts[Field.CURRENCY_A] &&
                    !!parsedAmounts[Field.CURRENCY_B] &&
                    !!(pairAddress && +amp < 1)
                  }
                >
                  <Text fontSize={20} fontWeight={500}>
                    {error ?? (!pairAddress && +amp < 1 ? 'Enter amp (>=1)' : 'Supply')}
                  </Text>
                </ButtonError>
              </AutoColumn>
            )}
          </AutoColumn>
        </Wrapper>
      </AppBody>

      {pair && !noLiquidity && pairState !== PairState.INVALID ? (
        <AutoColumn style={{ minWidth: '20rem', width: '100%', maxWidth: '425px', marginTop: '24px' }}>
          <MinimalPositionCard showUnwrapped={oneCurrencyIsWETH} pair={pair} />
        </AutoColumn>
      ) : null}
    </>
  )
}
