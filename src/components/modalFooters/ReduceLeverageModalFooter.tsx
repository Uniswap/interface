import { Trans } from '@lingui/macro'
import { InterfaceElementName } from '@uniswap/analytics-events'
import { formatNumber,NumberType } from '@uniswap/conedison/format'
// import { useWeb3React } from '@web3-react/core'
import { BigNumber as BN } from "bignumber.js"
import AnimatedDropdown from 'components/AnimatedDropdown'
import { DarkCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { LoadingOpacityContainer } from 'components/Loader/styled'
import Slider from 'components/Slider'
import { DeltaText } from 'components/Tokens/TokenDetails/PriceChart'
import { MouseoverTooltip } from 'components/Tooltip'
import { DEFAULT_ERC20_DECIMALS } from 'constants/tokens'
import { useCurrency, useToken } from 'hooks/Tokens'
import { useLeverageManagerContract } from 'hooks/useContract'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
// import { Info } from 'react-feather'
// import Loader from 'components/Icons/LoadingSpinner'
import { usePool } from 'hooks/usePools'
import { useLimitlessPositionFromTokenId } from 'hooks/useV3Positions'
// import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
import moment from "moment"
import { SmallMaxButton } from 'pages/RemoveLiquidity/styled'
import { useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { useTheme } from 'styled-components/macro'
import { HideSmall, Separator, ThemedText } from 'theme'
import { LimitlessPositionDetails } from 'types/leveragePosition'
import { currencyId } from 'utils/currencyId'

import { ButtonError } from '../Button'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import {DerivedInfoState, RotatingArrow, SliderText, Spinner, StyledCard, StyledHeaderRow, StyledInfoIcon, StyledPolling, StyledPollingDot, TextWithLoadingPlaceholder, TransactionDetails, TruncatedText,Wrapper } from './common'
// import { useSingleCallResult } from 'lib/hooks/multicall'
// import { QuoterV2 } from 'types/v3'
// import { MouseoverValueLabel } from 'components/swap/AdvancedSwapDetails'


function useDerivedLeverageReduceInfo(
  leverageManager: string | undefined,
  trader: string | undefined,
  tokenId: string | undefined,
  allowedSlippage: string,
  position: LimitlessPositionDetails | undefined,
  reduceAmount: string | undefined,
  //newTotalPosition: string | undefined,
  setState: (state: DerivedInfoState) => void,
  // approvalState: ApprovalState,
  // setPremium: (premium: number) => void
): {
  transactionInfo: {
    token0Amount: string
    token1Amount: string
    pnl: string
    returnedAmount: string
    unusedPremium: string
    premium: string,
    currentPrice: number,
    entryPrice: number,
    quoteBaseSymbol: string
  } | undefined,
  userError: React.ReactNode | undefined
} {
  const leverageManagerContract = useLeverageManagerContract(leverageManager)

  const [contractResult, setContractResult] = useState<{
    reducePositionResult: any
  }>()

  // const { account } = useWeb3React()
  const currency0 = useCurrency(position?.token0Address)
  const currency1 = useCurrency(position?.token1Address)

  

  // const relevantTokenBalances = useCurrencyBalances(
  //   account ?? undefined,
  //   useMemo(() => [currency0 ?? undefined, currency1 ?? undefined], [currency0, currency1])
  // )
  const userError = useMemo(() => {
    let error;
    if (!reduceAmount || Number(reduceAmount) <= 0) {
      error = (<Trans>
        Invalid Amount
      </Trans>)
    }
    return error
  }, [reduceAmount])
  
  useEffect(() => {
    const laggedfxn = async () => {
      if (!leverageManagerContract || !tokenId || !trader || parseFloat(allowedSlippage) <= 0 && !position || !position?.totalPosition || Number(reduceAmount) <= 0 || !reduceAmount) {
        setState(DerivedInfoState.INVALID)
        return
      }
      const formattedSlippage = new BN(allowedSlippage).plus(100).shiftedBy(16).toFixed(0)
      const formattedReduceAmount = new BN(reduceAmount).shiftedBy(18).toFixed(0);
      const inputReduceAmount =
        Math.abs(Number(position.totalPositionRaw) - Number(formattedReduceAmount)) < 1e12
          // Number(position.totalPositionRaw) <= Number(formattedReduceAmount)
          ? position.totalPositionRaw : formattedReduceAmount

      setState(DerivedInfoState.LOADING)

      try {
        console.log('reducePositionArgs', Math.abs(Number(position.totalPositionRaw) - Number(formattedReduceAmount)), position, position.isToken0, position.totalPosition, position.totalPositionRaw, formattedSlippage, inputReduceAmount)
        const reducePositionResult = await leverageManagerContract.callStatic.reducePosition(position?.isToken0, formattedSlippage, inputReduceAmount)
        console.log('reducePosition', reducePositionResult, tokenId, formattedSlippage);
        setContractResult({
          reducePositionResult
        })
        setState(DerivedInfoState.VALID)
      } catch (error) {
        console.error('Failed to get reduce info', error)
        setState(DerivedInfoState.INVALID)
        setContractResult(undefined)
      }
    }

    !userError && laggedfxn()
  }, [userError, leverageManager, trader, tokenId, allowedSlippage, reduceAmount, leverageManagerContract, position, setState])

  const [poolState, pool] = usePool(currency0 ?? undefined, currency1 ?? undefined, position?.poolFee)
  
  const [entryPrice, currentPrice, quoteBaseSymbol] = useMemo(() => {
    if (
      pool?.token0Price &&
      pool?.token1Price &&
      // position.creationPrice &&
      position &&
      currency0 &&
      currency1
    ) {
      const curPrice = position.isToken0 ? new BN(pool.token1Price.toFixed(DEFAULT_ERC20_DECIMALS))
      : new BN(pool.token0Price.toFixed(DEFAULT_ERC20_DECIMALS))
     
      // entryPrice if isToken0, output is in token0. so entry price would be in input token / output token
      const _entryPrice = new BN(position.initialCollateral).plus(position.totalDebtInput).dividedBy(position.totalPosition)

      // use token0 as quote, token1 as base
      // pnl will be in output token
      // entry price will be in quote token.

      if (pool.token0Price.greaterThan(1)) {
        // entry price = token1 / token0
        return [
          position.isToken0 ? _entryPrice.toNumber() : new BN(1).dividedBy(_entryPrice).toNumber(), 
          position.isToken0 ? new BN(1).dividedBy(curPrice).toNumber(): curPrice.toNumber(),
          `${currency0.symbol}/${currency1.symbol}`
        ]
      } else {
        // entry price = token0 / token1
        return [
          position.isToken0 ? new BN(1).dividedBy(_entryPrice).toNumber() : _entryPrice.toNumber(), 
          new BN(1).dividedBy(curPrice).toNumber(),
          `${currency1.symbol}/${currency0.symbol}`
        ]
      }
    }
    return [undefined, undefined, undefined]
  }, [position, pool?.token0Price, pool?.token1Price, currency0, currency1])
  
  const transactionInfo = useMemo(() => {
    if (contractResult && entryPrice && currentPrice && quoteBaseSymbol) {
      const { reducePositionResult } = contractResult
      const token0Amount = new BN(reducePositionResult[0].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      const token1Amount = new BN(reducePositionResult[1].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      const pnl = new BN(reducePositionResult[2].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      const returnedAmount = new BN(reducePositionResult[3].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      const unusedPremium = new BN(reducePositionResult[4].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      const premium = new BN(reducePositionResult[5].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)

      return {
        token0Amount,
        token1Amount,
        pnl,
        returnedAmount,
        unusedPremium,
        premium,
        entryPrice,
        currentPrice,
        quoteBaseSymbol
      }
    } else {
      return undefined
    }
  }, [
    contractResult,
    currentPrice, entryPrice,
    quoteBaseSymbol
  ])



  return {
    transactionInfo,
    userError
  }
}

export function ReduceLeverageModalFooter({
  leverageManagerAddress,
  tokenId,
  trader,
  setAttemptingTxn,
  setTxHash,
  // setPositionData
}: {
  leverageManagerAddress: string | undefined
  tokenId: string | undefined
  trader: string | undefined,
  setAttemptingTxn: (attemptingTxn: boolean) => void
  setTxHash: (txHash: string) => void
  // setPositionData: (positionData: TransactionPositionDetails) => void
}) {
  // const [nonce, setNonce] = useState(0)
  const { error, position } = useLimitlessPositionFromTokenId(tokenId)

  const [slippage, setSlippage] = useState("1")
  // const [newPosition, setNewPosition] = useState("")
  const [reduceAmount, setReduceAmount] = useState("")
  // const [premium, setPremium ] = useState(0)

  const leverageManagerContract = useLeverageManagerContract(leverageManagerAddress, true)
  const addTransaction = useTransactionAdder()
  const token0 = useToken(position?.token0Address)
  const token1 = useToken(position?.token1Address)
  
  const inputIsToken0 = !position?.isToken0

  const [derivedState, setDerivedState] = useState<DerivedInfoState>(DerivedInfoState.INVALID)
  const [showDetails, setShowDetails] = useState(true)
  const theme = useTheme()

  // const [, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.poolFee)

  const [debouncedSlippage, setDebouncedSlippage] = useDebouncedChangeHandler(slippage, setSlippage)
  const [debouncedReduceAmount, setDebouncedReduceAmount] = useDebouncedChangeHandler(reduceAmount, setReduceAmount);

  const {
    transactionInfo,
    userError
  } = useDerivedLeverageReduceInfo(leverageManagerAddress, trader, tokenId, debouncedSlippage, position, debouncedReduceAmount, setDerivedState)
  
  useEffect(() => {
    (!!userError || !transactionInfo) && showDetails && setShowDetails(false)
  }, [userError, transactionInfo, showDetails])
  const loading = useMemo(() => derivedState === DerivedInfoState.LOADING, [derivedState])

  // console.log('reduceLeverage', showDetails, transactionInfo, userError)

  const handleReducePosition = useMemo(() => {
    if (
      leverageManagerContract && position && Number(reduceAmount) > 0 && Number(reduceAmount) <= Number(position.totalPosition) &&
      token0 && token1 && transactionInfo
      ) {
      const formattedSlippage = new BN(slippage).plus(100).shiftedBy(16).toFixed(0)
      const formattedReduceAmount = new BN(reduceAmount).shiftedBy(18).toFixed(0);
      const inputReduceAmount =
        Math.abs(Number(position.totalPositionRaw) - Number(formattedReduceAmount)) < 1e12
          // Number(position.totalPositionRaw) <= Number(formattedReduceAmount)
          ? position.totalPositionRaw : formattedReduceAmount
      return () => {
        setAttemptingTxn(true)
        leverageManagerContract.reducePosition(
          position?.isToken0,
          formattedSlippage,
          inputReduceAmount
        ).then((response: any) => {
          // console.log('reduceResponse', response.hash, response)
          addTransaction(response, {
            type: TransactionType.REDUCE_LEVERAGE,
            reduceAmount: inputReduceAmount ?? "",
            pnl: Number(transactionInfo.pnl),
            initialCollateral: Number(position.initialCollateral),
            leverageFactor: (Number(position.totalDebtInput) + Number(position.initialCollateral)) / Number(position.initialCollateral),
            inputCurrencyId:  inputIsToken0 ? currencyId(token0) : currencyId(token1),
            outputCurrencyId: !inputIsToken0 ? currencyId(token0) : currencyId(token1),
            entryPrice: transactionInfo.entryPrice,
            markPrice: transactionInfo.currentPrice,
            quoteBaseSymbol: transactionInfo.quoteBaseSymbol,
            timestamp: moment().format('YYYY-MM-DD')
          })
          setTxHash(response.hash)
          setAttemptingTxn(false)
        }).catch((err: any) => {
          setAttemptingTxn(false)
          console.log("error closing position: ", err)
        })
      }
    }
    return () => { }
  }, [
    slippage,  position, reduceAmount,
    token0,
    token1,
    inputIsToken0,
    transactionInfo,
    leverageManagerContract,
    addTransaction,
    setTxHash,
    setAttemptingTxn
  ])

  const disabled = !!userError || !transactionInfo
  // const debt = position?.totalDebtInput;
  const initCollateral = position?.initialCollateral;

  return (
    <AutoRow>
      <DarkCard marginTop="5px" padding="5px">
        <AutoColumn gap="4px">
          <RowBetween>
            <ThemedText.DeprecatedMain fontWeight={400}>
              <Trans>Allowed Slippage</Trans>
            </ThemedText.DeprecatedMain>
          </RowBetween>
          <>
            <RowBetween>
              <SliderText>
                <Trans>{debouncedSlippage}%</Trans>
              </SliderText>
              <AutoRow gap="4px" justify="flex-end">
                <SmallMaxButton onClick={() => setSlippage("0.5")} width="20%">
                  <Trans>0.5</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => setSlippage("1")} width="20%">
                  <Trans>1</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => setSlippage("3")} width="20%">
                  <Trans>3</Trans>
                </SmallMaxButton>
                <SmallMaxButton onClick={() => setSlippage("5")} width="20%">
                  <Trans>Max</Trans>
                </SmallMaxButton>
              </AutoRow>
            </RowBetween>
            <Slider
              value={parseFloat(debouncedSlippage)}
              onChange={(val) => setDebouncedSlippage(String(val))}
              min={0.5}
              max={5.0}
              step={0.1}
              size={20}
              float={true}
            />
          </>
        </AutoColumn>
      </DarkCard>
      <DarkCard padding="5px">
        <AutoColumn gap="md">
          <>
            <RowBetween>
              <ThemedText.DeprecatedMain fontWeight={400}>
                <Trans>Reduce Amount ({`${position?.totalPosition ? new BN((Number(reduceAmount) / Number(position?.totalPosition) * 100)).toString() : "-"}% Reduction`})</Trans>
              </ThemedText.DeprecatedMain>
            </RowBetween>
            <AutoColumn>
              <CurrencyInputPanel
                value={debouncedReduceAmount}
                id="reduce-position-input"
                onUserInput={(str: string) => {
                  if (position?.totalPosition) {
                    if (str === "") {
                      setDebouncedReduceAmount("")
                    } else if (new BN(str).isGreaterThan(new BN(position?.totalPosition))) {
                      return
                    } else {
                      setDebouncedReduceAmount(str)
                    }
                  }
                }}
                showMaxButton={true}
                onMax={() => {
                  setDebouncedReduceAmount(position?.totalPosition ? String(position?.totalPosition) : "")
                }}
                hideBalance={true}
                currency={inputIsToken0 ? token1 : token0}
              />
            </AutoColumn>
          </>
        </AutoColumn>
      </DarkCard>
      <TransactionDetails>
        <Wrapper style={{ marginTop: '0' }}>
          <AutoColumn gap="sm" style={{ width: '100%', marginBottom: '-8px' }}>
            <StyledHeaderRow onClick={() => !disabled && setShowDetails(!showDetails)} disabled={disabled} open={showDetails}>
              <RowFixed style={{ position: 'relative' }}>
                {(loading ? (
                  <StyledPolling>
                    <StyledPollingDot>
                      <Spinner />
                    </StyledPollingDot>
                  </StyledPolling>
                ) : (
                  <HideSmall>
                    <StyledInfoIcon color={leverageManagerAddress ? theme.textTertiary : theme.deprecated_bg3} />
                  </HideSmall>
                ))}
                {leverageManagerAddress ? (
                  loading ? (
                    <ThemedText.DeprecatedMain fontSize={14}>
                      <Trans>Fetching returns...</Trans>
                    </ThemedText.DeprecatedMain>
                  ) : (
                    <LoadingOpacityContainer $loading={loading}>
                      Trade Details
                    </LoadingOpacityContainer>
                  )
                ) : null}
              </RowFixed>
              <RowFixed>
                <RotatingArrow
                  stroke={position?.token0Address ? theme.textTertiary : theme.deprecated_bg3}
                  open={Boolean(showDetails)}
                />
              </RowFixed>

            </StyledHeaderRow>
            <AnimatedDropdown open={showDetails}>
              <AutoColumn gap="sm" style={{ padding: '0', paddingBottom: '8px' }}>
                {!loading && transactionInfo ? (
                  <StyledCard>
                    <AutoColumn gap="sm">
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                The amount of position you are closing
                              </Trans>
                            }
                          >
                            <ThemedText.LabelSmall >
                              <Trans>Position to close</Trans>
                            </ThemedText.LabelSmall>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            <TruncatedText>
                              {
                                `${inputIsToken0 ? new BN(reduceAmount).abs().toString() : new BN(reduceAmount).abs().toString()}  ${!inputIsToken0 ? token0?.symbol : token1?.symbol}`
                              }
                            </TruncatedText>
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <Separator />
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                The amount entire position swaps to at the current market price. May receive less or more if the
                                market price changes while your transaction is pending.
                              </Trans>
                            }
                          >
                            <ThemedText.LabelSmall >
                              <Trans>Exp. Output</Trans>
                            </ThemedText.LabelSmall>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            <TruncatedText>
                              {
                                `${inputIsToken0 ? new BN(transactionInfo?.token0Amount).abs().toString() : new BN(transactionInfo?.token1Amount).abs().toString()}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`
                              }
                            </TruncatedText>
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                Premium remaining from last payment returned. The amount returned is inversely proportional to how long the position was opened. 
                              </Trans>
                            }
                          >
                            <ThemedText.LabelSmall >
                              <Trans>Premium Returned</Trans>
                            </ThemedText.LabelSmall>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            <TruncatedText>
                              {
                                `${formatNumber(Number(transactionInfo.unusedPremium), NumberType.SwapTradeAmount)}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`
                              }
                            </TruncatedText>
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                May be positive when price moves against you, where some portion of your margin will be converted to trade output asset. 
                              </Trans>
                            }
                          >
                            <ThemedText.LabelSmall >
                              <Trans>Returned Amount</Trans>
                            </ThemedText.LabelSmall>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            <TruncatedText>
                              {
                                `${Number(transactionInfo?.returnedAmount)}  ${inputIsToken0 ? token1?.symbol : token0?.symbol}`
                              }
                            </TruncatedText>
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                      <RowBetween>
                        <RowFixed>
                          <MouseoverTooltip
                            text={
                              <Trans>
                                Expected PnL in relation to your collateral. Does NOT account for paid premiums
                              </Trans>
                            }
                          >
                            <ThemedText.LabelSmall >
                              <Trans>Expected PnL</Trans>
                            </ThemedText.LabelSmall>
                          </MouseoverTooltip>
                        </RowFixed>
                        <TextWithLoadingPlaceholder syncing={loading} width={65}>
                          <ThemedText.DeprecatedBlack textAlign="right" fontSize={14}>
                            <TruncatedText>

                              {
                                `${formatNumber(Number(transactionInfo.pnl), NumberType.SwapTradeAmount)}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`

                              }
                            </TruncatedText>
                          <DeltaText delta={Number(100 * (Math.round(Number(transactionInfo?.pnl) * 1000) / 1000) / (Number(initCollateral)))}>
                            {formatNumber(100 * Number(transactionInfo.pnl) / (Number(initCollateral)), NumberType.SwapTradeAmount)} %
                          </DeltaText>
                          </ThemedText.DeprecatedBlack>
                        </TextWithLoadingPlaceholder>
                      </RowBetween>
                    </AutoColumn>

                  </StyledCard>
                )
                  : null}
              </AutoColumn>
            </AnimatedDropdown>
          </AutoColumn>
        </Wrapper>
      </TransactionDetails>
        <ButtonError
          onClick={handleReducePosition}
          disabled={!!userError || !transactionInfo}
          style={{ margin: '0px 0 0 0' }}
          id={InterfaceElementName.CONFIRM_SWAP_BUTTON}
        >
          {userError ? (
            userError
           ) : transactionInfo ? (
            <Text fontSize={18} fontWeight={500}>
              <Trans>Reduce Position</Trans>
            </Text>
          ) : (
            <Text fontSize={18} fontWeight={500}>
              <Trans>Invalid</Trans>
            </Text>
          )}
        </ButtonError>
      
      
        {/* {userError ? (
          userError
        ) : derivedState !== DerivedInfoState.VALID ? (
          <Trans>
            Invalid Transaction
          </Trans>
        ) : (
          <Text fontSize={20} fontWeight={500}>
            <Trans>Reduce Position</Trans>
          </Text>
        )
        } */}
    </AutoRow>
  )
}