import { Trans } from '@lingui/macro'
import { BrowserEvent, InterfaceElementName, InterfaceEventName, SharedEventName } from '@uniswap/analytics-events'
import { ChainId, NativeCurrency, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { TraceEvent, useTrace } from 'analytics'
import { transactionToActivity } from 'components/AccountDrawer/MiniPortfolio/Activity/parseLocal'
import { ButtonError, ButtonLight, ButtonPrimary, ButtonSecondary } from 'components/Button'
import Card, { GrayCard, OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Row from 'components/Row'
import confirmPriceImpactWithoutFee from 'components/swap/confirmPriceImpactWithoutFee'
import { getChainInfo } from 'constants/chainInfo'
import { TokenPriceQuery, TransactionStatus } from 'graphql/data/__generated__/types-and-hooks'
import { QueryToken } from 'graphql/data/Token'
import { useAllTokensMultichain } from 'hooks/Tokens'
import { useImageColor } from 'hooks/useImageColor'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { SwapResult, useSwapCallback } from 'hooks/useSwapCallback'
import { useSwitchChain } from 'hooks/useSwitchChain'
import { useUSDPrice } from 'hooks/useUSDPrice'
import { getIsValidSwapQuote, largerPercentValue } from 'pages/Swap'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Copy, Globe, Twitter, X } from 'react-feather'
import { Text } from 'rebass'
import { useAppSelector } from 'state/hooks'
import { InterfaceTrade, TradeFillType, TradeState } from 'state/routing/types'
import { isClassicTrade, isUniswapXTrade } from 'state/routing/utils'
import { Field } from 'state/swap/actions'
import { useDerivedSwapInfo, useSwapActionHandlers } from 'state/swap/hooks'
import swapReducer, { initialState as initialSwapState, SwapState } from 'state/swap/reducer'
import { useSwapTransactionStatus, useTransaction } from 'state/transactions/hooks'
import styled, { useTheme } from 'styled-components'
import { ClickableStyle, CopyHelper, CopyHelperRefType } from 'theme'
import { ThemedText } from 'theme'
import { maybeLogFirstSwapAction } from 'tracing/swapFlowLoggers'
import { computeFiatValuePriceImpact } from 'utils/computeFiatValuePriceImpact'
import { useFormatter } from 'utils/formatNumbers'
import { computeRealizedPriceImpact, warningSeverity } from 'utils/prices'
import { didUserReject } from 'utils/swapErrorToUserReadableMessage'

import { LoadingBubble } from '../loading'
import { ProtectedBadge } from './ProtectedBadge'
import { TokenBanner } from './TokenBanner'

const OneClickBuyContainer = styled.div`
  width: 100%;
  height: 100%;
  padding: 16px;
`
const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  gap: 12px;
`
const StyledButton = styled(ButtonPrimary)`
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  padding: 12px 8px 12px 8px;
`
const StyledButtonLight = styled(ButtonLight)`
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  padding: 12px 8px 12px 8px;
`
const StyledButtonError = styled(ButtonError)`
  height: 48px;
  border-radius: 12px;
  font-weight: 600;
  padding: 12px 8px 12px 8px;
`
const CloseIcon = styled(X)`
  ${ClickableStyle}
`
const StyledCopyHelper = styled(CopyHelper)`
  width: 100%;
  height: 100%;
  margin: 10px;
  color: ${({ theme }) => theme.accent1};
`
const ButtonRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 48px;
  gap: 8px;
`
const LoadingBar = styled.div<{ color: string; percentage: number }>`
  width: ${({ percentage }) => percentage}%;
  height: 100%;
  background: linear-gradient(to right, ${({ theme }) => theme.accent1}, ${({ theme }) => theme.accent2});
  border-radius: 12px;
`
const LoadingBarContainer = styled(OutlineCard)`
  overflow: hidden;
  height: 48px;
  padding: 0px;
  box-shadow: 0 0 10px 1px ${({ theme }) => theme.accent1};
  background: ${({ theme }) => theme.accent1};
`
const StyledCopyButton = styled(ButtonSecondary)`
  padding: 10px;
  height: 48px;
  width: 100%;
`
export function OneClickBuy({
  token,
  tokenPriceQuery,
  tokenLogoUrl,
  prefilledState = {},
  buyAmountOptions,
  toggleMenu,
  close,
}: {
  token: NativeCurrency | Token | QueryToken | null
  tokenPriceQuery: TokenPriceQuery
  tokenLogoUrl?: string
  prefilledState?: Partial<SwapState>
  buyAmountOptions: string[]
  toggleMenu: () => void
  close: () => void
}) {
  // setup
  const trace = useTrace()
  const theme = useTheme()
  const { account, chainId: connectedChainId, connector } = useWeb3React()
  const switchChain = useSwitchChain()
  const switchingChain = useAppSelector((state) => state.wallets.switchingChain)

  const color = useImageColor(tokenLogoUrl)
  const [percentage, setPercentage] = useState(0)

  useEffect(() => {
    const totalTime = 15000 // 15 seconds in milliseconds
    const startTime = Date.now()

    const updatePercentage = () => {
      const currentTime = Date.now()
      const elapsedTime = currentTime - startTime

      if (elapsedTime < totalTime) {
        const newPercentage = (elapsedTime / totalTime) * 100
        setPercentage(newPercentage)
        requestAnimationFrame(updatePercentage)
      } else {
        setPercentage(100)
      }
    }

    requestAnimationFrame(updatePercentage)

    return () => {
      setPercentage(0) // Reset the percentage when unmounting
    }
  }, [])

  // one-click buy is implemented as an exact-in swap from ETH to target currency
  // initialize swap state
  const [state, dispatch] = useReducer(swapReducer, {
    ...initialSwapState,
    ...prefilledState,
  })
  const chainId = token?.chainId
  const swapInfo = useDerivedSwapInfo(state, chainId)
  const {
    trade: { state: tradeState, trade, swapQuoteLatency },
    allowedSlippage,
    currencies,
    inputError: swapInputError,
  } = swapInfo

  // compute route and price impact
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

  // handle selection of input amount by modifying swap state
  const { onUserInput } = useSwapActionHandlers(dispatch)
  const handleSelectEthAmount = useCallback(
    (value: string) => {
      onUserInput(Field.INPUT, value)
      maybeLogFirstSwapAction(trace)
    },
    [onUserInput, trace]
  )

  // set up swap callback
  const [swapState, setSwapState] = useState<{
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
  const swapFiatValues = useMemo(() => {
    return { amountIn: fiatValueTradeInput.data, amountOut: fiatValueTradeOutput.data }
  }, [fiatValueTradeInput, fiatValueTradeOutput])
  const swapCallback = useSwapCallback(trade, swapFiatValues, allowedSlippage, undefined)
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

  // automatically close modal if swap is unsupported or price impact severity is greater than 1
  const swapIsUnsupported = useIsSwapUnsupported(currencies[Field.INPUT], currencies[Field.OUTPUT])
  useMemo(() => {
    if (isUniswapXTrade(trade)) {
      return
    }

    const marketPriceImpact = trade?.priceImpact ? computeRealizedPriceImpact(trade) : undefined
    const largerPriceImpact = largerPercentValue(marketPriceImpact, stablecoinPriceImpact)
    if (swapIsUnsupported || warningSeverity(largerPriceImpact) > 1) {
      close()
    }
  }, [swapIsUnsupported, stablecoinPriceImpact, trade, close])

  // below logic handles confirmation / sharing view
  // get transaction result and display total amount purchased
  const { swapResult } = swapState
  const swapStatus = useSwapTransactionStatus(swapResult)
  const hash = swapResult?.type === TradeFillType.Classic ? swapResult?.response.hash : undefined
  const transaction = useTransaction(hash)
  const tokens = useAllTokensMultichain()
  const { formatNumber } = useFormatter()
  function getAmountOut() {
    if (transaction) {
      const activity = transactionToActivity(transaction, token?.chainId as ChainId, tokens, formatNumber)
      if (activity) {
        const parts = activity?.descriptor?.split(' for ')
        return parts && parts.length == 2 ? parts[1] : undefined
      }
    }
    return undefined
  }

  // handle copying link after buy is complete
  const copyHelperRef = useRef<CopyHelperRefType>(null)

  return (
    <OneClickBuyContainer>
      <AutoColumn gap="md">
        <Row justify="space-between">
          <Row gap="sm">
            {swapStatus === TransactionStatus.Confirmed ? (
              <Text fontSize={24} fontWeight={500}>
                Swap success!
              </Text>
            ) : (
              <Text fontSize={24} fontWeight={500}>
                <Trans>Buy {token?.symbol}</Trans>
              </Text>
            )}
            <ProtectedBadge />
          </Row>
          <CloseIcon onClick={close} />
        </Row>
        <Row>
          <TokenBanner token={token} tokenPriceQuery={tokenPriceQuery} tokenLogoUrl={tokenLogoUrl} />
        </Row>
        {swapStatus === TransactionStatus.Confirmed ? (
          <ButtonContainer>
            <ButtonRow>
              <Card height="48px" alignItems="center" overflow="hidden">
                <Text fontSize={16} fontWeight={600} textAlign="center">
                  <Trans>You bought {getAmountOut() || `$${token?.symbol}`}</Trans>
                </Text>
              </Card>
            </ButtonRow>
            {/* {swapResult && swapResult.type === TradeFillType.Classic && (
              <ButtonRow>
                <ExternalLink
                  href={getExplorerLink(token?.chainId || 1, swapResult.response.hash, ExplorerDataType.TRANSACTION)}
                  color="textSecondary"
                >
                  <Trans>View on Explorer</Trans>
                </ExternalLink>
              </ButtonRow>
            )} */}
            <ButtonRow>
              <ButtonSecondary key={1}>
                <Twitter />
              </ButtonSecondary>
              <ButtonSecondary key={2}>
                <Copy />
              </ButtonSecondary>
              <ButtonSecondary key={3}>
                <Globe />
              </ButtonSecondary>
            </ButtonRow>
            <ButtonRow>
              {/* <StyledButton onClick={() => copyHelperRef.current?.forceCopy()}>
                <StyledCopyHelper iconPosition="left" gap={12} toCopy={window.location.href} ref={copyHelperRef}>
                  <Trans>Share this swap</Trans>
                </StyledCopyHelper>
              </StyledButton> */}
              <StyledButton onClick={close}>Done</StyledButton>
            </ButtonRow>
          </ButtonContainer>
        ) : (
          <ButtonContainer>
            <ButtonRow>
              <Card height="48px" alignItems="center">
                {!swapInputError ? (
                  getIsValidSwapQuote(trade, tradeState, swapInputError) ? (
                    <Text fontSize={18} fontWeight={600} textAlign="center">
                      <Trans>
                        You will receive {trade?.outputAmount.toSignificant(8)} {token?.symbol}
                      </Trans>
                    </Text>
                  ) : (
                    <LoadingBubble height="18px" margin="auto" />
                  )
                ) : (
                  <Text fontSize={14} fontWeight={600}>
                    <Trans>Unable to provide a quote</Trans>
                  </Text>
                )}
              </Card>
            </ButtonRow>
            <ButtonRow>
              {buyAmountOptions.map((amount: string, index) =>
                amount === state.typedValue ? (
                  <StyledButton key={index}>
                    <Text fontSize={16} fontWeight={600}>
                      {amount} ETH
                    </Text>
                  </StyledButton>
                ) : (
                  <StyledButtonLight key={index} onClick={() => handleSelectEthAmount(amount)}>
                    <Text fontSize={16} fontWeight={600}>
                      {amount} ETH
                    </Text>
                  </StyledButtonLight>
                )
              )}
            </ButtonRow>
            {swapStatus === TransactionStatus.Pending ? (
              <ButtonRow>
                <LoadingBarContainer>
                  <LoadingBar color={`rgba(${color[0]}, ${color[1]}, ${color[2]}, 0.7)`} percentage={percentage} />
                </LoadingBarContainer>
              </ButtonRow>
            ) : (
              <ButtonRow>
                {switchingChain ? (
                  <StyledButton disabled={true}>
                    <Trans>Connecting to {getChainInfo(switchingChain)?.label}</Trans>
                  </StyledButton>
                ) : !account ? (
                  <TraceEvent
                    events={[BrowserEvent.onClick]}
                    name={InterfaceEventName.CONNECT_WALLET_BUTTON_CLICKED}
                    properties={{ received_swap_quote: getIsValidSwapQuote(trade, tradeState, swapInputError) }}
                    element={InterfaceElementName.CONNECT_WALLET_BUTTON}
                  >
                    <StyledButtonLight onClick={toggleMenu}>
                      <Trans>Connect Wallet</Trans>
                    </StyledButtonLight>
                  </TraceEvent>
                ) : chainId && chainId !== connectedChainId ? (
                  <StyledButton
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
                  </StyledButton>
                ) : routeNotFound && !routeIsLoading && !routeIsSyncing ? (
                  <GrayCard style={{ textAlign: 'center' }}>
                    <ThemedText.DeprecatedMain mb="4px">
                      <Trans>Insufficient funds</Trans>
                    </ThemedText.DeprecatedMain>
                  </GrayCard>
                ) : (
                  <TraceEvent
                    events={[BrowserEvent.onClick]}
                    name={SharedEventName.ELEMENT_CLICKED}
                    element={InterfaceElementName.SWAP_BUTTON}
                  >
                    <StyledButtonError
                      onClick={handleSwap}
                      id="swap-button"
                      data-testid="swap-button"
                      disabled={!getIsValidSwapQuote(trade, tradeState, swapInputError)}
                      error={false}
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
                    </StyledButtonError>
                  </TraceEvent>
                )}
              </ButtonRow>
            )}
          </ButtonContainer>
        )}
      </AutoColumn>
    </OneClickBuyContainer>
  )
}
