import { Trans } from '@lingui/macro'
import { TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, SwapEventName } from '@uniswap/analytics-events'
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { Text } from 'rebass'
import { InterfaceTrade } from 'state/routing/types'
import { useClientSideRouter, useUserSlippageTolerance } from 'state/user/hooks'
import { computeRealizedPriceImpact } from 'utils/prices'

import { ButtonError, ButtonPrimary, ButtonSecondary } from '../Button'
import Row, { AutoRow, RowBetween, RowFixed } from '../Row'
import Card, { DarkCard, LightCard, OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import { Checkbox } from 'nft/components/layout/Checkbox'
import { HideSmall, Separator, ThemedText } from 'theme'
import { SmallMaxButton } from 'pages/RemoveLiquidity/styled'
import Slider from 'components/Slider'
import styled, { keyframes, useTheme } from 'styled-components'
import { ArrowCell, DeltaText, formatDelta, getDeltaArrow } from 'components/Tokens/TokenDetails/PriceChart'


import { MouseoverTooltip, MouseoverTooltipContent } from 'components/Tooltip'
import AnimatedDropdown from 'components/AnimatedDropdown'

import { BigNumber as BN } from "bignumber.js"
import { useCurrency, useToken } from 'hooks/Tokens'
import { formatNumber, formatNumberOrString } from '@uniswap/conedison/format'
import { useLimitlessPositionFromTokenId } from 'hooks/useV3Positions'
import useDebouncedChangeHandler from 'hooks/useDebouncedChangeHandler'
import { LimitlessPositionDetails } from 'types/leveragePosition'
import { LoadingOpacityContainer, loadingOpacityMixin } from 'components/Loader/styled'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { DEFAULT_ERC20_DECIMALS } from 'constants/tokens'
import { useTransactionAdder } from 'state/transactions/hooks'
import { TransactionType } from 'state/transactions/types'
import { currencyId } from 'utils/currencyId'
import {DerivedInfoState, SliderText, TransactionDetails, Wrapper, StyledHeaderRow, StyledPollingDot, StyledInfoIcon, Spinner, StyledPolling, RotatingArrow, TextWithLoadingPlaceholder, StyledCard, TruncatedText } from './common'
import { useLeverageManagerContract, useQuoter } from 'hooks/useContract'
import { CurrencyAmount } from '@uniswap/sdk-core'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useWeb3React } from '@web3-react/core'
import { useCurrencyBalances } from 'lib/hooks/useCurrencyBalance'
// import { Info } from 'react-feather'
// import Loader from 'components/Icons/LoadingSpinner'
import { usePool } from 'hooks/usePools'
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
  } | undefined,
  userError: React.ReactNode | undefined
} {
  const leverageManagerContract = useLeverageManagerContract(leverageManager)

  const [contractResult, setContractResult] = useState<{
    reducePositionResult: any
  }>()

  const { account } = useWeb3React()
  const currency0 = useCurrency(position?.token0Address)
  const currency1 = useCurrency(position?.token1Address)

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [currency0 ?? undefined, currency1 ?? undefined], [currency0, currency1])
  )
  const userError = useMemo(() => {
    let error;
    if (!reduceAmount || Number(reduceAmount) <= 0) {
      error = (<Trans>
        Invalid Amount
      </Trans>)
    }
    return error
  }, [ position, relevantTokenBalances, reduceAmount])
  
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
  }, [userError, leverageManager, trader, tokenId, allowedSlippage, reduceAmount])

  const transactionInfo = useMemo(() => {
    if (contractResult) {
      const { reducePositionResult } = contractResult
      let token0Amount = new BN(reducePositionResult[0].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      let token1Amount = new BN(reducePositionResult[1].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      let pnl = new BN(reducePositionResult[2].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      let returnedAmount = new BN(reducePositionResult[3].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      let unusedPremium = new BN(reducePositionResult[4].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)
      let premium = new BN(reducePositionResult[5].toString()).shiftedBy(-DEFAULT_ERC20_DECIMALS).toFixed(DEFAULT_ERC20_DECIMALS)

      return {
        token0Amount,
        token1Amount,
        pnl,
        returnedAmount,
        unusedPremium,
        premium
      }
    } else {
      return undefined
    }
  }, [
    contractResult
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
  setTxHash
}: {
  leverageManagerAddress: string | undefined
  tokenId: string | undefined
  trader: string | undefined,
  setAttemptingTxn: (attemptingTxn: boolean) => void
  setTxHash: (txHash: string) => void
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

  // const [, pool] = usePool(token0, token1, position?.poolFee)

  const handleReducePosition = useMemo(() => {
    if (
      leverageManagerContract && position && Number(reduceAmount) > 0 && Number(reduceAmount) <= Number(position.totalPosition) &&
      token0 && token1
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
        ).then((hash: any) => {
          addTransaction(hash, {
            type: TransactionType.REDUCE_LEVERAGE,
            reduceAmount: inputReduceAmount ?? "",
            inputCurrencyId: inputIsToken0 ? currencyId(token0) : currencyId(token1),
            outputCurrencyId: !inputIsToken0 ? currencyId(token0) : currencyId(token1)
          })
          setTxHash(hash)
          setAttemptingTxn(false)
        }).catch((err: any) => {
          setAttemptingTxn(false)
          console.log("error closing position: ", err)
        })
      }
    }
    return () => { }
  }, [
    leverageManagerAddress, slippage, tokenId, trader, position, reduceAmount,
    token0,
    token1,
    inputIsToken0
  ])

  const [derivedState, setDerivedState] = useState<DerivedInfoState>(DerivedInfoState.INVALID)
  const [showDetails, setShowDetails] = useState(true)
  const theme = useTheme()

  const [, pool] = usePool(token0 ?? undefined, token1 ?? undefined, position?.poolFee)

  const [debouncedSlippage, setDebouncedSlippage] = useDebouncedChangeHandler(slippage, setSlippage)
  const [debouncedReduceAmount, setDebouncedReduceAmount] = useDebouncedChangeHandler(reduceAmount, setReduceAmount);

  // const quoter = useQuoter(true) as QuoterV2 | null;

  // useEffect(() => {
  //   async function getPremium() {
  //     if (pool && position && token1 && token0 && position?.token1Address && position?.token0Address && quoter && Number(reduceAmount) > 0) {
  //       const newTotalPosition = Number(position.totalPosition) - Number(reduceAmount)
  //       try {
  //         const result = await quoter?.callStatic.quoteExactInputSingle(
  //           {
  //             tokenIn: position.isToken0 ? position.token0Address : position.token1Address,
  //             tokenOut: position.isToken0 ? position.token1Address : position.token0Address,
  //             amountIn: new BN(newTotalPosition).shiftedBy(18).toFixed(0),
  //             fee: pool.fee,
  //             sqrtPriceLimitX96: 0
  //           }
  //         )
  //         if (result) {
  //           const amountOut = new BN(result.amountOut.toString()).shiftedBy(-18).toNumber()
  //           setPremium(amountOut * 0.002)
  //         }
  //         return
  //       } catch (err) {
  //         console.log("error getting premium: ", err)
  //       }
  //     }
  //     setPremium(0)
  //   }

  //   getPremium()
  // }, [position, reduceAmount, pool, quoter])

  // const inputCurrency = useCurrency(position?.isToken0 ? position?.token1Address : position?.token0Address)

  // const [approvalState, approveManager] = useApproveCallback(
  //   inputCurrency ?
  //     CurrencyAmount.fromRawAmount(inputCurrency, new BN(premium).shiftedBy(18).toFixed(0)) : undefined,
  //   position?.leverageManagerAddress ?? undefined
  // )



  const {
    transactionInfo,
    userError
  } = useDerivedLeverageReduceInfo(leverageManagerAddress, trader, tokenId, debouncedSlippage, position, debouncedReduceAmount, setDerivedState)
  
  useEffect(() => {
    (!!userError || !transactionInfo) && showDetails //&& setShowDetails(false)
  }, [userError, transactionInfo])
  const loading = useMemo(() => derivedState === DerivedInfoState.LOADING, [derivedState])

  const disabled = !!userError || !transactionInfo
  // const debt = position?.totalDebtInput;
  const initCollateral = position?.initialCollateral;
  // const received = inputIsToken0 ? (Math.abs(Number(transactionInfo?.token0Amount)) - Number(debt))
  //   : (Math.abs(Number(transactionInfo?.token1Amount)) - Number(debt))

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
                  open={Boolean(position?.token0Address && showDetails)}
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
                              <Trans>Expected Output</Trans>
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
                                `${Number(transactionInfo?.unusedPremium)}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`
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
                                `${(Math.round(Number(transactionInfo?.pnl) * 1000) / 1000)}  ${inputIsToken0 ? token0?.symbol : token1?.symbol}`

                              }
                            </TruncatedText>
                  <DeltaText delta={Number(100 * (Math.round(Number(transactionInfo?.pnl) * 1000) / 1000) / (Number(initCollateral)))}>
                    {100 * (Math.round(Number(transactionInfo?.pnl) * 1000) / 1000) / (Number(initCollateral))} %
                  </DeltaText>                             
                            {/*<TruncatedText>
                              ({
                                `${100 * (Math.round(Number(transactionInfo?.pnl) * 1000) / 1000) / (Number(initCollateral))} %`

                              })
                            </TruncatedText>*/}
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
          {!!userError ? (
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