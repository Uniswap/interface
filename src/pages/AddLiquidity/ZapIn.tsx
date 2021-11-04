import React, { useCallback, useContext, useMemo, useState } from 'react'
import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { parseUnits } from 'ethers/lib/utils'
import { AlertTriangle } from 'react-feather'
import { Text, Flex } from 'rebass'
import { ThemeContext } from 'styled-components'
import { t, Trans } from '@lingui/macro'

import {
  computePriceImpact,
  Currency,
  CurrencyAmount,
  currencyEquals,
  ETHER,
  Fraction,
  JSBI,
  TokenAmount,
  WETH
} from '@dynamic-amm/sdk'
import { ZAP_ADDRESSES } from 'constants/index'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Row, { AutoRow, RowBetween, RowFlat } from 'components/Row'
import { PoolPriceBar, PoolPriceRangeBar, ToggleComponent } from 'components/PoolPriceBar'
import QuestionHelper from 'components/QuestionHelper'
import Loader from 'components/Loader'
import CurrentPrice from 'components/CurrentPrice'
import CurrencyLogo from 'components/CurrencyLogo'
import FormattedPriceImpact from 'components/swap/FormattedPriceImpact'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent
} from 'components/TransactionConfirmationModal'
import { ConfirmAddModalBottom } from 'components/ConfirmAddModalBottom'
import ZapError from 'components/ZapError'
import { PairState } from '../../data/Reserves'
import { useActiveWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import useTokensMarketPrice from 'hooks/useTokensMarketPrice'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/mint/actions'
import { useDerivedZapInInfo, useMintState, useZapInActionHandlers } from 'state/mint/hooks'
import { useIsExpertMode, useUserSlippageTolerance } from 'state/user/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { StyledInternalLink, TYPE, UppercaseText } from 'theme'
import { calculateGasMargin, formattedNum, getZapContract } from 'utils'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { wrappedCurrency } from 'utils/wrappedCurrency'
import { currencyId } from 'utils/currencyId'
import isZero from 'utils/isZero'
import { useCurrencyConvertedToNative, feeRangeCalc } from 'utils/dmm'
import { computePriceImpactWithoutFee, warningSeverity } from 'utils/prices'
import { Dots, Wrapper } from '../Pool/styleds'
import {
  ActiveText,
  Section,
  USDPrice,
  Warning,
  TokenWrapper,
  SecondColumn,
  GridColumn,
  FirstColumn,
  DetailBox,
  CurrentPriceWrapper,
  PoolRatioWrapper,
  DynamicFeeRangeWrapper
} from './styled'

const ZapIn = ({
  currencyIdA,
  currencyIdB,
  pairAddress
}: {
  currencyIdA: string
  currencyIdB: string
  pairAddress: string
}) => {
  const { account, library, chainId } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const [zapInError, setZapInError] = useState<string>('')

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
    insufficientLiquidity,
    error,
    unAmplifiedPairAddress
  } = useDerivedZapInInfo(currencyA ?? undefined, currencyB ?? undefined, pairAddress)

  const nativeA = useCurrencyConvertedToNative(currencies[Field.CURRENCY_A])
  const nativeB = useCurrencyConvertedToNative(currencies[Field.CURRENCY_B])

  const selectedCurrencyIsETHER = !!(
    chainId &&
    currencies[independentField] &&
    currencyEquals(currencies[independentField] as Currency, ETHER)
  )

  const selectedCurrencyIsWETH = !!(
    chainId &&
    currencies[independentField] &&
    currencyEquals(currencies[independentField] as Currency, WETH[chainId])
  )

  const amp = pair?.amp || JSBI.BigInt(0)

  const ampConvertedInBps = !!amp.toString()
    ? new Fraction(JSBI.BigInt(parseUnits(amp.toString() || '1', 20)), JSBI.BigInt(parseUnits('1', 16)))
    : undefined

  const linkToUnamplifiedPool =
    !!ampConvertedInBps &&
    ampConvertedInBps.equalTo(JSBI.BigInt(10000)) &&
    !!unAmplifiedPairAddress &&
    !isZero(unAmplifiedPairAddress)
  const { onFieldInput, onSwitchField } = useZapInActionHandlers()

  const isValid = !error && !insufficientLiquidity

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
  const amountToApprove = tryParseAmount(typedValue, currencies[independentField])

  const [approval, approveCallback] = useApproveCallback(
    amountToApprove,
    !!chainId ? ZAP_ADDRESSES[chainId] : undefined
  )

  const userInCurrencyAmount: CurrencyAmount | undefined = useMemo(() => {
    return tryParseAmount(typedValue, currencies[independentField], true)
  }, [currencies, independentField, typedValue])

  const userIn = useMemo(() => {
    return userInCurrencyAmount ? BigNumber.from(userInCurrencyAmount.raw.toString()) : undefined
  }, [userInCurrencyAmount])

  const minLPQty = !liquidityMinted
    ? JSBI.BigInt(0)
    : JSBI.divide(JSBI.multiply(liquidityMinted?.raw, JSBI.BigInt(10000 - allowedSlippage)), JSBI.BigInt(10000))

  const addTransaction = useTransactionAdder()
  async function onZapIn() {
    if (!chainId || !library || !account) return
    const zapContract = getZapContract(chainId, library, account)

    if (!chainId || !account) {
      return
    }

    const tokenIn = wrappedCurrency(currencies[independentField], chainId)
    const tokenOut = wrappedCurrency(currencies[dependentField], chainId)

    if (!pair || !pair.address || !deadline || !tokenIn || !tokenOut || !userIn) {
      return
    }

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null

    if (!pair) return

    if (currencies[independentField] === ETHER) {
      estimate = zapContract.estimateGas.zapInEth
      method = zapContract.zapInEth
      args = [tokenOut.address, pair.address, account, minLPQty.toString(), deadline.toHexString()]
      value = userIn
    } else {
      estimate = zapContract.estimateGas.zapIn
      method = zapContract.zapIn
      args = [
        tokenIn.address,
        tokenOut.address,
        userIn.toString(),
        pair.address,
        account,
        minLPQty.toString(),
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
        }).then(tx => {
          const cA = currencies[Field.CURRENCY_A]
          const cB = currencies[Field.CURRENCY_B]
          if (!!cA && !!cB) {
            setAttemptingTxn(false)
            addTransaction(tx, {
              summary: t`Add liquidity for single token ${
                independentField === Field.CURRENCY_A ? nativeA?.symbol : nativeB?.symbol
              } with amount of ${userInCurrencyAmount?.toSignificant(4)}`
            })

            setTxHash(tx.hash)
          }
        })
      )
      .catch(err => {
        setAttemptingTxn(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (err?.code !== 4001) {
          console.error(err)
        }

        if (err.message.includes('INSUFFICIENT_MINT_QTY')) {
          setZapInError(t`Insufficient liquidity available. Please reload page and try again!`)
        } else {
          setZapInError(err?.message)
        }
      })
  }

  const pendingText = `Supplying ${userInCurrencyAmount?.toSignificant(6)} ${currencies[independentField]?.symbol}`

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldInput('')
    }
    setZapInError('')
    setTxHash('')
  }, [onFieldInput, txHash])

  const realPercentToken0 = pair
    ? pair.reserve0
        .divide(pair.virtualReserve0)
        .multiply('100')
        .divide(pair.reserve0.divide(pair.virtualReserve0).add(pair.reserve1.divide(pair.virtualReserve1)))
    : new Fraction(JSBI.BigInt(50))

  const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  const percentToken0 = realPercentToken0.toSignificant(4)
  const percentToken1 = realPercentToken1.toSignificant(4)

  const tokens = useMemo(
    () =>
      [currencies[independentField], currencies[dependentField]].map(currency => wrappedCurrency(currency, chainId)),
    [chainId, currencies, dependentField, independentField]
  )

  const usdPrices = useTokensPrice(tokens)
  const marketPrices = useTokensMarketPrice(tokens)

  const poolPrice = Number(price?.toSignificant(6))
  const marketPrice = marketPrices[1] && marketPrices[0] / marketPrices[1]

  const showSanityPriceWarning = !!(poolPrice && marketPrice && Math.abs(poolPrice - marketPrice) / marketPrice > 0.05)

  const handleSwitchCurrency = useCallback(() => {
    onSwitchField()
  }, [onSwitchField])

  const estimatedUsd =
    userInCurrencyAmount && usdPrices[0] ? parseFloat(userInCurrencyAmount.toSignificant(6)) * usdPrices[0] : 0

  const tokenAPoolAllocUsd =
    usdPrices[0] &&
    parsedAmounts &&
    parsedAmounts[independentField] &&
    usdPrices[0] * parseFloat((parsedAmounts[independentField] as CurrencyAmount).toSignificant(6))

  const tokenBPoolAllocUsd =
    usdPrices[1] &&
    parsedAmounts &&
    parsedAmounts[dependentField] &&
    usdPrices[1] * parseFloat((parsedAmounts[dependentField] as CurrencyAmount).toSignificant(6))

  const priceImpact =
    price &&
    userInCurrencyAmount &&
    parsedAmounts[independentField] &&
    parsedAmounts[dependentField] &&
    !userInCurrencyAmount.lessThan(parsedAmounts[independentField] as CurrencyAmount)
      ? computePriceImpact(
          independentField === Field.CURRENCY_A ? price : price.invert(),
          userInCurrencyAmount?.subtract(parsedAmounts[independentField] as CurrencyAmount),
          parsedAmounts[dependentField] as CurrencyAmount
        )
      : undefined

  const priceImpactWithoutFee = pair && priceImpact ? computePriceImpactWithoutFee([pair], priceImpact) : undefined

  // warnings on slippage
  const priceImpactSeverity = warningSeverity(priceImpactWithoutFee)

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
        onAdd={onZapIn}
        poolTokenPercentage={poolTokenPercentage}
        amplification={ampConvertedInBps}
        priceImpact={priceImpactWithoutFee}
      />
    )
  }

  return (
    <Wrapper>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() =>
          zapInError ? (
            <TransactionErrorContent onDismiss={handleDismissConfirmation} message={zapInError} />
          ) : !linkToUnamplifiedPool ? (
            <ConfirmationModalContent
              title={t`You will receive`}
              onDismiss={handleDismissConfirmation}
              topContent={modalHeader}
              bottomContent={modalBottom}
            />
          ) : (
            <ConfirmationModalContent
              title={t`Unamplified Pool existed`}
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
        <GridColumn>
          <FirstColumn>
            <div>
              <CurrencyInputPanel
                value={formattedAmounts[independentField]}
                onUserInput={onFieldInput}
                onMax={() => {
                  onFieldInput(maxAmounts[independentField]?.toExact() ?? '')
                }}
                onSwitchCurrency={handleSwitchCurrency}
                showMaxButton={!atMaxAmounts[independentField]}
                currency={currencies[independentField]}
                id="zap-in-input"
                disableCurrencySelect={false}
                showCommonBases
                positionMax="top"
                isSwitchMode
                estimatedUsd={formattedNum(estimatedUsd.toString(), true) || undefined}
              />
              <Flex justifyContent="space-between" alignItems="center" marginTop="0.5rem">
                <USDPrice>
                  {usdPrices[0] ? (
                    `1 ${currencies[independentField]?.symbol} = ${formattedNum(usdPrices[0].toString(), true)}`
                  ) : (
                    <Loader />
                  )}
                </USDPrice>

                {pairAddress &&
                  chainId &&
                  (selectedCurrencyIsETHER || selectedCurrencyIsWETH) &&
                  currencies[dependentField] && (
                    <StyledInternalLink
                      replace
                      to={
                        independentField === Field.CURRENCY_A
                          ? `/add/${
                              selectedCurrencyIsETHER ? currencyId(WETH[chainId], chainId) : currencyId(ETHER, chainId)
                            }/${currencyId(currencies[dependentField] as Currency, chainId)}/${pairAddress}`
                          : `/add/${currencyId(currencies[dependentField] as Currency, chainId)}/${
                              selectedCurrencyIsETHER ? currencyId(WETH[chainId], chainId) : currencyId(ETHER, chainId)
                            }/${pairAddress}`
                      }
                    >
                      {selectedCurrencyIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                    </StyledInternalLink>
                  )}
              </Flex>
            </div>

            <Section padding="0" marginTop="8px" borderRadius={'20px'}>
              <Row padding="0 0 1rem 0">
                <TYPE.subHeader fontWeight={500} fontSize={16} color={theme.text}>
                  <Trans>Your Pool Allocation</Trans>
                </TYPE.subHeader>
              </Row>

              <DetailBox
                style={{
                  padding: '16px 0',
                  borderTop: `1px dashed ${theme.border4}`,
                  borderBottom: `1px dashed ${theme.border4}`
                }}
              >
                <AutoColumn justify="space-between" gap="4px">
                  <TokenWrapper>
                    <CurrencyLogo currency={currencies[independentField] || undefined} size={'16px'} />
                    <TYPE.subHeader fontWeight={400} fontSize={14} color={theme.subText}>
                      {currencies[independentField]?.symbol}
                    </TYPE.subHeader>
                  </TokenWrapper>
                  <TYPE.black fontWeight={400} fontSize={14}>
                    {parsedAmounts[independentField]?.toSignificant(6)} (~
                    {formattedNum((tokenAPoolAllocUsd || 0).toString(), true)})
                  </TYPE.black>
                </AutoColumn>

                <AutoColumn justify="space-between" gap="4px">
                  <TokenWrapper>
                    <CurrencyLogo currency={currencies[dependentField] || undefined} size={'16px'} />
                    <TYPE.subHeader fontWeight={400} fontSize={14} color={theme.subText}>
                      {currencies[dependentField]?.symbol}
                    </TYPE.subHeader>
                  </TokenWrapper>
                  <TYPE.black fontWeight={400} fontSize={14}>
                    {parsedAmounts[dependentField]?.toSignificant(6)} (~
                    {formattedNum((tokenBPoolAllocUsd || 0).toString(), true)})
                  </TYPE.black>
                </AutoColumn>
              </DetailBox>

              <DetailBox style={{ paddingTop: '16px' }}>
                <TYPE.subHeader fontWeight={400} fontSize={14} color={theme.subText}>
                  <Trans>Price Impact</Trans>
                </TYPE.subHeader>
                <TYPE.black fontWeight={400} fontSize={14}>
                  <FormattedPriceImpact priceImpact={priceImpactWithoutFee} />
                </TYPE.black>
              </DetailBox>

              {/* <AutoRow justify="space-between" gap="4px" style={{ paddingBottom: '12px' }}>
                <TYPE.subHeader fontWeight={400} fontSize={14} color={theme.subText}>
                  <Trans>Est. received</Trans>:
                </TYPE.subHeader>
                <TYPE.black fontWeight={400} fontSize={14}>
                  {liquidityMinted?.toSignificant(6)} LP (~
                  {tokenAPoolAllocUsd &&
                    tokenBPoolAllocUsd &&
                    formattedNum((tokenAPoolAllocUsd + tokenBPoolAllocUsd).toString(), true)}
                  )
                </TYPE.black>
              </AutoRow> */}
            </Section>

            {currencies[independentField] && currencies[dependentField] && pairState !== PairState.INVALID && (
              <Section padding="0" borderRadius={'20px'} style={{ marginTop: '8px' }}>
                <PoolPriceBar
                  currencies={currencies}
                  poolTokenPercentage={poolTokenPercentage}
                  noLiquidity={noLiquidity}
                  price={price}
                  pair={pair}
                />
              </Section>
            )}
          </FirstColumn>

          <SecondColumn>
            {currencies[independentField] && currencies[dependentField] && pairState !== PairState.INVALID && (
              <Section borderRadius={'20px'} marginBottom="28px">
                <ToggleComponent title={t`Pool Information`}>
                  <AutoRow padding="16px 0" style={{ borderBottom: `1px dashed ${theme.border4}`, gap: '1rem' }}>
                    {!noLiquidity && (
                      <CurrentPriceWrapper>
                        <TYPE.subHeader fontWeight={500} fontSize={12} color={theme.subText}>
                          <UppercaseText>
                            <Trans>Current Price</Trans>
                          </UppercaseText>
                        </TYPE.subHeader>
                        <TYPE.black fontWeight={400} fontSize={14} color={theme.text}>
                          <CurrentPrice price={price} />
                        </TYPE.black>
                      </CurrentPriceWrapper>
                    )}

                    <PoolRatioWrapper>
                      <TYPE.subHeader fontWeight={500} fontSize={12} color={theme.subText}>
                        <UppercaseText>
                          <Trans>Pool Ratio</Trans>
                        </UppercaseText>
                      </TYPE.subHeader>
                      <TYPE.black fontWeight={400} fontSize={14} color={theme.text}>
                        {percentToken0}% {pair?.token0.symbol} - {percentToken1}% {pair?.token1.symbol}
                      </TYPE.black>
                    </PoolRatioWrapper>
                  </AutoRow>

                  <AutoRow padding="16px 0" style={{ borderBottom: `1px dashed ${theme.border4}`, gap: '1rem' }}>
                    <AutoColumn style={{ flex: '1' }}>
                      <AutoRow>
                        <Text fontWeight={500} fontSize={12} color={theme.subText}>
                          AMP
                        </Text>
                        <QuestionHelper
                          text={t`Amplification Factor. Higher AMP, higher capital efficiency within a price range. Higher AMP recommended for more stable pairs, lower AMP for more volatile pairs.`}
                        />
                      </AutoRow>
                      <Text fontWeight={400} fontSize={14} color={theme.text}>
                        {!!pair ? <>{new Fraction(pair.amp).divide(JSBI.BigInt(10000)).toSignificant(5)}</> : ''}
                      </Text>
                    </AutoColumn>

                    {(!!pairAddress || +amp >= 1) && (
                      <DynamicFeeRangeWrapper>
                        <AutoRow>
                          <Text fontWeight={500} fontSize={12} color={theme.subText}>
                            <UppercaseText>
                              <Trans>Dynamic Fee Range</Trans>
                            </UppercaseText>
                          </Text>
                          <QuestionHelper
                            text={t`Fees are adjusted dynamically according to market conditions to maximise returns for liquidity providers.`}
                          />
                        </AutoRow>
                        <Text fontWeight={400} fontSize={14} color={theme.text}>
                          {feeRangeCalc(
                            !!pair?.amp ? +new Fraction(pair.amp).divide(JSBI.BigInt(10000)).toSignificant(5) : +amp
                          )}
                        </Text>
                      </DynamicFeeRangeWrapper>
                    )}
                  </AutoRow>

                  {currencies[independentField] && currencies[dependentField] && (!!pairAddress || +amp >= 1) && (
                    <div style={{ padding: '16px 0 0' }}>
                      <AutoRow marginBottom="8px">
                        <UppercaseText>
                          <ActiveText>Active Price Range</ActiveText>
                        </UppercaseText>
                        <QuestionHelper
                          text={t`Tradable token pair price range for this pool based on AMP. If the price goes below or above this range, the pool may become inactive.`}
                        />
                      </AutoRow>

                      <PoolPriceRangeBar
                        currencies={currencies}
                        price={price}
                        pair={pair}
                        amplification={ampConvertedInBps}
                      />
                    </div>
                  )}
                </ToggleComponent>
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

            {insufficientLiquidity ? (
              <ZapError message={t`Insufficient Liquidity in the Liquidity Pool to Swap`} warning={false} />
            ) : priceImpactSeverity > 3 ? (
              <ZapError message={t`Price impact is too high`} warning={false} />
            ) : priceImpactSeverity > 2 ? (
              <ZapError message={t`Price impact is high`} warning={true} />
            ) : null}

            {!account ? (
              <ButtonLight onClick={toggleWalletModal}>
                <Trans>Connect Wallet</Trans>
              </ButtonLight>
            ) : (
              <AutoColumn gap={'md'}>
                {(approval === ApprovalState.NOT_APPROVED || approval === ApprovalState.PENDING) &&
                  isValid &&
                  (expertMode || priceImpactSeverity <= 3) && (
                    <RowBetween>
                      <ButtonPrimary
                        onClick={approveCallback}
                        disabled={
                          !isValid || approval === ApprovalState.PENDING || (priceImpactSeverity > 3 && !expertMode)
                        }
                        width={'100%'}
                      >
                        {approval === ApprovalState.PENDING ? (
                          <Dots>Approving {currencies[independentField]?.symbol}</Dots>
                        ) : (
                          'Approve ' + currencies[independentField]?.symbol
                        )}
                      </ButtonPrimary>
                    </RowBetween>
                  )}

                <ButtonError
                  onClick={() => {
                    expertMode ? onZapIn() : setShowConfirm(true)
                  }}
                  disabled={!isValid || approval !== ApprovalState.APPROVED || (priceImpactSeverity > 3 && !expertMode)}
                  error={
                    !!parsedAmounts[independentField] &&
                    !!parsedAmounts[dependentField] &&
                    !!pairAddress &&
                    (!isValid || priceImpactSeverity > 2)
                  }
                >
                  <Text fontSize={20} fontWeight={500}>
                    {error ??
                      (!pairAddress && +amp < 1
                        ? t`Enter amp (>=1)`
                        : priceImpactSeverity > 3 && !expertMode
                        ? t`Supply`
                        : priceImpactSeverity > 2
                        ? t`Supply Anyway`
                        : t`Supply`)}
                  </Text>
                </ButtonError>
              </AutoColumn>
            )}
          </SecondColumn>
        </GridColumn>
      </AutoColumn>
    </Wrapper>
  )
}

export default ZapIn
