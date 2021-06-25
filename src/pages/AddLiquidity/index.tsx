import React, { useCallback, useContext, useMemo, useState } from 'react'
import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Percent } from '@uniswap/sdk-core'
import { AlertTriangle, AlertCircle } from 'react-feather'
import ReactGA from 'react-ga'
import { ZERO_PERCENT } from '../../constants/misc'
import { NONFUNGIBLE_POSITION_MANAGER_ADDRESSES } from '../../constants/addresses'
import { WETH9_EXTENDED } from '../../constants/tokens'
import { useArgentWalletContract } from '../../hooks/useArgentWalletContract'
import { useV3NFTPositionManagerContract } from '../../hooks/useContract'
import { RouteComponentProps } from 'react-router-dom'
import { Text } from 'rebass'
import { ThemeContext } from 'styled-components'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonText } from '../../components/Button'
import { YellowCard, OutlineCard, BlueCard, LightCard } from '../../components/Card'
import { AutoColumn } from '../../components/Column'
import TransactionConfirmationModal, { ConfirmationModalContent } from '../../components/TransactionConfirmationModal'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'
import { RowBetween, RowFixed } from '../../components/Row'
import { useIsSwapUnsupported } from '../../hooks/useIsSwapUnsupported'
import { useUSDCValue } from '../../hooks/useUSDCPrice'
import approveAmountCalldata from '../../utils/approveAmountCalldata'
import { calculateGasMargin } from '../../utils/calculateGasMargin'
import Review from './Review'
import { useActiveWeb3React } from '../../hooks/web3'
import { useCurrency } from '../../hooks/Tokens'
import { ApprovalState, useApproveCallback } from '../../hooks/useApproveCallback'
import useTransactionDeadline from '../../hooks/useTransactionDeadline'
import { useWalletModalToggle } from '../../state/application/hooks'
import { Field, Bound } from '../../state/mint/v3/actions'

import { useTransactionAdder } from '../../state/transactions/hooks'
import { useIsExpertMode, useUserSlippageToleranceWithDefault } from '../../state/user/hooks'
import { TYPE, ExternalLink } from '../../theme'
import { maxAmountSpend } from '../../utils/maxAmountSpend'
import AppBody from '../AppBody'
import { Dots } from '../Pool/styleds'
import { currencyId } from '../../utils/currencyId'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import { DynamicSection, CurrencyDropdown, StyledInput, Wrapper, ScrollablePage } from './styled'
import { Trans, t } from '@lingui/macro'
import {
  useV3MintState,
  useV3MintActionHandlers,
  useRangeHopCallbacks,
  useV3DerivedMintInfo,
} from 'state/mint/v3/hooks'
import { FeeAmount, NonfungiblePositionManager } from '@uniswap/v3-sdk'
import { useV3PositionFromTokenId } from 'hooks/useV3Positions'
import { useDerivedPositionInfo } from 'hooks/useDerivedPositionInfo'
import { PositionPreview } from 'components/PositionPreview'
import FeeSelector from 'components/FeeSelector'
import RangeSelector from 'components/RangeSelector'
import RateToggle from 'components/RateToggle'
import { BigNumber } from '@ethersproject/bignumber'
import { AddRemoveTabs } from 'components/NavigationTabs'
import HoverInlineText from 'components/HoverInlineText'
import { SwitchLocaleLink } from 'components/SwitchLocaleLink'

const DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE = new Percent(50, 10_000)

export default function AddLiquidity({
  match: {
    params: { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, tokenId },
  },
  history,
}: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string; feeAmount?: string; tokenId?: string }>) {
  const { account, chainId, library } = useActiveWeb3React()
  const theme = useContext(ThemeContext)
  const toggleWalletModal = useWalletModalToggle() // toggle wallet when disconnected
  const expertMode = useIsExpertMode()
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

  const currencyA = useCurrency(currencyIdA)
  const currencyB = useCurrency(currencyIdB)

  // keep track for UI display purposes of user selected base currency
  const baseCurrency = currencyA
  const quoteCurrency = useMemo(
    () =>
      currencyA && currencyB && baseCurrency ? (baseCurrency.equals(currencyA) ? currencyB : currencyA) : undefined,
    [currencyA, currencyB, baseCurrency]
  )

  // mint state
  const { independentField, typedValue, startPriceTypedValue } = useV3MintState()

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
  } = useV3DerivedMintInfo(
    currencyA ?? undefined,
    currencyB ?? undefined,
    feeAmount,
    baseCurrency ?? undefined,
    existingPosition
  )

  const { onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput, onStartPriceInput } =
    useV3MintActionHandlers(noLiquidity)

  const isValid = !errorMessage && !invalidRange

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
    [Field.CURRENCY_A]: useUSDCValue(parsedAmounts[Field.CURRENCY_A]),
    [Field.CURRENCY_B]: useUSDCValue(parsedAmounts[Field.CURRENCY_B]),
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

  // check whether the user has approved the router on the tokens
  const [approvalA, approveACallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_A],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )
  const [approvalB, approveBCallback] = useApproveCallback(
    argentWalletContract ? undefined : parsedAmounts[Field.CURRENCY_B],
    chainId ? NONFUNGIBLE_POSITION_MANAGER_ADDRESSES[chainId] : undefined
  )

  const allowedSlippage = useUserSlippageToleranceWithDefault(
    outOfRange ? ZERO_PERCENT : DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE
  )

  async function onAdd() {
    if (!chainId || !library || !account) return

    if (!positionManager || !currencyA || !currencyB) {
      return
    }

    if (position && account && deadline) {
      const useNative = currencyA.isNative ? currencyA : currencyB.isNative ? currencyB : undefined
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

      library
        .getSigner()
        .estimateGas(txn)
        .then((estimate) => {
          const newTxn = {
            ...txn,
            gasLimit: calculateGasMargin(estimate),
          }

          return library
            .getSigner()
            .sendTransaction(newTxn)
            .then((response: TransactionResponse) => {
              setAttemptingTxn(false)
              addTransaction(response, {
                summary: noLiquidity
                  ? t`Create pool and add ${currencyA?.symbol}/${currencyB?.symbol} V3 liquidity`
                  : t`Add ${currencyA?.symbol}/${currencyB?.symbol} V3 liquidity`,
              })
              setTxHash(response.hash)
              ReactGA.event({
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

  const pendingText = `Supplying ${!depositADisabled ? parsedAmounts[Field.CURRENCY_A]?.toSignificant(6) : ''} ${
    !depositADisabled ? currencies[Field.CURRENCY_A]?.symbol : ''
  } ${!outOfRange ? 'and' : ''} ${!depositBDisabled ? parsedAmounts[Field.CURRENCY_B]?.toSignificant(6) : ''} ${
    !depositBDisabled ? currencies[Field.CURRENCY_B]?.symbol : ''
  }`

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew =
          currencyIdNew === 'ETH' || (chainId !== undefined && currencyIdNew === WETH9_EXTENDED[chainId]?.address)
        const isETHOrWETHOther =
          currencyIdOther !== undefined &&
          (currencyIdOther === 'ETH' || (chainId !== undefined && currencyIdOther === WETH9_EXTENDED[chainId]?.address))

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
        history.push(`/add/${idA}`)
      } else {
        history.push(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, history]
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        history.push(`/add/${idB}`)
      } else {
        history.push(`/add/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, history]
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      history.push(`/add/${currencyIdA}/${currencyIdB}/${newFeeAmount}`)
    },
    [currencyIdA, currencyIdB, history]
  )

  const handleDismissConfirmation = useCallback(() => {
    setShowConfirm(false)
    // if there was a tx hash, we want to clear the input
    if (txHash) {
      onFieldAInput('')
      history.push('/pool')
    }
    setTxHash('')
  }, [history, onFieldAInput, txHash])

  const addIsUnsupported = useIsSwapUnsupported(currencies?.CURRENCY_A, currencies?.CURRENCY_B)

  const clearAll = useCallback(() => {
    onFieldAInput('')
    onFieldBInput('')
    onLeftRangeInput('')
    onRightRangeInput('')
    history.push(`/add`)
  }, [history, onFieldAInput, onFieldBInput, onLeftRangeInput, onRightRangeInput])

  // get value and prices at ticks
  const { [Bound.LOWER]: tickLower, [Bound.UPPER]: tickUpper } = ticks
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks

  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks(
    baseCurrency ?? undefined,
    quoteCurrency ?? undefined,
    feeAmount,
    tickLower,
    tickUpper,
    pool
  )

  // we need an existence check on parsed amounts for single-asset deposits
  const showApprovalA =
    !argentWalletContract && approvalA !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_A]
  const showApprovalB =
    !argentWalletContract && approvalB !== ApprovalState.APPROVED && !!parsedAmounts[Field.CURRENCY_B]

  return (
    <>
      <ScrollablePage>
        <TransactionConfirmationModal
          isOpen={showConfirm}
          onDismiss={handleDismissConfirmation}
          attemptingTxn={attemptingTxn}
          hash={txHash}
          content={() => (
            <ConfirmationModalContent
              title={'Add Liquidity'}
              onDismiss={handleDismissConfirmation}
              topContent={() => (
                <Review
                  parsedAmounts={parsedAmounts}
                  position={position}
                  existingPosition={existingPosition}
                  priceLower={priceLower}
                  priceUpper={priceUpper}
                  outOfRange={outOfRange}
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
        <AppBody>
          <AddRemoveTabs
            creating={false}
            adding={true}
            positionID={tokenId}
            defaultSlippage={DEFAULT_ADD_IN_RANGE_SLIPPAGE_TOLERANCE}
          />
          <Wrapper>
            <AutoColumn gap="32px">
              {!hasExistingPosition && (
                <>
                  <AutoColumn gap="md">
                    <RowBetween paddingBottom="20px">
                      <TYPE.label>
                        <Trans>Select pair</Trans>
                      </TYPE.label>
                      <ButtonText onClick={clearAll}>
                        <TYPE.blue fontSize="12px">
                          <Trans>Clear All</Trans>
                        </TYPE.blue>
                      </ButtonText>
                    </RowBetween>
                    <RowBetween>
                      <CurrencyDropdown
                        value={formattedAmounts[Field.CURRENCY_A]}
                        onUserInput={onFieldAInput}
                        hideInput={true}
                        onMax={() => {
                          onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                        }}
                        onCurrencySelect={handleCurrencyASelect}
                        showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                        currency={currencies[Field.CURRENCY_A]}
                        id="add-liquidity-input-tokena"
                        showCommonBases
                      />
                      <div style={{ width: '12px' }} />

                      <CurrencyDropdown
                        value={formattedAmounts[Field.CURRENCY_B]}
                        hideInput={true}
                        onUserInput={onFieldBInput}
                        onCurrencySelect={handleCurrencyBSelect}
                        onMax={() => {
                          onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                        }}
                        showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                        currency={currencies[Field.CURRENCY_B]}
                        id="add-liquidity-input-tokenb"
                        showCommonBases
                      />
                    </RowBetween>
                  </AutoColumn>{' '}
                </>
              )}

              {hasExistingPosition && existingPosition ? (
                <PositionPreview
                  position={existingPosition}
                  title={<Trans>Selected Range</Trans>}
                  inRange={!outOfRange}
                />
              ) : (
                <>
                  <FeeSelector
                    disabled={!currencyB || !currencyA}
                    feeAmount={feeAmount}
                    handleFeePoolSelect={handleFeePoolSelect}
                  />

                  {noLiquidity && (
                    <DynamicSection disabled={!currencyA || !currencyB}>
                      <AutoColumn gap="md">
                        <RowBetween>
                          <TYPE.label>
                            <Trans>Set Starting Price</Trans>
                          </TYPE.label>
                          {baseCurrency && quoteCurrency ? (
                            <RateToggle
                              currencyA={baseCurrency}
                              currencyB={quoteCurrency}
                              handleRateToggle={() => {
                                onLeftRangeInput('')
                                onRightRangeInput('')
                                history.push(
                                  `/add/${currencyIdB as string}/${currencyIdA as string}${
                                    feeAmount ? '/' + feeAmount : ''
                                  }`
                                )
                              }}
                            />
                          ) : null}
                        </RowBetween>

                        <OutlineCard padding="12px">
                          <StyledInput
                            className="start-price-input"
                            value={startPriceTypedValue}
                            onUserInput={onStartPriceInput}
                          />
                        </OutlineCard>
                        <RowBetween style={{ backgroundColor: theme.bg1, padding: '12px', borderRadius: '12px' }}>
                          <TYPE.main>
                            <Trans>Current {baseCurrency?.symbol} Price:</Trans>
                          </TYPE.main>
                          <TYPE.main>
                            {price ? (
                              <TYPE.main>
                                <RowFixed>
                                  <HoverInlineText
                                    maxCharacters={20}
                                    text={invertPrice ? price?.invert()?.toSignificant(5) : price?.toSignificant(5)}
                                  />{' '}
                                  <span style={{ marginLeft: '4px' }}>{quoteCurrency?.symbol}</span>
                                </RowFixed>
                              </TYPE.main>
                            ) : (
                              '-'
                            )}
                          </TYPE.main>
                        </RowBetween>
                        <BlueCard
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            padding: ' 1.5rem 1.25rem',
                          }}
                        >
                          <AlertCircle color={theme.text1} size={32} style={{ marginBottom: '12px', opacity: 0.8 }} />
                          <TYPE.body
                            fontSize={14}
                            style={{ marginBottom: 8, fontWeight: 500, opacity: 0.8 }}
                            textAlign="center"
                          >
                            You are the first liquidity provider for this Uniswap V3 pool.
                          </TYPE.body>

                          <TYPE.body fontWeight={500} textAlign="center" fontSize={14} style={{ opacity: 0.8 }}>
                            The transaction cost will be much higher as it includes the gas to create the pool.
                          </TYPE.body>
                        </BlueCard>
                      </AutoColumn>
                    </DynamicSection>
                  )}

                  <DynamicSection
                    gap="md"
                    disabled={!feeAmount || invalidPool || (noLiquidity && !startPriceTypedValue)}
                  >
                    <RowBetween>
                      <TYPE.label>
                        <Trans>Set Price Range</Trans>
                      </TYPE.label>

                      {baseCurrency && quoteCurrency ? (
                        <RateToggle
                          currencyA={baseCurrency}
                          currencyB={quoteCurrency}
                          handleRateToggle={() => {
                            onLeftRangeInput('')
                            onRightRangeInput('')
                            history.push(
                              `/add/${currencyIdB as string}/${currencyIdA as string}${
                                feeAmount ? '/' + feeAmount : ''
                              }`
                            )
                          }}
                        />
                      ) : null}
                    </RowBetween>
                    <TYPE.main fontSize={14} fontWeight={400} style={{ marginBottom: '.5rem', lineHeight: '125%' }}>
                      <Trans>
                        Your liquidity will only earn fees when the market price of the pair is within your range.{' '}
                        <ExternalLink
                          href={'https://docs.uniswap.org/concepts/introduction/liquidity-user-guide#4-set-price-range'}
                          style={{ fontSize: '14px' }}
                        >
                          Need help picking a range?
                        </ExternalLink>
                      </Trans>
                    </TYPE.main>

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
                    />

                    {price && baseCurrency && quoteCurrency && !noLiquidity && (
                      <LightCard style={{ padding: '12px' }}>
                        <AutoColumn gap="4px">
                          <TYPE.main fontWeight={500} textAlign="center" fontSize={12}>
                            <Trans>Current Price</Trans>
                          </TYPE.main>
                          <TYPE.body fontWeight={500} textAlign="center" fontSize={20}>
                            <HoverInlineText
                              maxCharacters={20}
                              text={invertPrice ? price.invert().toSignificant(6) : price.toSignificant(6)}
                            />{' '}
                          </TYPE.body>
                          <TYPE.main fontWeight={500} textAlign="center" fontSize={12}>
                            <Trans>
                              {quoteCurrency?.symbol} per {baseCurrency.symbol}
                            </Trans>
                          </TYPE.main>
                        </AutoColumn>
                      </LightCard>
                    )}

                    {outOfRange ? (
                      <YellowCard padding="8px 12px" borderRadius="12px">
                        <RowBetween>
                          <AlertTriangle stroke={theme.yellow3} size="16px" />
                          <TYPE.yellow ml="12px" fontSize="12px">
                            <Trans>
                              Your position will not earn fees or be used in trades until the market price moves into
                              your range.
                            </Trans>
                          </TYPE.yellow>
                        </RowBetween>
                      </YellowCard>
                    ) : null}

                    {invalidRange ? (
                      <YellowCard padding="8px 12px" borderRadius="12px">
                        <RowBetween>
                          <AlertTriangle stroke={theme.yellow3} size="16px" />
                          <TYPE.yellow ml="12px" fontSize="12px">
                            <Trans>Invalid range selected. The min price must be lower than the max price.</Trans>
                          </TYPE.yellow>
                        </RowBetween>
                      </YellowCard>
                    ) : null}
                  </DynamicSection>
                </>
              )}

              <DynamicSection
                disabled={tickLower === undefined || tickUpper === undefined || invalidPool || invalidRange}
              >
                <AutoColumn gap="md">
                  <TYPE.label>{hasExistingPosition ? 'Add more liquidity' : t`Deposit Amounts`}</TYPE.label>

                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_A]}
                    onUserInput={onFieldAInput}
                    onMax={() => {
                      onFieldAInput(maxAmounts[Field.CURRENCY_A]?.toExact() ?? '')
                    }}
                    showMaxButton={!atMaxAmounts[Field.CURRENCY_A]}
                    currency={currencies[Field.CURRENCY_A]}
                    id="add-liquidity-input-tokena"
                    fiatValue={usdcValues[Field.CURRENCY_A]}
                    showCommonBases
                    locked={depositADisabled}
                  />

                  <CurrencyInputPanel
                    value={formattedAmounts[Field.CURRENCY_B]}
                    onUserInput={onFieldBInput}
                    onMax={() => {
                      onFieldBInput(maxAmounts[Field.CURRENCY_B]?.toExact() ?? '')
                    }}
                    showMaxButton={!atMaxAmounts[Field.CURRENCY_B]}
                    fiatValue={usdcValues[Field.CURRENCY_B]}
                    currency={currencies[Field.CURRENCY_B]}
                    id="add-liquidity-input-tokenb"
                    showCommonBases
                    locked={depositBDisabled}
                  />
                </AutoColumn>
              </DynamicSection>
              <div>
                {addIsUnsupported ? (
                  <ButtonPrimary disabled={true} borderRadius="12px" padding={'12px'}>
                    <TYPE.main mb="4px">
                      <Trans>Unsupported Asset</Trans>
                    </TYPE.main>
                  </ButtonPrimary>
                ) : !account ? (
                  <ButtonLight onClick={toggleWalletModal} borderRadius="12px" padding={'12px'}>
                    <Trans>Connect wallet</Trans>
                  </ButtonLight>
                ) : (
                  <AutoColumn gap={'md'}>
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
                        (!argentWalletContract && approvalA !== ApprovalState.APPROVED && !depositADisabled) ||
                        (!argentWalletContract && approvalB !== ApprovalState.APPROVED && !depositBDisabled)
                      }
                      error={!isValid && !!parsedAmounts[Field.CURRENCY_A] && !!parsedAmounts[Field.CURRENCY_B]}
                    >
                      <Text fontWeight={500}>{errorMessage ? errorMessage : <Trans>Add</Trans>}</Text>
                    </ButtonError>
                  </AutoColumn>
                )}
              </div>
            </AutoColumn>
          </Wrapper>
        </AppBody>
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
