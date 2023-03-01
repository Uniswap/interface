import { BigNumber } from '@ethersproject/bignumber'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, Fraction, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, Plus } from 'react-feather'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { BlueCard, LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import { ConfirmAddModalBottom } from 'components/ConfirmAddModalBottom'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import Loader from 'components/Loader'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import { PoolPriceBar, PoolPriceRangeBarToggle } from 'components/PoolPriceBar'
import QuestionHelper from 'components/QuestionHelper'
import Row, { AutoRow, RowBetween, RowFlat } from 'components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { TutorialType } from 'components/Tutorial'
import { APP_PATHS, CREATE_POOL_AMP_HINT } from 'constants/index'
import { ONLY_DYNAMIC_FEE_CHAINS, ONLY_STATIC_FEE_CHAINS, STATIC_FEE_OPTIONS } from 'constants/networks'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { PairState } from 'data/Reserves'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import useTokensMarketPrice from 'hooks/useTokensMarketPrice'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { Dots, Wrapper } from 'pages/Pool/styleds'
import { useTokensPrice, useWalletModalToggle } from 'state/application/hooks'
import { Field } from 'state/mint/actions'
import { useDerivedMintInfo, useMintActionHandlers, useMintState } from 'state/mint/hooks'
import { useDerivedPairInfo } from 'state/pair/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useExpertModeManager, usePairAdderByTokens, useUserSlippageTolerance } from 'state/user/hooks'
import { StyledInternalLink, TYPE } from 'theme'
import { calculateGasMargin, calculateSlippageAmount, formattedNum } from 'utils'
import { currencyId } from 'utils/currencyId'
import { feeRangeCalc, useCurrencyConvertedToNative } from 'utils/dmm'
import { getDynamicFeeRouterContract, getStaticFeeRouterContract } from 'utils/getContract'
import isZero from 'utils/isZero'
import { maxAmountSpend } from 'utils/maxAmountSpend'

import FeeTypeSelector from './FeeTypeSelector'
import StaticFeeSelector from './StaticFeeSelector'
import {
  AMPColumn,
  ActiveText,
  Container,
  GridColumn,
  NumericalInput2,
  PageWrapper,
  Section,
  TokenColumn,
  USDPrice,
  Warning,
} from './styled'

export enum FEE_TYPE {
  STATIC = 'static',
  DYNAMIC = 'dynamic',
}

export default function CreatePool() {
  const { currencyIdA, currencyIdB } = useParams()
  const navigate = useNavigate()
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()
  const theme = useTheme()
  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  const [selectedFee, setSelectedFee] = useState(STATIC_FEE_OPTIONS[chainId]?.[0])

  const onlyStaticFee = !!chainId && ONLY_STATIC_FEE_CHAINS.includes(chainId)
  const onlyDynamicFee = !!chainId && ONLY_DYNAMIC_FEE_CHAINS.includes(chainId)

  const { pairs } = useDerivedPairInfo(currencyA ?? undefined, currencyB ?? undefined)

  const currencyAIsETHER = !!(chainId && currencyA && currencyA.isNative)
  const currencyAIsWETH = !!(chainId && currencyA && currencyA.equals(WETH[chainId]))
  const currencyBIsETHER = !!(chainId && currencyB && currencyB.isNative)
  const currencyBIsWETH = !!(chainId && currencyB && currencyB.equals(WETH[chainId]))

  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected

  const [expertMode] = useExpertModeManager()

  // fee types
  const [feeType, setFeeType] = useState<string>(FEE_TYPE.STATIC)

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
    poolTokenPercentage,
    error,
    unAmplifiedPairAddress,
  } = useDerivedMintInfo(
    currencyA ?? undefined,
    currencyB ?? undefined,
    undefined,
    !onlyDynamicFee && feeType === FEE_TYPE.STATIC,
  )
  const nativeA = useCurrencyConvertedToNative(currencies[Field.CURRENCY_A])
  const nativeB = useCurrencyConvertedToNative(currencies[Field.CURRENCY_B])

  const [amp, setAmp] = useState('')
  const onAmpChange = (e: any) => {
    if (e.toString().length < 20) setAmp(e)
  }

  const poolsList = useMemo(() => pairs.map(([, pair]) => pair).filter(pair => pair !== null), [pairs])
  const isPoolExisted = poolsList.length > 0

  const ampConvertedInBps = !!amp.toString()
    ? new Fraction(JSBI.BigInt(parseUnits(amp.toString() || '1', 20)), JSBI.BigInt(parseUnits('1', 16)))
    : undefined

  const linkToUnamplifiedPool =
    !!ampConvertedInBps &&
    ampConvertedInBps.equalTo(JSBI.BigInt(10000)) &&
    !!unAmplifiedPairAddress &&
    !isZero(unAmplifiedPairAddress)
  const { onFieldAInput, onFieldBInput } = useMintActionHandlers(noLiquidity)

  const isValid = !(error || (+amp < 1 ? 'Enter amp (>=1)' : ''))

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

  const routerAddress = useMemo(() => {
    if (!isEVM) return
    if (ONLY_STATIC_FEE_CHAINS.includes(chainId)) return (networkInfo as EVMNetworkInfo).classic.static.router
    if (ONLY_DYNAMIC_FEE_CHAINS.includes(chainId)) return (networkInfo as EVMNetworkInfo).classic.dynamic?.router
    if (feeType === FEE_TYPE.STATIC) {
      return (networkInfo as EVMNetworkInfo).classic.static.router
    } else {
      return (networkInfo as EVMNetworkInfo).classic.dynamic?.router
    }
  }, [chainId, feeType, isEVM, networkInfo])

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_A], routerAddress)
  const [approvalB, approveBCallback] = useApproveCallback(parsedAmounts[Field.CURRENCY_B], routerAddress)

  const addTransactionWithType = useTransactionAdder()
  const addPair = usePairAdderByTokens()

  async function onAdd() {
    // if (!pair) return
    if (!library || !account) return

    const router =
      feeType === FEE_TYPE.STATIC && !onlyDynamicFee
        ? getStaticFeeRouterContract(chainId, library, account)
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

    if (!ampConvertedInBps) return
    if (currencyA.isNative || currencyB.isNative) {
      const tokenBIsETH = currencyB.isNative
      estimate = router.estimateGas.addLiquidityNewPoolETH
      method = router.addLiquidityNewPoolETH
      args = [
        (tokenBIsETH ? currencyA?.wrapped : currencyB?.wrapped).address ?? '', // token
        feeType === FEE_TYPE.STATIC && !onlyDynamicFee
          ? [ampConvertedInBps.toSignificant(5), selectedFee?.toString() ?? '']
          : ampConvertedInBps.toSignificant(5), //ampBps
        (tokenBIsETH ? parsedAmountA : parsedAmountB).quotient.toString(), // token desired
        amountsMin[tokenBIsETH ? Field.CURRENCY_A : Field.CURRENCY_B].toString(), // token min
        amountsMin[tokenBIsETH ? Field.CURRENCY_B : Field.CURRENCY_A].toString(), // eth min
        account,
        deadline.toHexString(),
      ]
      value = BigNumber.from((tokenBIsETH ? parsedAmountB : parsedAmountA).quotient.toString())
    } else {
      estimate = router.estimateGas.addLiquidityNewPool
      method = router.addLiquidityNewPool
      args = [
        currencyA?.wrapped.address ?? '',
        currencyB?.wrapped.address ?? '',
        feeType === FEE_TYPE.STATIC && !onlyDynamicFee
          ? [ampConvertedInBps.toSignificant(5), selectedFee?.toString() ?? '']
          : ampConvertedInBps.toSignificant(5), //ampBps
        parsedAmountA.quotient.toString(),
        parsedAmountB.quotient.toString(),
        amountsMin[Field.CURRENCY_A].toString(),
        amountsMin[Field.CURRENCY_B].toString(),
        account,
        deadline.toHexString(),
      ]
      value = null
    }
    console.log(args)
    setAttemptingTxn(true)
    await estimate(...args, value ? { value } : {})
      .then(estimatedGasLimit => {
        method(...args, {
          ...(value ? { value } : {}),
          gasLimit: calculateGasMargin(estimatedGasLimit),
        })
          .then(response => {
            const cA = currencies[Field.CURRENCY_A]
            const cB = currencies[Field.CURRENCY_B]
            if (!!cA && !!cB) {
              const tokenAmountIn = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? ''
              const tokenAmountOut = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? ''
              setAttemptingTxn(false)
              addTransactionWithType({
                hash: response.hash,
                type: TRANSACTION_TYPE.CLASSIC_CREATE_POOL,
                extraInfo: {
                  tokenAddressIn: cA.wrapped.address,
                  tokenAddressOut: cB.wrapped.address,
                  tokenAmountIn,
                  tokenAmountOut,
                  tokenSymbolIn: cA.symbol ?? '',
                  tokenSymbolOut: cB.symbol ?? '',
                  arbitrary: {
                    token_1: cA.symbol,
                    token_2: cB.symbol,
                    amp,
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
          })
          .catch(error => {
            setAttemptingTxn(false)
            setShowConfirm(false)
            // we only care if the error is something _other_ than the user rejected the tx
            if (error?.code !== 4001) {
              console.error(error)
            }
          })
      })
      .catch(error => {
        setAttemptingTxn(false)
        setShowConfirm(false)
        // we only care if the error is something _other_ than the user rejected the tx
        if (error?.code !== 4001) {
          console.error(error)
        }
      })
  }

  const modalHeader = () => {
    return (
      <AutoColumn gap="5px">
        <RowFlat>
          <Text fontSize="24px" fontWeight={500} lineHeight="42px" marginRight={10}>
            {nativeA?.symbol + '/' + nativeB?.symbol}
          </Text>
        </RowFlat>
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
        noLiquidity={true}
        onAdd={onAdd}
        poolTokenPercentage={poolTokenPercentage}
        amplification={ampConvertedInBps}
      />
    )
  }

  const pendingText = `Supplying ${parsedAmounts[Field.CURRENCY_A]?.toSignificant(6)} ${
    nativeA?.symbol
  } and ${parsedAmounts[Field.CURRENCY_B]?.toSignificant(6)} ${nativeB?.symbol}`

  const isWrappedTokenInPool = useCallback(
    (currency: Currency | null | undefined, selectedCurrency: Currency) => {
      return (
        chainId &&
        currency &&
        ((currency.isNative && selectedCurrency.equals(WETH[chainId])) ||
          (currency.equals(WETH[chainId]) && selectedCurrency.isNative))
      )
    },
    [chainId],
  )
  const handleCurrencyASelect = useCallback(
    (selectedCurrencyA: Currency) => {
      const newCurrencyIdA = currencyId(selectedCurrencyA, chainId)

      // support WETH
      if (isWrappedTokenInPool(currencyA, selectedCurrencyA)) {
        navigate(`/create/${newCurrencyIdA}/${currencyIdB}`)
      } else if (newCurrencyIdA === currencyIdB) {
        navigate(`/create/${currencyIdB}/${currencyIdA}`)
      } else {
        navigate(`/create/${newCurrencyIdA}/${currencyIdB}`)
      }
    },
    [currencyIdB, navigate, currencyIdA, isWrappedTokenInPool, currencyA, chainId],
  )
  const handleCurrencyBSelect = useCallback(
    (selectedCurrencyB: Currency) => {
      const newCurrencyIdB = currencyId(selectedCurrencyB, chainId)

      if (isWrappedTokenInPool(currencyB, selectedCurrencyB)) {
        navigate(`/create/${currencyIdA}/${newCurrencyIdB}`)
      } else if (newCurrencyIdB === currencyIdA) {
        if (currencyIdB) {
          navigate(`/create/${currencyIdB}/${currencyIdA}`)
        } else {
          navigate(`/create/${newCurrencyIdB}`)
        }
      } else {
        navigate(`/create/${currencyIdA ? currencyIdA : 'ETH'}/${newCurrencyIdB}`)
      }
    },
    [currencyIdA, navigate, currencyIdB, isWrappedTokenInPool, currencyB, chainId],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    setAmp('')
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
    }
    setTxHash('')
  }, [onFieldAInput, txHash])

  // const realPercentToken0 = pair
  //   ? pair.reserve0
  //       .divide(pair.virtualReserve0)
  //       .multiply('100')
  //       .divide(pair.reserve0.divide(pair.virtualReserve0).add(pair.reserve1.divide(pair.virtualReserve1)))
  //   : new Fraction(JSBI.BigInt(50))

  // const realPercentToken1 = new Fraction(JSBI.BigInt(100), JSBI.BigInt(1)).subtract(realPercentToken0 as Fraction)

  // const percentToken0 = realPercentToken0.toSignificant(4)
  // const percentToken1 = realPercentToken1.toSignificant(4)

  const tokens = useMemo(
    () => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]].map(currency => currency?.wrapped),
    [currencies],
  )

  const usdPrices = useTokensPrice(tokens)
  const marketPrices = useTokensMarketPrice(tokens)

  const poolRatio = Number(price?.toSignificant(6))
  const marketRatio = marketPrices[1] && marketPrices[0] / marketPrices[1]

  const showSanityPriceWarning = !!(poolRatio && marketRatio && Math.abs(poolRatio - marketRatio) / marketRatio > 0.05)
  const { mixpanelHandler } = useMixpanel()

  useEffect(() => {
    if (chainId) {
      setSelectedFee(STATIC_FEE_OPTIONS[chainId]?.[0])
    }
  }, [chainId])

  if (!isEVM) return <Navigate to="/" />
  return (
    <PageWrapper>
      <Container>
        <AddRemoveTabs
          tutorialType={TutorialType.CLASSIC_CREATE_POOL}
          action={LiquidityAction.CREATE}
          onShared={() => {
            mixpanelHandler(MIXPANEL_TYPE.CREATE_POOL_LINK_SHARED, {
              token_1: nativeA?.symbol,
              token_2: nativeB?.symbol,
            })
          }}
        />
        <Wrapper>
          <TransactionConfirmationModal
            isOpen={showConfirm}
            onDismiss={handleDismissConfirmation}
            attemptingTxn={attemptingTxn}
            hash={txHash}
            content={() =>
              !linkToUnamplifiedPool ? (
                <ConfirmationModalContent
                  title={t`You are creating a pool`}
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
            <ColumnCenter>
              <BlueCard>
                <AutoColumn gap="10px">
                  {isPoolExisted && (
                    <TYPE.link fontSize="14px" lineHeight="22px" color={'text1'} fontWeight="normal">
                      <Trans>Note: There are existing pools for this token pair. Please check</Trans>{' '}
                      <Link to={`${APP_PATHS.POOLS}/${networkInfo.route}/${currencyIdA}/${currencyIdB}?tab=classic`}>
                        <Trans>here</Trans>
                      </Link>
                    </TYPE.link>
                  )}
                  <TYPE.link fontSize="14px" lineHeight="22px" color={theme.text} fontWeight="normal">
                    <Trans>
                      You are creating a new pool and will be the first liquidity provider. The ratio of tokens you
                      supply below will set the initial price of this pool. Once you are satisfied with the rate,
                      proceed to supply liquidity.
                    </Trans>
                  </TYPE.link>
                </AutoColumn>
              </BlueCard>
            </ColumnCenter>

            <GridColumn>
              <TokenColumn gap="20px">
                <ActiveText>Token</ActiveText>

                <div>
                  <CurrencyInputPanel
                    positionMax="top"
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onFieldAInput}
                    onMax={() => {
                      onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                    }}
                    onHalf={() => {
                      onFieldAInput(currencyBalances[Field.CURRENCY_A]?.divide(2).toExact() ?? '')
                    }}
                    onCurrencySelect={handleCurrencyASelect}
                    currency={currencies[Field.CURRENCY_A]}
                    id="create-pool-input-tokena"
                    disableCurrencySelect={false}
                    showCommonBases
                  />
                  <Flex justifyContent="space-between" alignItems="center" marginTop="0.5rem">
                    <USDPrice>
                      {usdPrices[0] ? (
                        `1 ${nativeA?.symbol} = ${formattedNum(usdPrices[0].toString(), true)}`
                      ) : (
                        <Loader />
                      )}
                    </USDPrice>

                    {chainId && (currencyAIsWETH || currencyAIsETHER) && (
                      <StyledInternalLink
                        replace
                        to={`/create/${
                          currencyAIsETHER
                            ? currencyId(WETH[chainId], chainId)
                            : currencyId(NativeCurrencies[chainId], chainId)
                        }/${currencyIdB}`}
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
                    positionMax="top"
                    value={formattedAmounts[Field.CURRENCY_B]}
                    onUserInput={onFieldBInput}
                    onCurrencySelect={handleCurrencyBSelect}
                    onMax={() => {
                      onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                    }}
                    onHalf={() => {
                      onFieldBInput(currencyBalances[Field.CURRENCY_B]?.divide(2).toExact() ?? '')
                    }}
                    currency={currencies[Field.CURRENCY_B]}
                    id="create-pool-input-tokenb"
                    disableCurrencySelect={false}
                    showCommonBases
                  />
                  <Flex justifyContent="space-between" alignItems="center" marginTop="0.5rem">
                    <USDPrice>
                      {usdPrices[1] ? (
                        `1 ${nativeB?.symbol} = ${formattedNum(usdPrices[1].toString(), true)}`
                      ) : (
                        <Loader />
                      )}
                    </USDPrice>

                    {chainId && (currencyBIsWETH || currencyBIsETHER) && (
                      <StyledInternalLink
                        replace
                        to={`/create/${currencyIdA}/${
                          currencyBIsETHER
                            ? currencyId(WETH[chainId], chainId)
                            : currencyId(NativeCurrencies[chainId], chainId)
                        }`}
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

                    <PoolPriceBar
                      currencies={currencies}
                      poolTokenPercentage={poolTokenPercentage}
                      noLiquidity={noLiquidity}
                      price={price}
                      pair={pair}
                    />
                  </Section>
                )}
              </TokenColumn>

              <AMPColumn gap="20px" style={{ height: 'fit-content' }}>
                <AutoRow>
                  <ActiveText>
                    AMP
                    {!!pair ? (
                      <>
                        &nbsp;=&nbsp;{new Fraction(JSBI.BigInt(pair.amp)).divide(JSBI.BigInt(10000)).toSignificant(5)}
                      </>
                    ) : (
                      ''
                    )}
                  </ActiveText>
                  <QuestionHelper text={CREATE_POOL_AMP_HINT} />
                </AutoRow>

                <LightCard padding="0 0.75rem" borderRadius={'10px'} style={{ background: theme.buttonBlack }}>
                  <NumericalInput2 className="token-amount-input" value={amp} onUserInput={onAmpChange} />
                </LightCard>

                {currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B] && pairState !== PairState.INVALID && (
                  <PoolPriceRangeBarToggle
                    pair={pair}
                    currencies={currencies}
                    price={price}
                    amplification={ampConvertedInBps}
                  />
                )}
                {/* <StaticFeeSelector
                      active={staticFee.toString()}
                      onChange={(name: string) => setStaticFee(name)}
                      options={FEE_OPTIONS[chainId].map((fee: number) => {
                        return { name: fee.toString(), title: (fee / 100).toString() + '%' }
                      })}
                    /> */}

                {chainId &&
                  (onlyStaticFee ? (
                    <>
                      <AutoRow>
                        <ActiveText>Fee</ActiveText>
                        <QuestionHelper
                          text={t`You can select the appropriate fee tier for your pool. For each trade that uses this liquidity pool, liquidity providers will earn this trading fee.`}
                        />
                      </AutoRow>
                      <StaticFeeSelector
                        active={selectedFee}
                        onChange={(name: number) => setSelectedFee(name)}
                        options={
                          STATIC_FEE_OPTIONS[chainId]?.map((fee: number) => {
                            return { name: fee, title: (fee / 1000).toString() + '%' }
                          }) || []
                        }
                      />
                    </>
                  ) : onlyDynamicFee ? (
                    <Section>
                      <AutoRow>
                        <Text fontWeight={500} fontSize={14} color={theme.subText}>
                          <Trans>Dynamic Fee Range</Trans>:{' '}
                          {currencies[Field.CURRENCY_A] &&
                          currencies[Field.CURRENCY_B] &&
                          pairState !== PairState.INVALID &&
                          +amp >= 1
                            ? feeRangeCalc(
                                !!pair?.amp
                                  ? +new Fraction(JSBI.BigInt(pair.amp)).divide(JSBI.BigInt(10000)).toSignificant(5)
                                  : +amp,
                              )
                            : '-'}
                        </Text>
                        <QuestionHelper
                          text={t`Fees are adjusted dynamically according to market conditions to maximise returns for liquidity providers.`}
                        />
                      </AutoRow>
                    </Section>
                  ) : (
                    <>
                      <FeeTypeSelector active={feeType} onChange={(type: string) => setFeeType(type)} />
                      {feeType === FEE_TYPE.STATIC ? (
                        <StaticFeeSelector
                          active={selectedFee}
                          onChange={(name: number) => setSelectedFee(name)}
                          options={
                            STATIC_FEE_OPTIONS[chainId]?.map((fee: number) => {
                              return { name: fee, title: (fee / 1000).toString() + '%' }
                            }) || []
                          }
                        />
                      ) : (
                        <Section>
                          <AutoRow>
                            <Text fontWeight={500} fontSize={14} color={theme.subText}>
                              <Trans>Dynamic Fee Range</Trans>:{' '}
                              {currencies[Field.CURRENCY_A] &&
                              currencies[Field.CURRENCY_B] &&
                              pairState !== PairState.INVALID &&
                              +amp >= 1
                                ? feeRangeCalc(
                                    !!pair?.amp
                                      ? +new Fraction(JSBI.BigInt(pair.amp)).divide(JSBI.BigInt(10000)).toSignificant(5)
                                      : +amp,
                                  )
                                : '-'}
                            </Text>
                            <QuestionHelper
                              text={t`Fees are adjusted dynamically according to market conditions to maximise returns for liquidity providers.`}
                            />
                          </AutoRow>
                        </Section>
                      )}
                    </>
                  ))}

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
                        expertMode && !linkToUnamplifiedPool ? onAdd() : setShowConfirm(true)
                      }}
                      disabled={
                        !isValid ||
                        approvalA !== ApprovalState.APPROVED ||
                        approvalB !== ApprovalState.APPROVED ||
                        (feeType === FEE_TYPE.STATIC ? !selectedFee : false)
                      }
                      error={
                        !isValid &&
                        !!parsedAmounts[Field.CURRENCY_A] &&
                        !!parsedAmounts[Field.CURRENCY_B] &&
                        !!(+amp < 1)
                      }
                    >
                      <Text fontSize={16} fontWeight={500}>
                        {error ??
                          (+amp < 1
                            ? t`Enter amp (>=1)`
                            : feeType === FEE_TYPE.STATIC && !selectedFee
                            ? t`Please select fee`
                            : t`Create`)}
                      </Text>
                    </ButtonError>
                  </AutoColumn>
                )}
              </AMPColumn>
            </GridColumn>
          </AutoColumn>
        </Wrapper>
      </Container>
    </PageWrapper>
  )
}
