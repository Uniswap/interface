import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Fraction, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { captureException } from '@sentry/react'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { ConfirmAddModalBottom } from 'components/ConfirmAddModalBottom'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import CurrentPrice from 'components/CurrentPrice'
import Loader from 'components/Loader'
import { PoolPriceBar, PoolPriceRangeBar, ToggleComponent } from 'components/PoolPriceBar'
import QuestionHelper from 'components/QuestionHelper'
import Row, { AutoRow, RowBetween, RowFlat } from 'components/Row'
import TransactionConfirmationModal, {
  ConfirmationModalContent,
  TransactionErrorContent,
} from 'components/TransactionConfirmationModal'
import { AMP_HINT } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { PairState } from 'data/Reserves'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useTheme from 'hooks/useTheme'
import useTokensMarketPrice from 'hooks/useTokensMarketPrice'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { Dots, Wrapper } from 'pages/Pool/styleds'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from 'state/mint/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useExpertModeManager, usePairAdderByTokens, useUserSlippageTolerance } from 'state/user/hooks'
import { StyledInternalLink, TYPE, UppercaseText } from 'theme'
import { calculateGasMargin, calculateSlippageAmount, formattedNum } from 'utils'
import { feeRangeCalc, useCurrencyConvertedToNative } from 'utils/dmm'
import {
  getDynamicFeeRouterContract,
  getOldStaticFeeRouterContract,
  getStaticFeeRouterContract,
} from 'utils/getContract'
import isZero from 'utils/isZero'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import {
  ActiveText,
  CurrentPriceWrapper,
  DynamicFeeRangeWrapper,
  FirstColumn,
  GridColumn,
  PoolRatioWrapper,
  SecondColumn,
  Section,
  USDPrice,
  Warning,
} from './styled'

const TokenPair = ({
  currencyIdA,
  currencyIdB,
  pairAddress,
}: {
  currencyIdA: string
  currencyIdB: string
  pairAddress: string
}) => {
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()
  const theme = useTheme()
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  const currencyAIsETHER = !!(chainId && currencyA && currencyA.isNative)
  const currencyAIsWETH = !!(chainId && currencyA && currencyA.equals(WETH[chainId]))
  const currencyBIsETHER = !!(chainId && currencyB && currencyB.isNative)
  const currencyBIsWETH = !!(chainId && currencyB && currencyB.equals(WETH[chainId]))

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const [expertMode] = useExpertModeManager()

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
    unAmplifiedPairAddress,
    isStaticFeePair,
    isOldStaticFeeContract,
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
  const [addLiquidityError, setAddLiquidityError] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: noLiquidity ? otherTypedValue : parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: TokenAmount } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {},
  )

  const routerAddress = isEVM
    ? isStaticFeePair
      ? isOldStaticFeeContract
        ? (networkInfo as EVMNetworkInfo).classic.oldStatic?.router
        : (networkInfo as EVMNetworkInfo).classic.static.router
      : (networkInfo as EVMNetworkInfo).classic.dynamic?.router
    : undefined

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], routerAddress || undefined)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], routerAddress || undefined)

  const addTransactionWithType = useTransactionAdder()
  const addPair = usePairAdderByTokens()

  async function onAdd() {
    // if (!pair) return
    if (!chainId || !library || !account) return
    const router = isStaticFeePair
      ? isOldStaticFeeContract
        ? getOldStaticFeeRouterContract(chainId, library, account)
        : getStaticFeeRouterContract(chainId, library, account)
      : getDynamicFeeRouterContract(chainId, library, account)

    const { [Field.CURRENCY_A]: parsedAmountA, [Field.CURRENCY_B]: parsedAmountB } = parsedAmounts
    if (!parsedAmountA || !parsedAmountB || !currencyA || !currencyB || !deadline) {
      return
    }

    const amountsMin = {
      [Field.CURRENCY_A]: calculateSlippageAmount(parsedAmountA, noLiquidity ? 0 : allowedSlippage)[0],
      [Field.CURRENCY_B]: calculateSlippageAmount(parsedAmountB, noLiquidity ? 0 : allowedSlippage)[0],
    }

    let estimate,
      method: (...args: any) => Promise<TransactionResponse>,
      args: Array<string | string[] | number>,
      value: BigNumber | null

    if (!pair) return

    if (currencyA.isNative || currencyB.isNative) {
      const tokenBIsETH = currencyB.isNative

      const virtualReserveToken = pair.virtualReserveOf(tokenBIsETH ? currencyA?.wrapped : currencyB?.wrapped)
      const virtualReserveETH = pair.virtualReserveOf(tokenBIsETH ? currencyB?.wrapped : currencyA?.wrapped)

      const currentRate = JSBI.divide(
        JSBI.multiply(virtualReserveETH.quotient, JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(112))),
        virtualReserveToken.quotient,
      )

      const allowedSlippageAmount = JSBI.divide(
        JSBI.multiply(currentRate, JSBI.BigInt(allowedSlippage)),
        JSBI.BigInt(10000),
      )

      const vReserveRatioBounds = [
        JSBI.subtract(currentRate, allowedSlippageAmount).toString(),
        JSBI.add(currentRate, allowedSlippageAmount).toString(),
      ]

      estimate = router.estimateGas.addLiquidityETH
      method = router.addLiquidityETH

      args = [
        (tokenBIsETH ? currencyA?.wrapped : currencyB?.wrapped)?.address ?? '', // token
        pair.address,
        // 40000,                                                                              //ampBps
        (tokenBIsETH ? parsedAmountA : parsedAmountB).quotient.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        vReserveRatioBounds,
        account,
        deadline.toHexString(),
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).quotient.toString())
    } else {
      const virtualReserveA = pair.virtualReserveOf(currencyA?.wrapped)
      const virtualReserveB = pair.virtualReserveOf(currencyB?.wrapped)

      const currentRate = JSBI.divide(
        JSBI.multiply(virtualReserveB.quotient, JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(112))),
        virtualReserveA.quotient,
      )

      const allowedSlippageAmount = JSBI.divide(
        JSBI.multiply(currentRate, JSBI.BigInt(allowedSlippage)),
        JSBI.BigInt(10000),
      )

      const vReserveRatioBounds = [
        JSBI.subtract(currentRate, allowedSlippageAmount).toString(),
        JSBI.add(currentRate, allowedSlippageAmount).toString(),
      ]

      estimate = router.estimateGas.addLiquidity
      method = router.addLiquidity
      args = [
        currencyA?.wrapped.address ?? '',
        currencyB?.wrapped.address ?? '',
        pair.address,
        // 40000,                                                                              //ampBps
        parsedAmountA.quotient.toString(),
        parsedAmountB.quotient.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        vReserveRatioBounds,
        account,
        deadline.toHexString(),
      ]
      value = null
    }

    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit =>
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        }).then(response => {
          const cA = currencies[Field.CURRENCY_A]
          const cB = currencies[Field.CURRENCY_B]
          if (!!cA && !!cB) {
            const tokenAmountIn = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? ''
            const tokenAmountOut = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? ''
            setAttemptingTxn(false)
            addTransactionWithType({
              hash: response.hash,
              type: TRANSACTION_TYPE.CLASSIC_ADD_LIQUIDITY,
              extraInfo: {
                tokenSymbolIn: cA.symbol ?? '',
                tokenSymbolOut: cB.symbol ?? '',
                tokenAmountIn,
                tokenAmountOut,
                tokenAddressIn: cA.wrapped.address,
                tokenAddressOut: cB.wrapped.address,
                contract: pairAddress,
                arbitrary: {
                  poolAddress: pairAddress,
                  token_1: cA.symbol,
                  token_2: cB.symbol,
                  add_liquidity_method: 'token pair',
                  amp: new Fraction(amp).divide(JSBI.BigInt(10000)).toSignificant(5),
                  txHash: response.hash,
                },
              },
            })
            setTxHash(response.hash)
            const tA = cA.wrapped
            const tB = cB.wrapped
            if (!!tA && !!tB) {
              // In case subgraph sync is slow, doing this will show the pool in "My Pools" page.
              addPair(tA, tB)
            }
          }
        }),
      )
      .catch(err => {
        setAttemptingTxn(false)
        const e = new Error('Classic: Add liquidity Error', { cause: err })
        e.name = 'AddLiquidityError'
        captureException(e, { extra: { args } })
        // we only care if the error is something _other_ than the user rejected the tx
        if (err?.code !== 4001) {
          console.error(err)
        }

        if (err.message.includes('INSUFFICIENT')) {
          setAddLiquidityError(t`Insufficient liquidity available. Please reload page and try again!`)
        } else {
          setAddLiquidityError(err?.message)
        }
      })
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
    setAddLiquidityError('')
  }, [onFieldAInput, txHash])

  const realPercentToken0 = pair
    ? pair.reserve0.asFraction
        .divide(pair.virtualReserve0)
        .multiply('100')
        .divide(
          pair.reserve0
            .divide(pair.virtualReserve0)
            .asFraction.add(pair.reserve1.divide(pair.virtualReserve1).asFraction),
        )
    : new Fraction(JSBI.BigInt(50))

  const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  const percentToken0 = realPercentToken0.toSignificant(4)
  const percentToken1 = realPercentToken1.toSignificant(4)

  const tokens = useMemo(
    () => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]].map(currency => currency?.wrapped),
    [currencies],
  )

  const usdPrices = useTokensPrice(tokens)
  const marketPrices = useTokensMarketPrice(tokens)

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[0]
      ? parseFloat((parsedAmounts[Field.CURRENCY_A] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[0]
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[1]
      ? parseFloat((parsedAmounts[Field.CURRENCY_B] as CurrencyAmount<Currency>).toSignificant(6)) * usdPrices[1]
      : 0

  const poolPrice = Number(price?.toSignificant(6))
  const marketPrice = marketPrices[1] && marketPrices[0] / marketPrices[1]

  const showSanityPriceWarning = !!(poolPrice && marketPrice && Math.abs(poolPrice - marketPrice) / marketPrice > 0.05)
  const navigate = useNavigate()

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
          {t`Output is estimated. If the price changes by more than ${
            allowedSlippage / 100
          }% your transaction will revert.`}
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
        estimatedUsd={[estimatedUsdCurrencyA, estimatedUsdCurrencyB]}
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
          addLiquidityError ? (
            <TransactionErrorContent onDismiss={handleDismissConfirmation} message={addLiquidityError} />
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
                value={formattedAmounts[Field.CURRENCY_A]}
                onUserInput={onFieldAInput}
                onMax={() => {
                  onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                }}
                onHalf={() => {
                  onFieldAInput(currencyBalances[Field.CURRENCY_A]?.divide(2).toExact() ?? '')
                }}
                currency={currencies[Field.CURRENCY_A]}
                id="add-liquidity-input-tokena"
                showCommonBases
                positionMax="top"
                estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                disableCurrencySelect={!currencyAIsWETH && !currencyAIsETHER}
                isSwitchMode={currencyAIsWETH || currencyAIsETHER}
                onSwitchCurrency={() => {
                  chainId &&
                    navigate(
                      `/add/${
                        currencyAIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                      }/${currencyIdB}/${pairAddress}`,
                      { replace: true },
                    )
                }}
              />
              <Flex justifyContent="space-between" alignItems="center" marginTop="0.5rem">
                <USDPrice>
                  {usdPrices[0] ? `1 ${nativeA?.symbol} = ${formattedNum(usdPrices[0].toString(), true)}` : <Loader />}
                </USDPrice>
              </Flex>
            </div>
            <div>
              <CurrencyInputPanel
                value={formattedAmounts[Field.CURRENCY_B]}
                onUserInput={onFieldBInput}
                onMax={() => {
                  onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                }}
                onHalf={() => {
                  onFieldBInput(currencyBalances[Field.CURRENCY_B]?.divide(2)?.toExact() ?? '')
                }}
                currency={currencies[Field.CURRENCY_B]}
                disableCurrencySelect={true}
                id="add-liquidity-input-tokenb"
                showCommonBases
                positionMax="top"
                estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
              />
              <Flex justifyContent="space-between" alignItems="center" marginTop="0.5rem">
                <USDPrice>
                  {usdPrices[1] ? `1 ${nativeB?.symbol} = ${formattedNum(usdPrices[1].toString(), true)}` : <Loader />}
                </USDPrice>

                {pairAddress && chainId && (currencyBIsWETH || currencyBIsETHER) && (
                  <StyledInternalLink
                    replace
                    to={`/add/${currencyIdA}/${
                      currencyBIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                    }/${pairAddress}`}
                  >
                    {currencyBIsETHER ? <Trans>Use Wrapped Token</Trans> : <Trans>Use Native Token</Trans>}
                  </StyledInternalLink>
                )}
              </Flex>
            </div>

            {currencies[independentField] && currencies[dependentField] && pairState !== PairState.INVALID && (
              <Section padding="0" marginTop="8px" style={{ marginTop: '8px' }}>
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
              <Section borderRadius={'20px'} marginBottom="24px">
                <ToggleComponent title={t`Pool Information`}>
                  <AutoRow padding="16px 0" style={{ borderBottom: `1px dashed ${theme.border}`, gap: '1rem' }}>
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

                  <AutoRow padding="16px 0" style={{ borderBottom: `1px dashed ${theme.border}`, gap: '1rem' }}>
                    <AutoColumn style={{ flex: '1' }}>
                      <AutoRow>
                        <Text fontWeight={500} fontSize={12} color={theme.subText}>
                          AMP
                        </Text>
                        <QuestionHelper text={AMP_HINT} />
                      </AutoRow>
                      <Text fontWeight={400} fontSize={14} color={theme.text}>
                        {!!pair ? (
                          <>{new Fraction(JSBI.BigInt(pair.amp)).divide(JSBI.BigInt(10000)).toSignificant(5)}</>
                        ) : (
                          ''
                        )}
                      </Text>
                    </AutoColumn>

                    {(!!pairAddress || +amp >= 1) && (
                      <DynamicFeeRangeWrapper>
                        <AutoRow>
                          <Text fontWeight={500} fontSize={12} color={theme.subText}>
                            <UppercaseText>
                              {isStaticFeePair || !pair ? <Trans>Fee</Trans> : <Trans>Dynamic Fee Range</Trans>}
                            </UppercaseText>
                          </Text>
                          <QuestionHelper
                            text={
                              isStaticFeePair || !pair
                                ? t`Liquidity providers will earn this trading fee for each trade that uses this pool`
                                : t`Fees are adjusted dynamically according to market conditions to maximise returns for liquidity providers`
                            }
                          />
                        </AutoRow>
                        <Text fontWeight={400} fontSize={14} color={theme.text}>
                          {!!pair
                            ? isStaticFeePair && pair?.fee
                              ? +new Fraction(JSBI.BigInt(pair.fee))
                                  .divide(JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)))
                                  .toSignificant(6) *
                                  100 +
                                '%'
                              : feeRangeCalc(
                                  !!pair?.amp
                                    ? +new Fraction(JSBI.BigInt(pair.amp)).divide(JSBI.BigInt(10000)).toSignificant(5)
                                    : +amp,
                                )
                            : ''}
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
                          text={t`Tradable token pair price range for this pool based on AMP. If the price goes below or above this range, the pool may become inactive`}
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
                            <Dots>Approving {nativeA?.symbol}</Dots>
                          ) : (
                            <>
                              <Trans>Approve</Trans> {nativeA?.symbol}
                            </>
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
                            <Dots>
                              <Trans>Approving</Trans> {nativeB?.symbol}
                            </Dots>
                          ) : (
                            <>
                              <Trans>Approve</Trans> {nativeB?.symbol}
                            </>
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
                  <Text fontWeight={500}>{error ?? (!pairAddress && +amp < 1 ? t`Enter amp (>=1)` : t`Supply`)}</Text>
                </ButtonError>
              </AutoColumn>
            )}
          </SecondColumn>
        </GridColumn>
      </AutoColumn>
    </Wrapper>
  )
}

export default TokenPair
