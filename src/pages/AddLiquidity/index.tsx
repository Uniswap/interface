import { BigNumber } from '@ethersproject/bignumber'
import type { TransactionResponse } from '@ethersproject/providers'
import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES, Percent } from '@uniswap/sdk-core'
import { FeeAmount, NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { useWeb3React } from '@web3-react/core'
import { Deposit } from 'components/AddLiquidity/Deposit'
import OwnershipWarning from 'components/AddLiquidity/OwnershipWarning'
import { SetPriceRange } from 'components/AddLiquidity/SetPriceRange'
import { SetStartingPrice } from 'components/AddLiquidity/SetStartingPrice'
import { sendEvent } from 'components/analytics'
import { AutoColumn } from 'components/Column'
import FeeSelector from 'components/FeeSelector'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { isSupportedChain } from 'constants/chains'
import { useArgentWalletContract } from 'hooks/useArgentWalletContract'
import usePrevious from 'hooks/usePrevious'
import { useSingleCallResult } from 'lib/hooks/multicall'
import { PositionPageUnsupportedContent } from 'pages/Pool/PositionPage'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Text } from 'rebass'
import {
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
  useV3MintActionHandlers,
  useV3MintState,
} from 'state/mint/v3/hooks'
import { addressesAreEquivalent } from 'utils/addressesAreEquivalent'

import { Buttons } from '../../components/AddLiquidity/Buttons'
import { SelectPair } from '../../components/AddLiquidity/SelectPair'
import { ScrollablePage, StyledBodyWrapper, VerticalContainer, Wrapper } from '../../components/AddLiquidity/styled'
import { ButtonPrimary, ButtonText } from '../../components/Button'
import { AddRemoveTabs } from '../../components/NavigationTabs'
import { PositionPreview } from '../../components/PositionPreview'
import Row from '../../components/Row'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import { ZERO_PERCENT } from '../../constants/misc'
import { WRAPPED_NATIVE_CURRENCY } from '../../constants/tokens'
import { useCurrency } from '../../hooks/Tokens'
import { useV3NFTPositionManagerContract } from '../../hooks/useContract'
import { useDerivedPositionInfo } from '../../hooks/useDerivedPositionInfo'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useStablecoinValue } from '../../hooks/useStablecoinPrice'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useV3PositionFromTokenId } from '../../hooks/useV3Positions'
import { Bound, Field } from '../../state/mint/v3/actions'
import { useTransactionAdder } from '../../state/transactions/hooks'
import { TransactionType } from '../../state/transactions/types'
import { useUserSlippageToleranceWithDefault } from '../../state/user/hooks'
import { ThemedText } from '../../theme'
import approveAmountCalldata from '../../utils/approveAmountCalldata'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import { currencyId } from '../../utils/currencyId'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import { Review } from './Review'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function AddLiquidityWrapper() {
  const { chainId } = useWeb3React()
  if (isSupportedChain(chainId)) {
    return <AddLiquidity />
  } else {
    return <PositionPageUnsupportedContent />
  }
}

function AddLiquidity() {
  const navigate = useNavigate()
  const {
    currencyIdA,
    currencyIdB,
    feeAmount: feeAmountFromUrl,
    tokenId,
  } = useParams<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>()
  const { account, chainId, provider } = useWeb3React()

  const addTransaction = useTransactionAdder()
  const positionManager = useV3NFTPositionManagerContract()

  // check for existing position if tokenId in url
  const { position: existingPositionDetails, loading: positionLoading } = useV3PositionFromTokenId(
    tokenId ? BigNumber.from(tokenId) : undefined
  )
  const hasExistingPosition = !!existingPositionDetails && !positionLoading
  const { position: existingPosition } = useDerivedPositionInfo(existingPositionDetails)

  // fee selection from url
  const feeAmount: FeeAmount | undefined =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : undefined

  const baseCurrency = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)
  // prevent an error if they input ETH/WETH
  const quoteCurrency =
    baseCurrency && currencyB && baseCurrency.wrapped.equals(currencyB.wrapped) ? undefined : currencyB

  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useV3MintState()

  const {
    pool,
    ticks,
    dependentField,
    price,
    pricesAtTicks,
    pricesAtLimit,
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
  } = useV3DerivedMintInfo(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  )

  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput } =
    useV3MintActionHandlers(noLiquidity)

  // modal and loading
  const [showConfirm, setShowConfirm] = useState<boolean>(false)
  const [attemptingTxn, setAttemptingTxn] = useState<boolean>(false) // clicked confirm

  // txn values
  const deadline = useTransactionDeadline() // custom from users settings

  const [txHash, setTxHash] = useState<string>('')

  // get formatted amounts
  const formattedAmounts = {
    [independentField]: typedValue,
    [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
  }

  const usdcValues = {
    [Field.CURRENCY_A]: useStablecoinValue(parsedAmounts[Field.CURRENCY_A]),
    [Field.CURRENCY_B]: useStablecoinValue(parsedAmounts[Field.CURRENCY_B]),
  }

  // get the max amounts user can add
  const maxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmountSpend(currencyBalances[field]),
      }
    },
    {}
  )

  const atMaxAmounts: { [field in Field]?: CurrencyAmount<Currency> } = [Field.CURRENCY_A, Field.CURRENCY_B].reduce(
    (accumulator, field) => {
      return {
        ...accumulator,
        [field]: maxAmounts[field]?.equalTo(parsedAmounts[field] ?? '0'),
      }
    },
    {}
  )

  const argentWalletContract = useArgentWalletContract()

  const allowedSlippage = useUserSlippageToleranceWithDefault(
    outOfRange ? ZERO_PERCENT : DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE
  )

  async function onAdd() {
    if (!chainId || !provider || !account) return

    if (!positionManager || !baseCurrency || !quoteCurrency) {
      return
    }

    if (position && account && deadline) {
      const useNative = baseCurrency.isNative ? baseCurrency : quoteCurrency.isNative ? quoteCurrency : undefined
      const { calldata, value } =
        hasExistingPosition && tokenId
          ? NonfungiblePositionManager.addCallParameters(position, {
              tokenId,
              slippageTolerance: allowedSlippage,
              deadline: deadline.toString(),
              useNative,
            })
          : NonfungiblePositionManager.addCallParameters(position, {
              slippageTolerance: allowedSlippage,
              recipient: account,
              deadline: deadline.toString(),
              useNative,
              createPool: noLiquidity,
            })

      let txn: { to: string; data: string; value: string } = {
        to: NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId],
        data: calldata,
        value,
      }

      if (argentWalletContract) {
        const amountA = parsedAmounts[Field.CURRENCY_A]
        const amountB = parsedAmounts[Field.CURRENCY_B]
        const batch = [
          ...(amountA && amountA.currency.isToken
            ? [approveAmountCalldata(amountA, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId])]
            : []),
          ...(amountB && amountB.currency.isToken
            ? [approveAmountCalldata(amountB, NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId])]
            : []),
          {
            to: txn.to,
            data: txn.data,
            value: txn.value,
          },
        ]
        const data = argentWalletContract.interface.encodeFunctionData('wc_multiCall', [batch])
        txn = {
          to: argentWalletContract.address,
          data,
          value: '0x0',
        }
      }

      setAttemptingTxn(true)

      provider
        .getSigner()
        .estimateGas(txn)
        .then((estimate) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate),
          }

          return provider
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              addTransaction(response, {
                type: TransactionType.ADD_LIQUIDITY_V3_POOL,
                baseCurrencyId: currencyId(baseCurrency),
                quoteCurrencyId: currencyId(quoteCurrency),
                createPool: Boolean(noLiquidity),
                expectedAmountBaseRaw: parsedAmounts[Field.CURRENCY_A]?.quotient?.toString() ?? '0',
                expectedAmountQuoteRaw: parsedAmounts[Field.CURRENCY_B]?.quotient?.toString() ?? '0',
                feeAmount: position.pool.fee,
              })
              setTxHash(response.hash)
              sendEvent({
                category: 'Liquidity',
                action: 'Add',
                label: [currencies[Field.CURRENCY_A]?.symbol, currencies[Field.CURRENCY_B]?.symbol].join('/'),
              })
            })
        })
        .catch((error) => {
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
      const currencyIdNew = currencyId(currencyNew)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew =
          currencyIdNew === 'ETH' ||
          (chainId !== undefined && currencyIdNew === WRAPPED_NATIVE_CURRENCY[chainId]?.address)
        const isETHOrWETHOther =
          currencyIdOther !== undefined &&
          (currencyIdOther === 'ETH' ||
            (chainId !== undefined && currencyIdOther === WRAPPED_NATIVE_CURRENCY[chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [chainId]
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        navigate(`/add/${idA}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, navigate]
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        navigate(`/add/${idB}`)
      } else {
        navigate(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, navigate]
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      navigate(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, navigate, onLeftRangeInput, onRightRangeInput]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      // dont jump to pool page if creating
      navigate('/pools')
    }
    setTxHash('')
  }, [navigate, onFieldAInput, txHash])

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onStartPriceInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    navigate(`/add`)
  }, [navigate, onFieldAInput, onFieldBInput, onStartPriceInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper, getSetFullRange } =
    useRangeHopCallbacks(baseCurrency ?? undefined, quoteCurrency ?? undefined, feeAmount, tickLower, tickUpper, pool)

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${
    !depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
  }`

  const [searchParams, setSearchParams] = useSearchParams()

  const handleSetFullRange = useCallback(() => {
    getSetFullRange()

    const minPrice = pricesAtLimit[Bound.LOWER]
    if (minPrice) searchParams.set('minPrice', minPrice.toSignificant(5))
    const maxPrice = pricesAtLimit[Bound.UPPER]
    if (maxPrice) searchParams.set('maxPrice', maxPrice.toSignificant(5))
    setSearchParams(searchParams)

    sendEvent({
      category: 'Liquidity',
      action: 'Full Range Clicked',
    })
  }, [getSetFullRange, pricesAtLimit, searchParams, setSearchParams])

  // START: sync values with query string
  const oldSearchParams = usePrevious(searchParams)
  // use query string as an input to onInput handlers
  useEffect(() => {
    const minPrice = searchParams.get('minPrice')
    const oldMinPrice = oldSearchParams?.get('minPrice')
    if (
      minPrice &&
      typeof minPrice === 'string' &&
      !isNaN(minPrice as any) &&
      (!oldMinPrice || oldMinPrice !== minPrice)
    ) {
      onLeftRangeInput(minPrice)
    }
    // disable eslint rule because this hook only cares about the url->input state data flow
    // input state -> url updates are handled in the input handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  useEffect(() => {
    const maxPrice = searchParams.get('maxPrice')
    const oldMaxPrice = oldSearchParams?.get('maxPrice')
    if (
      maxPrice &&
      typeof maxPrice === 'string' &&
      !isNaN(maxPrice as any) &&
      (!oldMaxPrice || oldMaxPrice !== maxPrice)
    ) {
      onRightRangeInput(maxPrice)
    }
    // disable eslint rule because this hook only cares about the url->input state data flow
    // input state -> url updates are handled in the input handlers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])
  // END: sync values with query string

  const usdcValueCurrencyA = usdcValues[Field.CURRENCY_A]
  const usdcValueCurrencyB = usdcValues[Field.CURRENCY_B]
  const currencyAFiat = useMemo(
    () => ({
      data: usdcValueCurrencyA ? parseFloat(usdcValueCurrencyA.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyA]
  )
  const currencyBFiat = useMemo(
    () => ({
      data: usdcValueCurrencyB ? parseFloat(usdcValueCurrencyB.toSignificant()) : undefined,
      isLoading: false,
    }),
    [usdcValueCurrencyB]
  )

  const owner = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [tokenId]).result?.[0]
  const ownsNFT =
    addressesAreEquivalent(owner, account) || addressesAreEquivalent(existingPositionDetails?.operator, account)
  const showOwnershipWarning = Boolean(hasExistingPosition && account && !ownsNFT)

  return (
    <>
      <ScrollablePage>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          reviewContent={() => (
            <ConfirmationModalContent
              title={<Trans>Add Liquidity</Trans>}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <Review
                  parsedAmounts={parsedAmounts}
                  position={position}
                  existingPosition={existingPosition}
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  outOfRange={outOfRange}
                  ticksAtLimit={ticksAtLimit}
                />
              )}
              bottomContent={() => (
                <ButtonPrimary style={{ marginTop: '1rem' }} onClick={onAdd}>
                  <Text fontWeight={500} fontSize={20}>
                    <Trans>Add</Trans>
                  </Text>
                </ButtonPrimary>
              )}
            />
          )}
          pendingText={pendingText}
        />
        <StyledBodyWrapper $hasExistingPosition={hasExistingPosition}>
          <AddRemoveTabs
            creating={false}
            adding={true}
            positionID={tokenId}
            autoSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
            showBackLink={!hasExistingPosition}
          >
            {!hasExistingPosition && (
              <Row justifyContent="flex-end" style={{ width: 'fit-content', minWidth: 'fit-content' }}>
                <ButtonText onClick={clearAll}>
                  <ThemedText.DeprecatedBlue fontSize="12px">
                    <Trans>Clear All</Trans>
                  </ThemedText.DeprecatedBlue>
                </ButtonText>
              </Row>
            )}
          </AddRemoveTabs>
          <Wrapper>
            <VerticalContainer>
              <AutoColumn gap="lg">
                {!hasExistingPosition && (
                  <>
                    <SelectPair
                      currencies={currencies}
                      maxAmounts={maxAmounts}
                      atMaxAmounts={atMaxAmounts}
                      formattedAmounts={formattedAmounts}
                      onFieldAInput={onFieldAInput}
                      onFieldBInput={onFieldBInput}
                      handleCurrencyASelect={handleCurrencyASelect}
                      handleCurrencyBSelect={handleCurrencyBSelect}
                    />
                    {baseCurrency && quoteCurrency && (
                      <FeeSelector
                        currencyA={baseCurrency}
                        currencyB={quoteCurrency}
                        feeAmount={feeAmount}
                        handleFeePoolSelect={handleFeePoolSelect}
                      />
                    )}
                    {feeAmount && (
                      <>
                        {noLiquidity && (
                          <SetStartingPrice
                            baseCurrency={baseCurrency}
                            quoteCurrency={quoteCurrency}
                            price={price}
                            invertPrice={invertPrice}
                            startPriceTypedValue={startPriceTypedValue}
                            onStartPriceInput={onStartPriceInput}
                          />
                        )}
                        {((noLiquidity && startPriceTypedValue) || !noLiquidity) && (
                          <SetPriceRange
                            baseCurrency={baseCurrency}
                            quoteCurrency={quoteCurrency}
                            currencyIdA={currencyIdA}
                            currencyIdB={currencyIdB}
                            formattedAmounts={formattedAmounts}
                            price={price}
                            priceLower={priceLower}
                            priceUpper={priceUpper}
                            invertPrice={invertPrice}
                            feeAmount={feeAmount}
                            ticksAtLimit={ticksAtLimit}
                            outOfRange={outOfRange}
                            invalidRange={invalidRange}
                            showChart={!noLiquidity}
                            interactiveChart={!hasExistingPosition}
                            onFieldAInput={onFieldAInput}
                            onLeftRangeInput={onLeftRangeInput}
                            onRightRangeInput={onRightRangeInput}
                            getDecrementLower={getDecrementLower}
                            getIncrementLower={getIncrementLower}
                            getDecrementUpper={getDecrementUpper}
                            getIncrementUpper={getIncrementUpper}
                            handleSetFullRange={handleSetFullRange}
                          />
                        )}
                      </>
                    )}
                  </>
                )}
                {hasExistingPosition && existingPosition && (
                  <PositionPreview
                    position={existingPosition}
                    title={<Trans>Selected Range</Trans>}
                    inRange={!outOfRange}
                    ticksAtLimit={ticksAtLimit}
                  />
                )}
                {priceLower && priceUpper && !invalidRange && (
                  <Deposit
                    hasExistingPosition={hasExistingPosition}
                    currencies={currencies}
                    currencyAFiat={currencyAFiat}
                    currencyBFiat={currencyBFiat}
                    maxAmounts={maxAmounts}
                    atMaxAmounts={atMaxAmounts}
                    formattedAmounts={formattedAmounts}
                    tickLower={tickLower}
                    tickUpper={tickUpper}
                    invalidPool={invalidPool}
                    invalidRange={invalidRange}
                    depositADisabled={depositADisabled}
                    depositBDisabled={depositBDisabled}
                    onFieldAInput={onFieldAInput}
                    onFieldBInput={onFieldBInput}
                  />
                )}
                <Buttons
                  currencies={currencies}
                  depositADisabled={depositADisabled}
                  depositBDisabled={depositBDisabled}
                  addIsUnsupported={addIsUnsupported}
                  parsedAmounts={parsedAmounts}
                  errorMessage={errorMessage}
                  invalidRange={invalidRange}
                  setShowConfirm={setShowConfirm}
                />
              </AutoColumn>
            </VerticalContainer>
          </Wrapper>
        </StyledBodyWrapper>
        {showOwnershipWarning && <OwnershipWarning ownerAddress={owner} />}
        {addIsUnsupported && (
          <UnsupportedCurrencyFooter
            show={addIsUnsupported}
            currencies={[currencies.CURRENCY_A, currencies.CURRENCY_B]}
          />
        )}
      </ScrollablePage>
      <SwitchLocaleLink />
    </>
  )
}
