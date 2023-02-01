import { TransactionResponse } from '@ethersproject/providers'
import { ONE } from '@kyberswap/ks-sdk-classic'
import { Currency, CurrencyAmount, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { BigNumber } from 'ethers'
import JSBI from 'jsbi'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'react-feather'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ArrowWrapper } from 'components/ArrowRotate'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonWarning } from 'components/Button'
import { OutlineCard, WarningCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import FeeSelector from 'components/FeeSelector'
import HoverInlineText from 'components/HoverInlineText'
import { Swap as SwapIcon } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import LiquidityChartRangeInput from 'components/LiquidityChartRangeInput'
import { AddRemoveTabs, LiquidityAction } from 'components/NavigationTabs'
import ProAmmPoolInfo from 'components/ProAmm/ProAmmPoolInfo'
import ProAmmPooledTokens from 'components/ProAmm/ProAmmPooledTokens'
import ProAmmPriceRange from 'components/ProAmm/ProAmmPriceRange'
import RangeSelector from 'components/RangeSelector'
import PresetsButtons from 'components/RangeSelector/PresetsButtons'
import Row, { RowBetween, RowFixed } from 'components/Row'
import TransactionConfirmationModal, { ConfirmationModalContent } from 'components/TransactionConfirmationModal'
import { TutorialType } from 'components/Tutorial'
import { Dots } from 'components/swapv2/styleds'
import { APP_PATHS } from 'constants/index'
import { EVMNetworkInfo } from 'constants/networks/type'
import { NativeCurrencies } from 'constants/tokens'
import { useActiveWeb3React, useWeb3React } from 'hooks'
import { useCurrency } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useProAmmNFTPositionManagerContract } from 'hooks/useContract'
import useProAmmPoolInfo from 'hooks/useProAmmPoolInfo'
import useProAmmPreviousTicks from 'hooks/useProAmmPreviousTicks'
import useTheme from 'hooks/useTheme'
import useTransactionDeadline from 'hooks/useTransactionDeadline'
import { useWalletModalToggle } from 'state/application/hooks'
import { Bound, Field } from 'state/mint/proamm/actions'
import {
  useProAmmDerivedMintInfo,
  useProAmmMintActionHandlers,
  useProAmmMintState,
  useRangeHopCallbacks,
} from 'state/mint/proamm/hooks'
import { useTokenPrices } from 'state/tokenPrices/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TRANSACTION_TYPE } from 'state/transactions/type'
import { useExpertModeManager, useUserSlippageTolerance } from 'state/user/hooks'
import { StyledInternalLink, TYPE } from 'theme'
import { basisPointsToPercent, calculateGasMargin, formattedNum } from 'utils'
import { currencyId } from 'utils/currencyId'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { unwrappedToken } from 'utils/wrappedCurrency'

import {
  Container,
  DynamicSection,
  FlexLeft,
  HideMedium,
  MediumOnly,
  PageWrapper,
  ResponsiveTwoColumns,
  RightContainer,
  StackedContainer,
  StackedItem,
  StyledInput,
} from './styled'

export default function AddLiquidity() {
  const { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl } = useParams()
  const navigate = useNavigate()
  const [rotate, setRotate] = useState(false)
  const { account, chainId, isEVM, networkInfo } = useActiveWeb3React()
  const { library } = useWeb3React()
  const theme = useTheme()
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const [expertMode] = useExpertModeManager()
  const addTransactionWithType = useTransactionAdder()
  const positionManager = useProAmmNFTPositionManagerContract()
  // check for existing position if tokenId in url
  // const { position: existingPositionDetails, loading: positionLoading } = useProAmmPositionsFromTokenId(
  //   tokenId ? BigNumber.from(tokenId) : undefined
  // )
  // const hasExistingPosition = !!existingPositionDetails && !positionLoading

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : FeeAmount.MEDIUM
  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  const baseCurrencyIsETHER = !!(chainId && baseCurrency && baseCurrency.isNative)
  const baseCurrencyIsWETH = !!(chainId && baseCurrency && baseCurrency.equals(WETH[chainId]))
  const quoteCurrencyIsETHER = !!(chainId && quoteCurrency && quoteCurrency.isNative)
  const quoteCurrencyIsWETH = !!(chainId && quoteCurrency && quoteCurrency.equals(WETH[chainId]))

  const tokenA = (baseCurrency ?? undefined)?.wrapped
  const tokenB = (quoteCurrency ?? undefined)?.wrapped
  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)

  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useProAmmMintState()

  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    parsedAmounts,
    currencyBalances,
    position,
    noLiquidity,
    currencies,
    errorMessage,
    invalidPool,
    invalidRange,
    outOfRange,
    depositADisabled,
    depositBDisabled,
    invertPrice,
    ticksAtLimit,
    amount0Unlock,
    amount1Unlock,
  } = useProAmmDerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
  )
  const poolAddress = useProAmmPoolInfo(baseCurrency, currencyB, feeAmount)
  const previousTicks =
    // : number[] = []
    useProAmmPreviousTicks(pool, position)
  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput } =
    useProAmmMintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // capital efficiency warning
  const [showCapitalEfficiencyWarning, setShowCapitalEfficiencyWarning] = useState(false)

  useEffect(() => setShowCapitalEfficiencyWarning(false), [baseCurrency, quoteCurrency, feeAmount])

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toExact() ?? '',
  }

  // const [amount0Unlock, amount1Unlock] = useMemo(() => {
  //   if (price && noLiquidity) {
  //     return [
  //       FullMath.mulDiv(
  //         SqrtPriceMath.getAmount0Unlock(encodeSqrtRatioX96(price.numerator, price.denominator)),
  //         JSBI.BigInt('105'),
  //         JSBI.BigInt('100'),
  //       ),
  //       FullMath.mulDiv(
  //         SqrtPriceMath.getAmount1Unlock(encodeSqrtRatioX96(price.numerator, price.denominator)),
  //         JSBI.BigInt('105'),
  //         JSBI.BigInt('100'),
  //       ),
  //     ]
  //   }
  //   return [JSBI.BigInt('0'), JSBI.BigInt('0')]
  // }, [noLiquidity, price])
  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      let maxAmount = maxAmountSpend(currencyBalances[field])
      let amountUnlock = JSBI.BigInt('0')
      if (maxAmount && currencies[field] && noLiquidity && tokenA && tokenB) {
        if (
          (!invertPrice && tokenA.equals(currencies[field] as Currency)) ||
          (invertPrice && tokenB.equals(currencies[field] as Currency))
        ) {
          amountUnlock = amount0Unlock
        } else {
          amountUnlock = amount1Unlock
        }
        maxAmount = maxAmount?.subtract(CurrencyAmount.fromRawAmount(currencies[field] as Currency, amountUnlock))
      }
      return {
        ...accumulator,
        [field]: maxAmount,
      }
    },
    {},
  )

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    !!currencies[Field.CURRENCY_A] && depositADisabled && noLiquidity
      ? CurrencyAmount.fromFractionalAmount(currencies[Field.CURRENCY_A] as Currency, ONE, ONE)
      : parsedAmounts[Field.CURRENCY_A],
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager : undefined,
  )

  const [approvalB, approveBCallback] = useApproveCallback(
    !!currencies[Field.CURRENCY_B] && depositBDisabled && noLiquidity
      ? CurrencyAmount.fromFractionalAmount(currencies[Field.CURRENCY_B] as Currency, ONE, ONE)
      : parsedAmounts[Field.CURRENCY_B],
    isEVM ? (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager : undefined,
  )

  const tokens = useMemo(
    () => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]].map(currency => currency?.wrapped),
    [currencies],
  )
  const usdPrices = useTokenPrices(tokens.map(t => t?.wrapped.address || ''))

  const estimatedUsdCurrencyA =
    parsedAmounts[Field.CURRENCY_A] && usdPrices[tokens[0]?.address || '']
      ? parseFloat((parsedAmounts[Field.CURRENCY_A] as CurrencyAmount<Currency>).toExact()) *
        usdPrices[tokens[0]?.address || '']
      : 0

  const estimatedUsdCurrencyB =
    parsedAmounts[Field.CURRENCY_B] && usdPrices[tokens[1]?.address || '']
      ? parseFloat((parsedAmounts[Field.CURRENCY_B] as CurrencyAmount<Currency>).toExact()) *
        usdPrices[tokens[1]?.address || '']
      : 0

  const allowedSlippage = useUserSlippageTolerance()

  async function onAdd() {
    if (!isEVM || !library || !account) return

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    if (!previousTicks || previousTicks.length !== 2) {
      return
    }
    if (position && account && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined

      const { calldata, value } = NonfungiblePositionManager.addCallParameters(position, previousTicks, {
        slippageTolerance: basisPointsToPercent(allowedSlippage[0]),
        recipient: account,
        deadline: deadline.toString(),
        useNative,
        createPool: noLiquidity,
      })

      //0.00283161
      const txn: { to: string; data: string; value: string } = {
        to: (networkInfo as EVMNetworkInfo).elastic.nonfungiblePositionManager,
        data: calldata,
        value,
      }

      setAttemptingTxn(true)
      library
        .getSigner()
        .estimateGas(txn)
        .then((estimate: BigNumber) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate),
          }
          //calculateGasMargin = 0x0827f6

          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              if (noLiquidity) {
                const tokenAmountIn = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '0'
                const tokenAmountOut = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '0'
                addTransactionWithType({
                  hash: response.hash,
                  type: TRANSACTION_TYPE.ELASTIC_CREATE_POOL,
                  extraInfo: {
                    tokenSymbolIn: baseCurrency.symbol ?? '',
                    tokenSymbolOut: quoteCurrency.symbol ?? '',
                    tokenAmountIn,
                    tokenAmountOut,
                    tokenAddressIn: baseCurrency.wrapped.address,
                    tokenAddressOut: quoteCurrency.wrapped.address,
                  },
                })
              } else {
                const tokenAmountIn = parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) ?? '0'
                const tokenAmountOut = parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) ?? '0'
                addTransactionWithType({
                  hash: response.hash,
                  type: TRANSACTION_TYPE.ELASTIC_ADD_LIQUIDITY,
                  extraInfo: {
                    contract: poolAddress,
                    tokenAmountIn,
                    tokenAmountOut,
                    tokenSymbolIn: baseCurrency.symbol,
                    tokenSymbolOut: quoteCurrency.symbol,
                    tokenAddressIn: baseCurrency.wrapped.address,
                    tokenAddressOut: quoteCurrency.wrapped.address,
                  },
                })
              }

              setTxHash(response.hash)
            })
        })
        .catch((error: any) => {
          console.error('Failed to send transaction', error)
          setAttemptingTxn(false)
          // we only care if the error is something _other_ than the user rejected the tx
          if (error?.code !== 4001) {
            console.error(error)
          }
        })
    } else {
      return
    }
  }

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew, chainId)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew = currencyNew.isNative || (chainId && currencyIdNew === WETH[chainId]?.address)
        const isETHOrWETHOther =
          !!currencyIdOther &&
          ((chainId && currencyIdOther === NativeCurrencies[chainId].symbol) ||
            (chainId && currencyIdOther === WETH[chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [chainId],
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        navigate(`/elastic/add/${idA}`)
      } else {
        navigate(`/elastic/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, navigate],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        navigate(`/elastic/add/${idB}`)
      } else {
        navigate(`/elastic/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, navigate],
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      navigate(`/elastic/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, navigate, onLeftRangeInput, onRightRangeInput],
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      navigate(`${APP_PATHS.MY_POOLS}/${networkInfo.route}?tab=elastic`)
    }
    setTxHash('')
  }, [navigate, networkInfo.route, onFieldAInput, txHash])

  const addIsUnsupported = false

  // const clearAll = useCallback(() => {
  //   onFieldAInput('')
  //   onFieldBInput('')
  //   onLeftRangeInput('')
  //   onRightRangeInput('')
  //   history.push(`/add`)
  // }, [history, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(
      baseCurrency ?? undefined,
      quoteCurrency ?? undefined,
      feeAmount,
      tickLower,
      tickUpper,
      pool,
      price,
    )
  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA = approvalA !== ApprovalState.APPROVED && (noLiquidity ? true : !!parsedAmounts[Field.CURRENCY_A])
  const showApprovalB = approvalB !== ApprovalState.APPROVED && (noLiquidity ? true : !!parsedAmounts[Field.CURRENCY_B])

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(10) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!depositADisabled && !depositBDisabled ? 'and' : ''} ${
    !depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(10) : ''
  } ${!depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''}`

  const Buttons = () =>
    addIsUnsupported ? (
      <ButtonPrimary disabled={true}>
        <Trans>Unsupported Asset</Trans>
      </ButtonPrimary>
    ) : !account ? (
      <ButtonLight onClick={toggleWalletModal}>
        <Trans>Connect Wallet</Trans>
      </ButtonLight>
    ) : (
      <Flex sx={{ gap: '16px' }} flexDirection={isValid && showApprovalA && showApprovalB ? 'column' : 'row'}>
        {(approvalA === ApprovalState.NOT_APPROVED ||
          approvalA === ApprovalState.PENDING ||
          approvalB === ApprovalState.NOT_APPROVED ||
          approvalB === ApprovalState.PENDING) &&
          isValid && (
            <RowBetween>
              {showApprovalA && (
                <ButtonPrimary
                  onClick={approveACallback}
                  disabled={approvalA === ApprovalState.PENDING}
                  width={showApprovalB ? '48%' : '100%'}
                >
                  {approvalA === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_A]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
              {showApprovalB && (
                <ButtonPrimary
                  onClick={approveBCallback}
                  disabled={approvalB === ApprovalState.PENDING}
                  width={showApprovalA ? '48%' : '100%'}
                >
                  {approvalB === ApprovalState.PENDING ? (
                    <Dots>
                      <Trans>Approving {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                    </Dots>
                  ) : (
                    <Trans>Approve {currencies[Field.CURRENCY_B]?.symbol}</Trans>
                  )}
                </ButtonPrimary>
              )}
            </RowBetween>
          )}
        <ButtonError
          onClick={() => {
            expertMode ? onAdd() : setShowConfirm(true)
          }}
          disabled={
            !isValid ||
            (approvalA !== ApprovalState.APPROVED && (!depositADisabled || noLiquidity)) ||
            (approvalB !== ApprovalState.APPROVED && (!depositBDisabled || noLiquidity))
          }
          error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B] && false}
        >
          <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Preview</Trans>}</Text>
        </ButtonError>
      </Flex>
    )

  const chart = (
    <>
      <DynamicSection gap="md" disabled={!feeAmount || invalidPool}>
        {!noLiquidity ? (
          <>
            <Text fontWeight="500" style={{ display: 'flex' }}>
              <Trans>Set Your Price Range</Trans>
              <InfoHelper
                size={14}
                text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
              />
            </Text>

            {price && baseCurrency && quoteCurrency && !noLiquidity && (
              <Flex justifyContent="center" marginTop="0.5rem" sx={{ gap: '0.25rem' }}>
                <Text fontWeight={500} textAlign="center" color={theme.subText} fontSize={12}>
                  <Trans>Current Price</Trans>
                </Text>
                <Text fontWeight={500} textAlign="center" fontSize={12}>
                  <HoverInlineText
                    maxCharacters={20}
                    text={invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)}
                  />
                </Text>
                <Text fontSize={12}>
                  {quoteCurrency?.symbol} per {baseCurrency.symbol}
                </Text>
              </Flex>
            )}

            <LiquidityChartRangeInput
              currencyA={baseCurrency ?? undefined}
              currencyB={quoteCurrency ?? undefined}
              feeAmount={feeAmount}
              ticksAtLimit={ticksAtLimit}
              price={price ? parseFloat((invertPrice ? price.invert() : price).toSignificant(8)) : undefined}
              leftPrice={leftPrice}
              rightPrice={rightPrice}
              onLeftRangeInput={onLeftRangeInput}
              onRightRangeInput={onRightRangeInput}
              interactive
            />
          </>
        ) : (
          <AutoColumn gap="1rem">
            <RowBetween>
              <Text fontWeight="500">
                <Trans>Set Starting Price</Trans>
              </Text>
            </RowBetween>
            {noLiquidity && (
              <Flex
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: '1rem 0',
                  borderTop: `1px solid ${theme.border}`,
                  borderBottom: `1px solid ${theme.border}`,
                }}
              >
                <TYPE.body fontSize={12} textAlign="left" color={theme.subText} lineHeight="16px">
                  <Trans>
                    To initialize this pool, select a starting price for the pool then enter your liquidity price range.
                    Gas fees will be higher than usual due to initialization of the pool.
                  </Trans>
                </TYPE.body>
              </Flex>
            )}
            <OutlineCard
              padding="12px 16px"
              style={{ borderRadius: '999px', backgroundColor: theme.buttonBlack, border: 'none' }}
            >
              <StyledInput className="start-price-input" value={startPriceTypedValue} onUserInput={onStartPriceInput} />
            </OutlineCard>
            <RowBetween>
              <Text fontWeight="500" color={theme.subText} style={{ textTransform: 'uppercase' }} fontSize="12px">
                <Trans>Current Price</Trans>
              </Text>
              <TYPE.main>
                {price ? (
                  <TYPE.main>
                    <RowFixed>
                      <HoverInlineText
                        maxCharacters={20}
                        text={`1 ${baseCurrency?.symbol} = ${
                          invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)
                        } ${quoteCurrency?.symbol}`}
                      />
                    </RowFixed>
                  </TYPE.main>
                ) : (
                  '-'
                )}
              </TYPE.main>
            </RowBetween>
          </AutoColumn>
        )}
        <DynamicSection gap="md" disabled={!feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)}>
          <StackedContainer>
            <StackedItem style={{ opacity: showCapitalEfficiencyWarning ? '0.05' : 1 }}>
              <AutoColumn gap="md">
                {noLiquidity && (
                  <RowBetween>
                    <Text fontWeight="500" style={{ display: 'flex' }}>
                      <Trans>Set Your Price Range</Trans>
                      <InfoHelper
                        text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
                        placement={'right'}
                      />
                    </Text>
                  </RowBetween>
                )}
                <RangeSelector
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  getDecrementLower={getDecrementLower}
                  getIncrementLower={getIncrementLower}
                  getDecrementUpper={getDecrementUpper}
                  getIncrementUpper={getIncrementUpper}
                  onLeftRangeInput={onLeftRangeInput}
                  onRightRangeInput={onRightRangeInput}
                  currencyA={baseCurrency}
                  currencyB={quoteCurrency}
                  feeAmount={feeAmount}
                  ticksAtLimit={ticksAtLimit}
                />
                <PresetsButtons
                  setFullRange={() => {
                    setShowCapitalEfficiencyWarning(true)
                  }}
                />
              </AutoColumn>
            </StackedItem>

            {showCapitalEfficiencyWarning && (
              <StackedItem zIndex={1}>
                <WarningCard padding="15px">
                  <AutoColumn gap="8px" style={{ height: '100%' }}>
                    <RowFixed>
                      <AlertTriangle stroke={theme.warning} size="16px" />
                      <TYPE.warning ml="12px" fontSize="15px">
                        <Trans>Efficiency Comparison</Trans>
                      </TYPE.warning>
                    </RowFixed>
                    <RowFixed>
                      <TYPE.warning ml="12px" fontSize="13px" margin={0} fontWeight={400}>
                        <Trans>Full range positions may earn less fees than concentrated positions.</Trans>
                      </TYPE.warning>
                    </RowFixed>
                    <Row>
                      <ButtonWarning
                        padding="8px"
                        marginRight="8px"
                        width="100%"
                        onClick={() => {
                          setShowCapitalEfficiencyWarning(false)
                          getSetFullRange()
                        }}
                      >
                        <TYPE.black fontSize={13}>
                          <Trans>I understand</Trans>
                        </TYPE.black>
                      </ButtonWarning>
                    </Row>
                  </AutoColumn>
                </WarningCard>
              </StackedItem>
            )}
          </StackedContainer>

          {outOfRange ? (
            <WarningCard padding="10px 16px">
              <Flex alignItems="center">
                <AlertTriangle stroke={theme.warning} size="16px" />
                <TYPE.warning ml="12px" fontSize="12px" flex={1}>
                  <Trans>
                    Your position will not earn fees until the market price of the pool moves into your price range.
                  </Trans>
                </TYPE.warning>
              </Flex>
            </WarningCard>
          ) : null}

          {invalidRange ? (
            <WarningCard padding="10px 16px">
              <Flex alignItems="center">
                <AlertTriangle stroke={theme.warning} size="16px" />
                <TYPE.warning ml="12px" fontSize="12px" flex={1}>
                  <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
                </TYPE.warning>
              </Flex>
            </WarningCard>
          ) : null}
        </DynamicSection>
      </DynamicSection>
    </>
  )

  if (!isEVM) return <Navigate to="/" />
  return (
    <>
      <TransactionConfirmationModal
        isOpen={showConfirm}
        onDismiss={handleDismissConfirmation}
        attemptingTxn={attemptingTxn}
        hash={txHash}
        content={() => (
          <ConfirmationModalContent
            title={!!noLiquidity ? t`Create a new pool` : t`Add Liquidity`}
            onDismiss={handleDismissConfirmation}
            topContent={() =>
              position && (
                // <PositionPreview
                //   position={position}
                //   title={<Trans>Selected Range</Trans>}
                //   inRange={!outOfRange}
                //   ticksAtLimit={ticksAtLimit}
                // />
                <div style={{ marginTop: '1rem' }}>
                  <ProAmmPoolInfo position={position} />
                  <ProAmmPooledTokens
                    liquidityValue0={CurrencyAmount.fromRawAmount(
                      unwrappedToken(position.pool.token0),
                      position.amount0.quotient,
                    )}
                    liquidityValue1={CurrencyAmount.fromRawAmount(
                      unwrappedToken(position.pool.token1),
                      position.amount1.quotient,
                    )}
                    title={'New Liquidity Amount'}
                  />
                  <ProAmmPriceRange position={position} ticksAtLimit={ticksAtLimit} hideChart />
                </div>
              )
            }
            bottomContent={() => (
              <ButtonPrimary onClick={onAdd}>
                <Text fontWeight={500}>
                  <Trans>Supply</Trans>
                </Text>
              </ButtonPrimary>
            )}
          />
        )}
        pendingText={pendingText}
      />
      <PageWrapper>
        <Container>
          <AddRemoveTabs
            hideShare
            action={!!noLiquidity ? LiquidityAction.CREATE : LiquidityAction.ADD}
            showTooltip={true}
            onCleared={() => {
              onFieldAInput('0')
              onFieldBInput('0')
              navigate('/elastic/add')
            }}
            onBack={() => {
              navigate('/pools?tab=elastic')
            }}
            tutorialType={TutorialType.ELASTIC_ADD_LIQUIDITY}
          />
          <ResponsiveTwoColumns>
            <FlexLeft>
              <RowBetween style={{ gap: '12px' }}>
                <CurrencyInputPanel
                  hideBalance
                  value={formattedAmounts[Field.CURRENCY_A]}
                  onUserInput={onFieldAInput}
                  hideInput={true}
                  onMax={null}
                  onHalf={null}
                  onCurrencySelect={handleCurrencyASelect}
                  currency={currencies[Field.CURRENCY_A] ?? null}
                  id="add-liquidity-input-tokena"
                  showCommonBases
                  estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                  maxCurrencySymbolLength={6}
                />

                <ArrowWrapper
                  isVertical
                  rotated={rotate}
                  onClick={() => {
                    if (!!rightPrice) {
                      onLeftRangeInput(rightPrice?.invert().toString())
                    }
                    if (!!leftPrice) {
                      onRightRangeInput(leftPrice?.invert().toString())
                    }
                    setRotate(prev => !prev)
                  }}
                >
                  {!currencyIdA && !currencyIdB ? (
                    <SwapIcon size={24} color={theme.subText} />
                  ) : (
                    <StyledInternalLink
                      replace
                      to={`/elastic/add/${currencyIdB}/${currencyIdA}/${feeAmount}`}
                      style={{ color: 'inherit', display: 'flex' }}
                    >
                      <SwapIcon size={24} color={theme.subText} />
                    </StyledInternalLink>
                  )}
                </ArrowWrapper>

                <CurrencyInputPanel
                  hideBalance
                  value={formattedAmounts[Field.CURRENCY_B]}
                  hideInput={true}
                  onUserInput={onFieldBInput}
                  onCurrencySelect={handleCurrencyBSelect}
                  onMax={null}
                  onHalf={null}
                  positionMax="top"
                  currency={currencies[Field.CURRENCY_B] ?? null}
                  id="add-liquidity-input-tokenb"
                  showCommonBases
                  estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                  maxCurrencySymbolLength={6}
                />
              </RowBetween>

              <DynamicSection disabled={!currencyIdA || !currencyIdB} gap="16px">
                <Text fontWeight={500} fontSize="1rem">
                  <Trans>Select fee tier</Trans>
                </Text>
                <FeeSelector
                  feeAmount={feeAmount}
                  onChange={handleFeePoolSelect}
                  currencyA={currencies[Field.CURRENCY_A]}
                  currencyB={currencies[Field.CURRENCY_B]}
                />
              </DynamicSection>
              <AutoColumn>
                <AutoColumn gap="16px">
                  <HideMedium>{chart}</HideMedium>
                  <DynamicSection
                    gap="16px"
                    disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                  >
                    <Text fontWeight={500}>
                      <Trans>Deposit Amounts</Trans>
                    </Text>

                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_A]}
                      onUserInput={onFieldAInput}
                      onMax={() => {
                        onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                      }}
                      onHalf={() => {
                        onFieldAInput(currencyBalances[Field.CURRENCY_A]?.divide(2).toExact() ?? '')
                      }}
                      currency={currencies[Field.CURRENCY_A] ?? null}
                      id="add-liquidity-input-tokena"
                      showCommonBases
                      positionMax="top"
                      locked={depositADisabled}
                      estimatedUsd={formattedNum(estimatedUsdCurrencyA.toString(), true) || undefined}
                      disableCurrencySelect={!baseCurrencyIsETHER && !baseCurrencyIsWETH}
                      isSwitchMode={baseCurrencyIsETHER || baseCurrencyIsWETH}
                      onSwitchCurrency={() => {
                        chainId &&
                          navigate(
                            `/elastic/add/${
                              baseCurrencyIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                            }/${currencyIdB}/${feeAmount}`,
                            { replace: true },
                          )
                      }}
                    />
                  </DynamicSection>
                  <DynamicSection
                    gap="md"
                    disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
                  >
                    <CurrencyInputPanel
                      value={formattedAmounts[Field.CURRENCY_B]}
                      onUserInput={onFieldBInput}
                      onMax={() => {
                        onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                      }}
                      onHalf={() => {
                        onFieldBInput(currencyBalances[Field.CURRENCY_B]?.divide(2).toExact() ?? '')
                      }}
                      currency={currencies[Field.CURRENCY_B] ?? null}
                      id="add-liquidity-input-tokenb"
                      showCommonBases
                      positionMax="top"
                      locked={depositBDisabled}
                      estimatedUsd={formattedNum(estimatedUsdCurrencyB.toString(), true) || undefined}
                      disableCurrencySelect={!quoteCurrencyIsETHER && !quoteCurrencyIsWETH}
                      isSwitchMode={quoteCurrencyIsETHER || quoteCurrencyIsWETH}
                      onSwitchCurrency={() => {
                        chainId &&
                          navigate(
                            `/elastic/add/${currencyIdA}/${
                              quoteCurrencyIsETHER ? WETH[chainId].address : NativeCurrencies[chainId].symbol
                            }/${feeAmount}`,
                            { replace: true },
                          )
                      }}
                    />
                  </DynamicSection>
                </AutoColumn>
              </AutoColumn>
            </FlexLeft>
            <HideMedium>
              <Buttons />
            </HideMedium>
            <RightContainer gap="lg">
              <MediumOnly>{chart}</MediumOnly>
              <MediumOnly>
                <Buttons />
              </MediumOnly>
            </RightContainer>
          </ResponsiveTwoColumns>
        </Container>
      </PageWrapper>
    </>
  )
}
