import { Trans } from '@lingui/macro'
import {
  BrowserEvent,
  InterfaceElementName,
  InterfaceEventName,
  SharedEventName,
  SwapEventName,
} from '@uniswap/analytics-events'
import { ChainId, CurrencyAmount, NativeCurrency, Token } from '@uniswap/sdk-core'
import { UNIVERSAL_ROUTER_ADDRESS } from '@uniswap/universal-router-sdk'
import { useWeb3React } from '@web3-react/core'
import { sendAnalyticsEvent, TraceEvent, useTrace } from 'analytics'
import { transactionToActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import Badge, { BadgeVariant } from 'components/Badge'
import { ButtonError, ButtonLight, ButtonPrimary } from 'components/Button'
import { GrayCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import { getChainInfo } from 'constants/chainInfo'
import { isSupportedChain } from 'constants/chains'
import { TokenPriceQuery, TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { QueryToken } from 'graphql/data/Token'
import { useAllTokensMultichain } from 'hooks/Tokens'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useMaxAmountIn } from 'hooks/useMaxAmountIn'
import usePermit2Allowance, { AllowanceState } from 'hooks/usePermit2Allowance'
import usePrevious from 'hooks/usePrevious'
import { SwapResult, useSwapCallback } from 'hooks/useSwapCallback'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useUSDPrice } from 'hooks/useUSDPrice'
import useWrapCallback, { WrapErrorText, WrapType } from 'hooks/useWrapCallback'
import JSBI from 'jsbi'
import { formatSwapQuoteReceivedEventProperties } from 'lib/utils/analytics'
import { ReactNode, useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import { Check, Shield } from 'react-feather'
import { Text } from 'rebass'
import { useAppSelector } from 'state/hooks'
import { InterfaceTrade, TradeFillType, TradeState } from 'state/routing/types'
import { isClassicTrade } from 'state/routing/utils'
import { Field, replaceSwapState } from 'state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers } from 'state/swap/hooks'
import swapReducer, { initialState as initialSwapState, SwapState } from 'state/swap/reducer'
import { useSwapTransactionStatus, useTransaction } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components'
import { ExternalLink } from 'theme'
import { ThemedText } from 'theme'
import { maybeLogFirstSwapAction } from 'tracing/swapFlowLoggers'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { formatUSDPrice } from 'utils/formatNumbers'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

import { LoadingBubble } from '../loading'
import { usePriceHistory } from '../TokenDetails/ChartSection'
import { formatDelta, getDeltaArrow } from '../TokenDetails/PriceChart'

const Container = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px;
`
const BannerContainer = styled.div<{ logo?: string }>`
  width: 100%;
  height: 100%;
  padding: 16px;
  background-image: linear-gradient(#1b1b1b, rgba(27, 27, 27, 0.7)), url(${({ logo }) => (logo ? logo : undefined)}});
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  background-color: transparent;
  border-radius: 16px;
`
const StyledBadge = styled(Badge)`
  color: ${({ theme }) => theme.accentSuccess};
  background: ${({ theme }) => theme.backgroundInteractive};
  font-size: 12px;
  border-radius: 16px;
  padding: 4px 8px 4px 8px;
  height: 32px;
`
const IconContainer = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-right: 4px;
`
const StyledCheck = styled(Check)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  width: 50%;
  height: 50%;
`
const DeltaContainer = styled.div<{ positive: boolean }>`
  height: 20px;
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 500;
  color: ${({ positive, theme }) => (positive ? theme.accentSuccess : theme.accentFailure)};
`
const ArrowCell = styled.div`
  padding-right: 3px;
  display: flex;
`
const StyledPrice = styled.span`
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
`
const ButtonContainer = styled.div`
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`
function getIsValidSwapQuote(
  trade: InterfaceTrade | undefined,
  tradeState: TradeState,
  swapInputError?: ReactNode
): boolean {
  return Boolean(!swapInputError && trade && tradeState === TradeState.VALID)
}

export function OneClickBuy({
  prefilledState = {},
  chainId,
  token,
  tokenPriceQuery,
  tokenLogoUrl,
  toggleMenu,
}: {
  prefilledState?: Partial<SwapState>
  chainId?: ChainId
  token?: NativeCurrency | Token | QueryToken | null
  tokenPriceQuery: TokenPriceQuery
  tokenLogoUrl?: string
  toggleMenu: () => void
}) {
  const { account, chainId: connectedChainId, connector } = useWeb3React()
  const trace = useTrace()
  const theme = useTheme()

  // One-Click-Buy state
  const DATA_EMPTY = { value: 0, timestamp: 0 }
  const [selectedAmount, setSelectedAmount] = useState('0.1')
  const amounts = ['0.05', '0.1', '0.5']
  const prices = usePriceHistory(tokenPriceQuery)
  const startingPrice = prices?.[0] ?? DATA_EMPTY
  const endingPrice = prices?.[prices.length - 1] ?? DATA_EMPTY
  const delta = (endingPrice.value / startingPrice.value - 1) * 100
  const formattedDelta = formatDelta(delta)
  const arrow = getDeltaArrow(delta)

  // Swap state
  const [state, dispatch] = useReducer(swapReducer, { ...initialSwapState, ...prefilledState })
  const { typedValue, independentField } = state

  const previousConnectedChainId = usePrevious(connectedChainId)
  const previousPrefilledState = usePrevious(prefilledState)
  useEffect(() => {
    const combinedInitialState = { ...initialSwapState, ...prefilledState }
    const chainChanged = previousConnectedChainId && previousConnectedChainId !== connectedChainId
    const prefilledInputChanged =
      previousPrefilledState &&
      previousPrefilledState?.[Field.INPUT]?.currencyId !== prefilledState?.[Field.INPUT]?.currencyId
    const prefilledOutputChanged =
      previousPrefilledState &&
      previousPrefilledState?.[Field.OUTPUT]?.currencyId !== prefilledState?.[Field.OUTPUT]?.currencyId
    if (chainChanged || prefilledInputChanged || prefilledOutputChanged) {
      dispatch(
        replaceSwapState({
          ...initialSwapState,
          ...prefilledState,
          field: combinedInitialState.independentField ?? Field.INPUT,
          inputCurrencyId: combinedInitialState.INPUT.currencyId ?? undefined,
          outputCurrencyId: combinedInitialState.OUTPUT.currencyId ?? undefined,
        })
      )
      // reset local state
      setSwapState({
        tradeToConfirm: undefined,
        swapError: undefined,
        showConfirm: false,
        swapResult: undefined,
      })
    }
  }, [connectedChainId, prefilledState, previousConnectedChainId, previousPrefilledState])

  const swapInfo = useDerivedSwapInfo(state, chainId)
  const {
    trade: { state: tradeState, trade, swapQuoteLatency },
    allowedSlippage,
    parsedAmount,
    currencies,
    inputError: swapInputError,
  } = swapInfo

  const {
    wrapType,
    execute: onWrap,
    inputError: wrapInputError,
  } = useWrapCallback(currencies[Field.INPUT], currencies[Field.OUTPUT], typedValue)
  const showWrap: boolean = wrapType !== WrapType.NOT_APPLICABLE

  const parsedAmounts = useMemo(
    () =>
      showWrap
        ? {
            [Field.INPUT]: parsedAmount,
            [Field.OUTPUT]: parsedAmount,
          }
        : {
            [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
            [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
          },
    [independentField, parsedAmount, showWrap, trade]
  )

  const [routeNotFound, routeIsLoading, routeIsSyncing] = useMemo(
    () => [
      tradeState === TradeState.NO_ROUTE_FOUND,
      tradeState === TradeState.LOADING,
      tradeState === TradeState.LOADING && Boolean(trade),
    ],
    [trade, tradeState]
  )

  const fiatValueTradeInput = useUSDPrice(trade?.inputAmount)
  const fiatValueTradeOutput = useUSDPrice(trade?.outputAmount)
  const stablecoinPriceImpact = useMemo(
    () =>
      routeIsSyncing || !isClassicTrade(trade)
        ? undefined
        : computeFiatValuePriceImpact(fiatValueTradeInput.data, fiatValueTradeOutput.data),
    [fiatValueTradeInput, fiatValueTradeOutput, routeIsSyncing, trade]
  )

  const { onUserInput } = useSwapActionHandlers(dispatch)

  const handleTypeInput = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
      maybeLogFirstSwapAction(trace)
    },
    [onUserInput, trace]
  )

  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])

  const [{ swapResult }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm?: InterfaceTrade
    swapError?: Error
    swapResult?: SwapResult
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    swapError: undefined,
    swapResult: undefined,
  })

  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmounts[independentField]?.greaterThan(JSBI.BigInt(0))
  )

  const maximumAmountIn = useMaxAmountIn(trade, allowedSlippage)
  const allowance = usePermit2Allowance(
    maximumAmountIn ??
      (parsedAmounts[Field.INPUT]?.currency.isToken
        ? (parsedAmounts[Field.INPUT] as CurrencyAmount<Token>)
        : undefined),
    isSupportedChain(chainId) ? UNIVERSAL_ROUTER_ADDRESS(chainId) : undefined,
    trade?.fillType
  )

  const swapFiatValues = useMemo(() => {
    return { amountIn: fiatValueTradeInput.data, amountOut: fiatValueTradeOutput.data }
  }, [fiatValueTradeInput, fiatValueTradeOutput])

  const swapCallback = useSwapCallback(
    trade,
    swapFiatValues,
    allowedSlippage,
    allowance.state === AllowanceState.ALLOWED ? allowance.permitSignature : undefined
  )

  const handleSwap = useCallback(() => {
    if (!swapCallback) {
      return
    }
    if (stablecoinPriceImpact && !confirmPriceImpactWithoutFee(stablecoinPriceImpact)) {
      return
    }
    setSwapState((currentState) => ({
      ...currentState,
      swapError: undefined,
      swapResult: undefined,
    }))
    swapCallback()
      .then((result) => {
        setSwapState((currentState) => ({
          ...currentState,
          swapError: undefined,
          swapResult: result,
        }))
      })
      .catch((error) => {
        setSwapState((currentState) => ({
          ...currentState,
          swapError: error,
          swapResult: undefined,
        }))
      })
  }, [swapCallback, stablecoinPriceImpact])

  const handleOnWrap = useCallback(async () => {
    if (!onWrap) return
    try {
      const txHash = await onWrap()
      setSwapState((currentState) => ({
        ...currentState,
        swapError: undefined,
        txHash,
      }))
      onUserInput(Field.INPUT, '')
    } catch (error) {
      if (!didUserReject(error)) {
        sendAnalyticsEvent(SwapEventName.SWAP_ERROR, {
          wrapType,
          input: currencies[Field.INPUT],
          output: currencies[Field.OUTPUT],
        })
      }
      console.error('Could not wrap/unwrap', error)
      setSwapState((currentState) => ({
        ...currentState,
        swapError: error,
        txHash: undefined,
      }))
    }
  }, [currencies, onUserInput, onWrap, wrapType])

  const prevTrade = usePrevious(trade)
  useEffect(() => {
    if (!trade || prevTrade === trade) return // no new swap quote to log

    sendAnalyticsEvent(SwapEventName.SWAP_QUOTE_RECEIVED, {
      ...formatSwapQuoteReceivedEventProperties(trade, allowedSlippage, swapQuoteLatency),
      ...trace,
    })
  }, [prevTrade, trade, trace, allowedSlippage, swapQuoteLatency])

  const switchChain = useSwitchChain()
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)

  const swapStatus = useSwapTransactionStatus(swapResult)

  const hash = swapResult?.type === TradeFillType.Classic ? swapResult?.response.hash : undefined
  const transaction = useTransaction(hash)
  const tokens = useAllTokensMultichain()

  function getAmountOut() {
    if (transaction) {
      const activity = transactionToActivity(transaction, token?.chainId as ChainId, tokens)
      if (activity) {
        const parts = activity?.descriptor?.split(' for ')
        return parts ? parts[1] : '0 BITCOIN'
      }
    }
    return '0 BITCOIN'
  }

  return (
    <Container>
      <AutoColumn gap="md" style={{ height: '100%' }}>
        <Row justify="space-between">
          {swapStatus === TransactionStatus.Confirmed ? (
            <Text fontSize={24} fontWeight={500}>
              Swap success!
            </Text>
          ) : (
            <Text fontSize={24} fontWeight={500}>
              Buy {token?.symbol}
            </Text>
          )}
          <StyledBadge variant={BadgeVariant.SOFT}>
            <IconContainer>
              <Shield fill={theme.accentSuccessSoft} size={15} />
              <StyledCheck />
            </IconContainer>
            <Text fontSize={12}>Frontrun Protected</Text>
          </StyledBadge>
        </Row>
        <Row>
          <BannerContainer logo={tokenLogoUrl}>
            <Row justify="center">
              <CurrencyLogo currency={token} size="32px" hideL2Icon={false} />
            </Row>
            {swapStatus === TransactionStatus.Confirmed ? (
              <Row justify="center" padding="18px">
                <Text fontSize={18} fontWeight={500}>
                  Bought {getAmountOut()}
                </Text>
              </Row>
            ) : (
              <>
                <Row justify="center">
                  <Text fontSize={18} fontWeight={500}>
                    {token?.name ?? <Trans>Name not found</Trans>}
                  </Text>
                </Row>
                <Row justify="center">
                  <Text fontSize={18} fontWeight={500}>
                    {token?.symbol ?? <Trans>Symbol not found</Trans>}
                  </Text>
                </Row>
                <Row justify="center">
                  <StyledPrice>{formatUSDPrice(endingPrice.value)}</StyledPrice>
                  <DeltaContainer positive={delta > 0}>
                    <ArrowCell>{arrow}</ArrowCell>
                    {formattedDelta}
                  </DeltaContainer>
                </Row>
              </>
            )}
          </BannerContainer>
        </Row>
        {swapStatus === TransactionStatus.Confirmed ? (
          <ButtonContainer>
            <Row>
              <ButtonPrimary
                fontWeight={600}
                height="48px"
                $borderRadius="12px"
                onClick={async () => await navigator.clipboard.writeText(window.location.href)}
              >
                <Trans>Share this swap</Trans>
              </ButtonPrimary>
            </Row>
            {swapResult && swapResult.type === TradeFillType.Classic && (
              <Row justify="center">
                <ExternalLink
                  href={getExplorerLink(token?.chainId || 1, swapResult.response.hash, ExplorerDataType.TRANSACTION)}
                  color="textSecondary"
                >
                  <Trans>View on Explorer</Trans>
                </ExternalLink>
              </Row>
            )}
          </ButtonContainer>
        ) : (
          <>
            <Row gap="8px">
              {amounts.map((amount, index) =>
                amount === selectedAmount ? (
                  <ButtonPrimary key={index} onClick={() => setSelectedAmount('0')} height="48px" $borderRadius="16px">
                    <Text fontSize={16} fontWeight={600}>
                      {amount} ETH
                    </Text>
                  </ButtonPrimary>
                ) : (
                  <ButtonLight
                    key={index}
                    onClick={() => {
                      setSelectedAmount(amount)
                      handleTypeInput(amount)
                    }}
                    height="48px"
                    $borderRadius="16px"
                  >
                    <Text fontSize={16} fontWeight={600}>
                      {amount} ETH
                    </Text>
                  </ButtonLight>
                )
              )}
            </Row>
            <div>
              {swapIsUnsupported ? (
                <ButtonPrimary height="48px" $borderRadius="12px" padding="12px 8px 12px 8px" disabled={true}>
                  <ThemedText.DeprecatedMain mb="4px">
                    <Trans>Unsupported Asset</Trans>
                  </ThemedText.DeprecatedMain>
                </ButtonPrimary>
              ) : switchingChain ? (
                <ButtonPrimary height="48px" $borderRadius="12px" padding="12px 8px 12px 8px" disabled={true}>
                  <Trans>Connecting to {getChainInfo(switchingChain)?.label}</Trans>
                </ButtonPrimary>
              ) : !account ? (
                <TraceEvent
                  events={[BrowserEvent.onClick]}
                  name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                  properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
                  element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                >
                  <ButtonLight onClick={toggleMenu} fontWeight={600} $borderRadius="16px">
                    <Trans>Connect Wallet</Trans>
                  </ButtonLight>
                </TraceEvent>
              ) : chainId && chainId !== connectedChainId ? (
                <ButtonPrimary
                  height="48px"
                  $borderRadius="12px"
                  padding="12px 8px 12px 8px"
                  onClick={async () => {
                    try {
                      await switchChain(connector, chainId)
                    } catch (error) {
                      if (didUserReject(error)) {
                        // Ignore error, which keeps the user on the previous chain.
                      } else {
                        // TODO(WEB-3306): This UX could be improved to show an error state.
                        throw error
                      }
                    }
                  }}
                >
                  Connect to {getChainInfo(chainId)?.label}
                </ButtonPrimary>
              ) : showWrap ? (
                <ButtonPrimary
                  disabled={Boolean(wrapInputError)}
                  onClick={handleOnWrap}
                  fontWeight={600}
                  height="48px"
                  $borderRadius="12px"
                  padding="12px 8px 12px 8px"
                  data-testid="wrap-button"
                >
                  {wrapInputError ? (
                    <WrapErrorText wrapInputError={wrapInputError} />
                  ) : wrapType === WrapType.WRAP ? (
                    <Trans>Wrap</Trans>
                  ) : wrapType === WrapType.UNWRAP ? (
                    <Trans>Unwrap</Trans>
                  ) : null}
                </ButtonPrimary>
              ) : routeNotFound && userHasSpecifiedInputOutput && !routeIsLoading && !routeIsSyncing ? (
                <GrayCard style={{ textAlign: 'center' }}>
                  <ThemedText.DeprecatedMain mb="4px">
                    <Trans>Insufficient liquidity for this trade.</Trans>
                  </ThemedText.DeprecatedMain>
                </GrayCard>
              ) : (
                <TraceEvent
                  events={[BrowserEvent.onClick]}
                  name={SharedEventName.ELEMENT_CLICKED}
                  element={InterfaceElementName.SWAP_BUTTON}
                >
                  <AutoColumn justify="center" gap="sm">
                    <ButtonError
                      onClick={handleSwap}
                      id="swap-button"
                      data-testid="swap-button"
                      disabled={!getIsValidSwapQuote(trade, tradeState, swapInputError)}
                      error={false}
                      height="48px"
                      $borderRadius="12px"
                      padding="12px 8px 12px 8px"
                    >
                      <Text fontSize={20} fontWeight={600}>
                        {swapInputError ? (
                          swapInputError
                        ) : getIsValidSwapQuote(trade, tradeState, swapInputError) ? (
                          <Trans>Buy now</Trans>
                        ) : (
                          <Trans>Fetching best quote</Trans>
                        )}
                      </Text>
                    </ButtonError>
                    {!swapInputError && getIsValidSwapQuote(trade, tradeState, swapInputError) ? (
                      <Text fontSize={14} fontWeight={600}>
                        You will receive {trade?.outputAmount.toSignificant(8)} {token?.symbol}
                      </Text>
                    ) : (
                      <LoadingBubble height="18px" />
                    )}
                  </AutoColumn>
                </TraceEvent>
              )}
            </div>
          </>
        )}
      </AutoColumn>
    </Container>
  )
}
