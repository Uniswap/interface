import { BigNumber } from '@ethersproject/bignumber'
import { formatEther, parseEther } from '@ethersproject/units'
import { t, Trans } from '@lingui/macro'
import { sendAnalyticsEvent, TraceEvent } from '@uniswap/analytics'
import { BrowserEvent, InterfaceElementName, NFTEventName } from '@uniswap/analytics-events'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useToggleAccountDrawer } from 'components/AccountDrawer'
import Column from 'components/Column'
import Loader from 'components/Icons/LoadingSpinner'
import CurrencyLogo from 'components/Logo/CurrencyLogo'
import Row from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { LoadingBubble } from 'components/Tokens/loading'
import { MouseoverTooltip } from 'components/Tooltip'
import { isSupportedChain, SupportedChainId } from 'constants/chains'
import { useNftUniversalRouterAddress } from 'graphql/data/nft/NftUniversalRouterAddress'
import { useCurrency } from 'hooks/Tokens'
import { AllowanceState } from 'hooks/usePermit2Allowance'
import { useStablecoinValue } from 'hooks/useStablecoinPrice'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useBag } from 'nft/hooks/useBag'
import { useBagTotalEthPrice } from 'nft/hooks/useBagTotalEthPrice'
import useDerivedPayWithAnyTokenSwapInfo from 'nft/hooks/useDerivedPayWithAnyTokenSwapInfo'
import { useFetchAssets } from 'nft/hooks/useFetchAssets'
import usePayWithAnyTokenSwap from 'nft/hooks/usePayWithAnyTokenSwap'
import usePermit2Approval from 'nft/hooks/usePermit2Approval'
import { PriceImpact, usePriceImpact } from 'nft/hooks/usePriceImpact'
import { useSubscribeTransactionState } from 'nft/hooks/useSubscribeTransactionState'
import { useTokenInput } from 'nft/hooks/useTokenInput'
import { useWalletBalance } from 'nft/hooks/useWalletBalance'
import { BagStatus } from 'nft/types'
import { ethNumberStandardFormatter, formatWeiToDecimal } from 'nft/utils'
import { PropsWithChildren, useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ChevronDown } from 'react-feather'
import { InterfaceTrade, TradeState } from 'state/routing/types'
import styled, { useTheme } from 'styled-components/macro'
import { ThemedText } from 'theme'
import { switchChain } from 'utils/switchChain'
import { shallow } from 'zustand/shallow'

import { BuyButtonStateData, BuyButtonStates, getBuyButtonStateData } from './ButtonStates'

const FooterContainer = styled.div`
  padding: 0px 12px;
`

const Footer = styled.div`
  border-top: 1px solid ${({ theme }) => theme.backgroundOutline};
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  flex-direction: column;
  margin: 0px 16px 8px;
  padding: 12px 0px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
`

const FooterHeader = styled(Column)`
  padding-top: 8px;
  padding-bottom: 16px;
`

const CurrencyRow = styled(Row)`
  justify-content: space-between;
  align-items: start;
  gap: 8px;
`

const TotalColumn = styled(Column)`
  text-align: end;
  overflow-x: hidden;
`

const WarningIcon = styled(AlertTriangle)`
  width: 14px;
  margin-right: 4px;
  color: inherit;
`
const WarningText = styled(ThemedText.BodyPrimary)<{ $color: string }>`
  align-items: center;
  color: ${({ $color }) => $color};
  display: flex;
  justify-content: center;
  margin-bottom: 10px !important;
  text-align: center;
`

const HelperText = styled(ThemedText.Caption)<{ $color: string }>`
  color: ${({ $color }) => $color};
  display: flex;
  justify-content: center;
  text-align: center;
  margin-bottom: 10px !important;
`

const CurrencyInput = styled(Row)`
  gap: 8px;
  cursor: pointer;
`

const ActionButton = styled.button<{ $backgroundColor: string; $color: string }>`
  display: flex;
  background: ${({ $backgroundColor }) => $backgroundColor};
  color: ${({ $color }) => $color};
  font-weight: 600;
  line-height: 24px;
  font-size: 16px;
  gap: 16px;
  justify-content: center;
  border: none;
  border-radius: 12px;
  padding: 12px 0px;
  cursor: pointer;
  align-items: center;

  &:disabled {
    opacity: 0.6;
    cursor: auto;
  }
`
const FiatLoadingBubble = styled(LoadingBubble)`
  border-radius: 4px;
  width: 4rem;
  height: 20px;
  align-self: end;
`
const PriceImpactContainer = styled(Row)`
  align-items: center;
  gap: 8px;
  width: 100%;
  justify-content: flex-end;
`

const PriceImpactRow = styled(Row)`
  align-items: center;
  gap: 8px;
`

const ValueText = styled(ThemedText.BodyPrimary)`
  line-height: 20px;
  font-weight: 500;
  overflow-x: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  scrollbar-width: none;

  ::-webkit-scrollbar {
    display: none;
  }
`

interface HelperTextProps {
  color: string
}

const Warning = ({ color, children }: PropsWithChildren<HelperTextProps>) => {
  if (!children) {
    return null
  }
  return (
    <WarningText data-testid="nft-buy-button-warning" fontSize="14px" lineHeight="20px" $color={color}>
      <WarningIcon />
      {children}
    </WarningText>
  )
}

const Helper = ({ children, color }: PropsWithChildren<HelperTextProps>) => {
  if (!children) {
    return null
  }
  return (
    <HelperText lineHeight="16px" $color={color}>
      {children}
    </HelperText>
  )
}

const InputCurrencyValue = ({
  usingPayWithAnyToken,
  totalEthPrice,
  activeCurrency,
  tradeState,
  trade,
}: {
  usingPayWithAnyToken: boolean
  totalEthPrice: BigNumber
  activeCurrency?: Currency | null
  tradeState: TradeState
  trade?: InterfaceTrade
}) => {
  if (!usingPayWithAnyToken) {
    return (
      <ThemedText.BodyPrimary lineHeight="20px" fontWeight="500">
        {formatWeiToDecimal(totalEthPrice.toString())}
        &nbsp;{activeCurrency?.symbol ?? 'ETH'}
      </ThemedText.BodyPrimary>
    )
  }

  if (tradeState === TradeState.LOADING && !trade) {
    return (
      <ThemedText.BodyPrimary color="textTertiary" lineHeight="20px" fontWeight="500">
        <Trans>Fetching price...</Trans>
      </ThemedText.BodyPrimary>
    )
  }

  return (
    <ValueText color={tradeState === TradeState.LOADING ? 'textTertiary' : 'textPrimary'}>
      {ethNumberStandardFormatter(trade?.inputAmount.toExact())}
    </ValueText>
  )
}

const FiatValue = ({
  usdcValue,
  priceImpact,
  tradeState,
  usingPayWithAnyToken,
}: {
  usdcValue: CurrencyAmount<Token> | null
  priceImpact?: PriceImpact
  tradeState: TradeState
  usingPayWithAnyToken: boolean
}) => {
  if (!usdcValue) {
    if (usingPayWithAnyToken && (tradeState === TradeState.INVALID || tradeState === TradeState.NO_ROUTE_FOUND)) {
      return null
    }

    return <FiatLoadingBubble />
  }

  return (
    <PriceImpactContainer>
      {priceImpact && (
        <>
          <MouseoverTooltip text={t`The estimated difference between the USD values of input and output amounts.`}>
            <PriceImpactRow>
              <AlertTriangle color={priceImpact.priceImpactSeverity.color} size="16px" />
              <ThemedText.BodySmall style={{ color: priceImpact.priceImpactSeverity.color }} lineHeight="20px">
                (<Trans>{priceImpact.displayPercentage()}</Trans>)
              </ThemedText.BodySmall>
            </PriceImpactRow>
          </MouseoverTooltip>
        </>
      )}
      <ThemedText.BodySmall color="textTertiary" lineHeight="20px">
        {`${ethNumberStandardFormatter(usdcValue?.toExact(), true)}`}
      </ThemedText.BodySmall>
    </PriceImpactContainer>
  )
}

const PENDING_BAG_STATUSES = [
  BagStatus.FETCHING_ROUTE,
  BagStatus.CONFIRMING_IN_WALLET,
  BagStatus.FETCHING_FINAL_ROUTE,
  BagStatus.PROCESSING_TRANSACTION,
]

interface BagFooterProps {
  setModalIsOpen: (open: boolean) => void
  eventProperties: Record<string, unknown>
}

export const BagFooter = ({ setModalIsOpen, eventProperties }: BagFooterProps) => {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const theme = useTheme()
  const { account, chainId, connector } = useWeb3React()
  const connected = Boolean(account && chainId)
  const totalEthPrice = useBagTotalEthPrice()
  const { inputCurrency } = useTokenInput(({ inputCurrency }) => ({ inputCurrency }), shallow)
  const setInputCurrency = useTokenInput((state) => state.setInputCurrency)
  const defaultCurrency = useCurrency('ETH')
  const inputCurrencyBalance = useTokenBalance(
    account ?? undefined,
    !!inputCurrency && inputCurrency.isToken ? inputCurrency : undefined
  )
  const {
    isLocked: bagIsLocked,
    bagStatus,
    setBagExpanded,
    setBagStatus,
  } = useBag(
    ({ isLocked, bagStatus, setBagExpanded, setBagStatus }) => ({
      isLocked,
      bagStatus,
      setBagExpanded,
      setBagStatus,
    }),
    shallow
  )
  const [tokenSelectorOpen, setTokenSelectorOpen] = useState(false)
  const isPending = PENDING_BAG_STATUSES.includes(bagStatus)
  const activeCurrency = inputCurrency ?? defaultCurrency
  const usingPayWithAnyToken = !!inputCurrency && chainId === SupportedChainId.MAINNET
  const { universalRouterAddress, universalRouterAddressIsLoading } = useNftUniversalRouterAddress()

  useSubscribeTransactionState(setModalIsOpen)
  const fetchAssets = useFetchAssets()

  const parsedOutputAmount = useMemo(() => {
    return tryParseCurrencyAmount(formatEther(totalEthPrice.toString()), defaultCurrency ?? undefined)
  }, [defaultCurrency, totalEthPrice])
  const {
    state: tradeState,
    trade,
    maximumAmountIn,
    allowedSlippage,
  } = useDerivedPayWithAnyTokenSwapInfo(usingPayWithAnyToken ? inputCurrency : undefined, parsedOutputAmount)
  const { allowance, isAllowancePending, isApprovalLoading, updateAllowance } = usePermit2Approval(
    trade?.inputAmount.currency.isToken ? (trade?.inputAmount as CurrencyAmount<Token>) : undefined,
    maximumAmountIn,
    universalRouterAddress
  )
  const loadingAllowance = allowance.state === AllowanceState.LOADING || universalRouterAddressIsLoading
  usePayWithAnyTokenSwap(trade, allowance, allowedSlippage)
  const priceImpact = usePriceImpact(trade)

  const fiatValueTradeInput = useStablecoinValue(trade?.inputAmount)
  const fiatValueTradeOutput = useStablecoinValue(parsedOutputAmount)
  const usdcValue = usingPayWithAnyToken ? fiatValueTradeInput : fiatValueTradeOutput

  const { balance: balanceInEth } = useWalletBalance()
  const sufficientBalance = useMemo(() => {
    if (!connected || chainId !== SupportedChainId.MAINNET) {
      return undefined
    }

    if (inputCurrency) {
      const inputAmount = trade?.inputAmount

      if (!inputCurrencyBalance || !inputAmount) {
        return undefined
      }

      return !inputCurrencyBalance.lessThan(inputAmount)
    }

    return parseEther(balanceInEth).gte(totalEthPrice)
  }, [connected, chainId, inputCurrency, balanceInEth, totalEthPrice, trade?.inputAmount, inputCurrencyBalance])

  useEffect(() => {
    setBagStatus(BagStatus.ADDING_TO_BAG)
  }, [inputCurrency, setBagStatus])

  const {
    buttonText,
    buttonTextColor,
    disabled,
    warningText,
    warningTextColor,
    helperText,
    helperTextColor,
    handleClick,
    buttonColor,
  } = useMemo((): BuyButtonStateData => {
    if (connected && chainId !== SupportedChainId.MAINNET) {
      const handleClick = () => switchChain(connector, SupportedChainId.MAINNET)
      return getBuyButtonStateData(BuyButtonStates.NOT_SUPPORTED_CHAIN, theme, handleClick)
    }

    if (sufficientBalance === false) {
      return getBuyButtonStateData(BuyButtonStates.INSUFFICIENT_BALANCE, theme)
    }

    if (bagStatus === BagStatus.WARNING) {
      return getBuyButtonStateData(BuyButtonStates.ERROR, theme)
    }

    if (!connected) {
      const handleClick = () => {
        toggleWalletDrawer()
        setBagExpanded({ bagExpanded: false })
      }
      return getBuyButtonStateData(BuyButtonStates.WALLET_NOT_CONNECTED, theme, handleClick)
    }

    if (bagStatus === BagStatus.FETCHING_FINAL_ROUTE || bagStatus === BagStatus.CONFIRMING_IN_WALLET) {
      return getBuyButtonStateData(BuyButtonStates.IN_WALLET_CONFIRMATION, theme)
    }

    if (bagStatus === BagStatus.PROCESSING_TRANSACTION) {
      return getBuyButtonStateData(BuyButtonStates.PROCESSING_TRANSACTION, theme)
    }

    if (usingPayWithAnyToken && tradeState !== TradeState.VALID) {
      if (tradeState === TradeState.INVALID) {
        return getBuyButtonStateData(BuyButtonStates.INVALID_TOKEN_ROUTE, theme)
      }

      if (tradeState === TradeState.NO_ROUTE_FOUND) {
        return getBuyButtonStateData(BuyButtonStates.NO_TOKEN_ROUTE_FOUND, theme)
      }

      return getBuyButtonStateData(BuyButtonStates.FETCHING_TOKEN_ROUTE, theme)
    }

    if (allowance.state === AllowanceState.REQUIRED || loadingAllowance) {
      const handleClick = () => updateAllowance()

      if (loadingAllowance) {
        return getBuyButtonStateData(BuyButtonStates.LOADING_ALLOWANCE, theme, handleClick)
      } else if (isAllowancePending) {
        return getBuyButtonStateData(BuyButtonStates.IN_WALLET_ALLOWANCE_APPROVAL, theme, handleClick)
      } else if (isApprovalLoading) {
        return getBuyButtonStateData(BuyButtonStates.PROCESSING_APPROVAL, theme, handleClick)
      }

      return getBuyButtonStateData(BuyButtonStates.REQUIRE_APPROVAL, theme, handleClick)
    }

    if (bagStatus === BagStatus.CONFIRM_QUOTE) {
      return getBuyButtonStateData(BuyButtonStates.CONFIRM_UPDATED_PRICE, theme, fetchAssets)
    }

    if (priceImpact && priceImpact.priceImpactSeverity.type === 'error') {
      return getBuyButtonStateData(
        BuyButtonStates.PRICE_IMPACT_HIGH,
        theme,
        fetchAssets,
        usingPayWithAnyToken,
        priceImpact
      )
    }

    return getBuyButtonStateData(BuyButtonStates.PAY, theme, fetchAssets, usingPayWithAnyToken)
  }, [
    connected,
    chainId,
    sufficientBalance,
    bagStatus,
    usingPayWithAnyToken,
    tradeState,
    allowance.state,
    loadingAllowance,
    priceImpact,
    theme,
    fetchAssets,
    connector,
    toggleWalletDrawer,
    setBagExpanded,
    isAllowancePending,
    isApprovalLoading,
    updateAllowance,
  ])

  const traceEventProperties = {
    usd_value: usdcValue?.toExact(),
    using_erc20: !!inputCurrency,
    ...eventProperties,
  }

  return (
    <FooterContainer>
      <Footer>
        <FooterHeader gap="xs">
          <CurrencyRow>
            <Column gap="xs">
              {isSupportedChain(chainId) && (
                <>
                  <ThemedText.SubHeaderSmall>
                    <Trans>Pay with</Trans>
                  </ThemedText.SubHeaderSmall>
                  <CurrencyInput
                    onClick={() => {
                      if (!bagIsLocked) {
                        setTokenSelectorOpen(true)
                        sendAnalyticsEvent(NFTEventName.NFT_BUY_TOKEN_SELECTOR_CLICKED)
                      }
                    }}
                  >
                    <CurrencyLogo currency={activeCurrency} size="24px" />
                    <ThemedText.HeadlineSmall fontWeight={500} lineHeight="24px">
                      {activeCurrency?.symbol}
                    </ThemedText.HeadlineSmall>
                    <ChevronDown size={20} color={theme.textSecondary} />
                  </CurrencyInput>
                </>
              )}
            </Column>
            <TotalColumn gap="xs">
              <ThemedText.SubHeaderSmall marginBottom="4px">
                <Trans>Total</Trans>
              </ThemedText.SubHeaderSmall>
              <InputCurrencyValue
                usingPayWithAnyToken={usingPayWithAnyToken}
                totalEthPrice={totalEthPrice}
                activeCurrency={activeCurrency}
                tradeState={tradeState}
                trade={trade}
              />
            </TotalColumn>
          </CurrencyRow>
          <FiatValue
            usdcValue={usdcValue}
            priceImpact={priceImpact}
            tradeState={tradeState}
            usingPayWithAnyToken={usingPayWithAnyToken}
          />
        </FooterHeader>
        <TraceEvent
          events={[BrowserEvent.onClick]}
          name={NFTEventName.NFT_BUY_BAG_PAY}
          element={InterfaceElementName.NFT_BUY_BAG_PAY_BUTTON}
          properties={{ ...traceEventProperties }}
          shouldLogImpression={connected && !disabled}
        >
          <Warning color={warningTextColor}>{warningText}</Warning>
          <Helper color={helperTextColor}>{helperText}</Helper>
          <ActionButton
            data-testid="nft-buy-button"
            onClick={handleClick}
            disabled={disabled || isPending}
            $backgroundColor={buttonColor}
            $color={buttonTextColor}
          >
            {isPending && <Loader size="20px" stroke="white" />}
            {buttonText}
          </ActionButton>
        </TraceEvent>
      </Footer>
      <CurrencySearchModal
        isOpen={tokenSelectorOpen}
        onDismiss={() => setTokenSelectorOpen(false)}
        onCurrencySelect={(currency: Currency) => {
          setInputCurrency(currency.isNative ? undefined : currency)
          if (currency.isToken) {
            sendAnalyticsEvent(NFTEventName.NFT_BUY_TOKEN_SELECTED, {
              token_address: currency.address,
              token_symbol: currency.symbol,
            })
          }
        }}
        selectedCurrency={activeCurrency ?? undefined}
        onlyShowCurrenciesWithBalance={true}
      />
    </FooterContainer>
  )
}
