import {
  Module,
  Partners,
  SpotProvider,
  SwapStatus,
  WalletInteractions,
  useExplorerLink,
  useSpot,
} from '@orbs-network/spot-react'
import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { PrefetchBalancesWrapper } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import SwapCurrencyInputPanel from 'components/CurrencyInputPanel/SwapCurrencyInputPanel'
import { Input } from 'components/NumericalInput'
import { PageWrapper, SwapSection } from 'components/swap/styled'
import { useAccount } from 'hooks/useAccount'
import { useEthersWeb3Provider } from 'hooks/useEthersProvider'
import { useUSDPrice } from 'hooks/useUSDPrice'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useCurrencyBalance } from 'state/connection/hooks'
import { MultichainContextProvider } from 'state/multichain/MultichainContext'
import { useMultichainContext } from 'state/multichain/useMultichainContext'
import { RouterPreference, TradeState } from 'state/routing/types'
import { useRoutingAPITrade } from 'state/routing/useRoutingAPITrade'
import { SwapAndLimitContextProvider } from 'state/swap/SwapContext'
import { useInitialCurrencyState } from 'state/swap/hooks'
import { CurrencyState } from 'state/swap/types'
import { useSwapAndLimitContext } from 'state/swap/useSwapContext'
import { Anchor, Button, Flex, IconButton, SegmentedControl, SegmentedControlOption, Separator, Text } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
import ERC20_ABI from 'uniswap/src/abis/erc20.json'
import WETH_ABI from 'uniswap/src/abis/weth.json'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useIsSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'
import { CurrencyField } from 'uniswap/src/types/currency'
import { getContract } from 'utilities/src/contracts/getContract'
import { signTypedData } from 'utils/signing'

type LimitRouteTab = '/swap' | '/stock' | '/limit-order'

const DEFAULT_PRICE_PROTECTION = 3
const DEFAULT_MIN_CHUNK_SIZE_USD = 5

function currencyToSpotToken(currency?: Currency) {
  if (!currency) {
    return undefined
  }

  return {
    address: currency.isToken ? currency.address : getNativeAddress(currency.chainId),
    symbol: currency.symbol ?? '',
    decimals: currency.decimals,
    logoUrl: '',
  }
}

function oneTokenAmount(currency?: Currency) {
  if (!currency) {
    return undefined
  }

  return CurrencyAmount.fromRawAmount(currency, `1${'0'.repeat(currency.decimals)}`)
}

function LimitOrderPageContent({ initialTypedValue }: { initialTypedValue?: string }) {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const tabOptions = useMemo<readonly SegmentedControlOption<LimitRouteTab>[]>(
    () => [
      {
        value: '/swap',
        display: <Text variant="buttonLabel3">{t('swap.form.header')}</Text>,
      },
      {
        value: '/stock',
        display: <Text variant="buttonLabel3">{t('swap.stock')}</Text>,
      },
      {
        value: '/limit-order',
        display: <Text variant="buttonLabel3">Limit Order</Text>,
      },
    ],
    [t],
  )

  return (
    <PageWrapper gap="$spacing16">
      <SegmentedControl
        outlined={false}
        size="large"
        options={tabOptions}
        selectedOption="/limit-order"
        onSelectOption={(path) => navigate(path)}
      />
      <LimitOrderWidget initialTypedValue={initialTypedValue} />
    </PageWrapper>
  )
}

function LimitOrderWidget({ initialTypedValue }: { initialTypedValue?: string }) {
  const account = useAccount()
  const accountDrawer = useAccountDrawer()
  const { chainId } = useMultichainContext()
  const provider = useEthersWeb3Provider({ chainId })
  const isSupportedChain = useIsSupportedChainId(chainId)
  const {
    currencyState: { inputCurrency, outputCurrency },
    setCurrencyState,
  } = useSwapAndLimitContext()
  const [typedInputAmount, setTypedInputAmount] = useState(initialTypedValue ?? '')

  const inputBalance = useCurrencyBalance(account.address, inputCurrency)
  const outputBalance = useCurrencyBalance(account.address, outputCurrency)
  const parsedInputAmount = useMemo(
    () => tryParseCurrencyAmount(typedInputAmount, inputCurrency),
    [inputCurrency, typedInputAmount],
  )

  const inputUsd1Token = useUSDPrice(oneTokenAmount(inputCurrency)).data
  const outputUsd1Token = useUSDPrice(oneTokenAmount(outputCurrency)).data

  const { trade, state: tradeState } = useRoutingAPITrade(
    !(parsedInputAmount && outputCurrency),
    TradeType.EXACT_INPUT,
    parsedInputAmount,
    outputCurrency,
    RouterPreference.API,
  )

  const onSelectCurrency = useCallback(
    (type: keyof CurrencyState, newCurrency: Currency) => {
      if ((type === 'inputCurrency' ? outputCurrency : inputCurrency)?.equals(newCurrency)) {
        setCurrencyState({
          inputCurrency: outputCurrency,
          outputCurrency: inputCurrency,
        })
        return
      }

      const [nextInputCurrency, nextOutputCurrency] =
        type === 'inputCurrency' ? [newCurrency, outputCurrency] : [inputCurrency, newCurrency]

      const nextCurrencyState: CurrencyState = {
        inputCurrency: nextInputCurrency,
        outputCurrency: nextOutputCurrency,
      }

      const otherCurrency = type === 'inputCurrency' ? outputCurrency : inputCurrency
      if (newCurrency.chainId !== otherCurrency?.chainId) {
        nextCurrencyState[type === 'inputCurrency' ? 'outputCurrency' : 'inputCurrency'] = undefined
      }

      setCurrencyState(nextCurrencyState)
    },
    [inputCurrency, outputCurrency, setCurrencyState],
  )

  const onSwitchCurrencies = useCallback(() => {
    setCurrencyState({
      inputCurrency: outputCurrency,
      outputCurrency: inputCurrency,
    })
  }, [inputCurrency, outputCurrency, setCurrencyState])

  useEffect(() => {
    if (!outputCurrency && isSupportedChain && chainId && inputCurrency) {
      const stablecoinCurrency = getChainInfo(chainId).spotPriceStablecoinAmount.currency
      onSelectCurrency(
        'outputCurrency',
        inputCurrency.equals(stablecoinCurrency) ? stablecoinCurrency.wrapped : stablecoinCurrency,
      )
    }
  }, [chainId, inputCurrency, isSupportedChain, onSelectCurrency, outputCurrency])

  const marketReferencePrice = useMemo(
    () => ({
      value: trade?.outputAmount?.toExact(),
      isLoading: tradeState === TradeState.LOADING,
      noLiquidity: Boolean(typedInputAmount) && tradeState !== TradeState.LOADING && !trade?.outputAmount,
    }),
    [trade?.outputAmount, tradeState, typedInputAmount],
  )

  const walletInteractions = useMemo<WalletInteractions>(
    () => ({
      wrapNativeToken: async (amount) => {
        if (!provider || !chainId || !account.address) {
          throw new Error('Wallet not connected')
        }

        const wethAddress = WRAPPED_NATIVE_CURRENCY[chainId]?.address
        if (!wethAddress) {
          throw new Error('Wrapped native token is not available on this network')
        }

        const wethContract = getContract(wethAddress, WETH_ABI, provider, account.address)
        const tx = await wethContract.deposit({ value: amount })
        await tx.wait()
        return tx.hash as `0x${string}`
      },
      approveToken: async ({ tokenAddress, amount, spenderAddress }) => {
        if (!provider || !account.address) {
          throw new Error('Wallet not connected')
        }

        const tokenContract = getContract(tokenAddress, ERC20_ABI, provider, account.address)
        const tx = await tokenContract.approve(spenderAddress, amount)
        await tx.wait()
        return tx.hash as `0x${string}`
      },
      cancelOrder: async ({ contractAddress, args, abi }) => {
        if (!provider || !account.address) {
          throw new Error('Wallet not connected')
        }

        const contract = getContract(contractAddress, abi, provider, account.address)
        const tx = await contract.cancel(...(args as unknown[]))
        await tx.wait()
        return tx.hash as `0x${string}`
      },
      signOrder: async ({ domain, types, message }) => {
        if (!provider || !account.address) {
          throw new Error('Wallet not connected')
        }

        const signer = provider.getSigner(account.address)
        return (await signTypedData(
          signer,
          domain as Parameters<typeof signTypedData>[1],
          types as Parameters<typeof signTypedData>[2],
          message,
        )) as `0x${string}`
      },
      getAllowance: async ({ tokenAddress, spenderAddress }) => {
        if (!provider || !account.address) {
          throw new Error('Wallet not connected')
        }

        const tokenContract = getContract(tokenAddress, ERC20_ABI, provider)
        const allowance = await tokenContract.allowance(account.address, spenderAddress)
        return allowance.toString()
      },
    }),
    [account.address, chainId, provider],
  )

  const providerProps = useMemo(
    () => ({
      account: account.address,
      callbacks: {},
      chainId,
      dstBalance: outputBalance?.quotient.toString(),
      dstToken: currencyToSpotToken(outputCurrency),
      dstUsd1Token: outputUsd1Token?.toString(),
      fees: 0,
      marketReferencePrice,
      minChunkSizeUsd: DEFAULT_MIN_CHUNK_SIZE_USD,
      module: Module.LIMIT,
      partner: Partners.Agent,
      priceProtection: DEFAULT_PRICE_PROTECTION,
      srcBalance: inputBalance?.quotient.toString(),
      srcToken: currencyToSpotToken(inputCurrency),
      srcUsd1Token: inputUsd1Token?.toString(),
      typedInputAmount,
      walletInteractions,
    }),
    [
      account.address,
      chainId,
      inputBalance?.quotient,
      inputCurrency,
      inputUsd1Token,
      marketReferencePrice,
      outputBalance?.quotient,
      outputCurrency,
      outputUsd1Token,
      typedInputAmount,
      walletInteractions,
    ],
  )

  return (
    <SpotProvider {...providerProps}>
      <LimitOrderSpotContent
        connectWallet={accountDrawer.open}
        inputCurrency={inputCurrency}
        isNetworkSupported={Boolean(chainId && isSupportedChain)}
        onSelectCurrency={onSelectCurrency}
        onSwitchCurrencies={onSwitchCurrencies}
        outputCurrency={outputCurrency}
        parsedInputAmount={parsedInputAmount}
        typedInputAmount={typedInputAmount}
        setTypedInputAmount={setTypedInputAmount}
      />
    </SpotProvider>
  )
}

function LimitOrderSpotContent({
  connectWallet,
  inputCurrency,
  isNetworkSupported,
  onSelectCurrency,
  onSwitchCurrencies,
  outputCurrency,
  parsedInputAmount,
  typedInputAmount,
  setTypedInputAmount,
}: {
  connectWallet: () => void
  inputCurrency?: Currency
  isNetworkSupported: boolean
  onSelectCurrency: (type: keyof CurrencyState, newCurrency: Currency) => void
  onSwitchCurrencies: () => void
  outputCurrency?: Currency
  parsedInputAmount?: CurrencyAmount<Currency>
  typedInputAmount: string
  setTypedInputAmount: (value: string) => void
}) {
  const { t } = useTranslation()
  const spot = useSpot()
  const inputFiatValue = useUSDPrice(parsedInputAmount)
  const outputFiatValue = useMemo(
    () => ({
      data: spot.dstTokenPanel.usd ? Number(spot.dstTokenPanel.usd) : undefined,
      isLoading: spot.dstTokenPanel.isLoading ?? false,
    }),
    [spot.dstTokenPanel.isLoading, spot.dstTokenPanel.usd],
  )

  return (
    <Flex gap="$spacing12">
      <SwapSection height="unset" gap="$spacing8">
        <Text variant="subheading2">{t('swap.limit')}</Text>
        <Text variant="body3" color="$neutral2">
          Independent limit order widget powered by Orbs Spot.
        </Text>
      </SwapSection>
      <SwapSection height="unset">
        <SwapCurrencyInputPanel
          label={t('common.sell.label')}
          value={typedInputAmount}
          showMaxButton={false}
          currency={inputCurrency ?? null}
          currencyField={CurrencyField.INPUT}
          onUserInput={setTypedInputAmount}
          onCurrencySelect={(currency) => onSelectCurrency('inputCurrency', currency)}
          otherCurrency={outputCurrency ?? null}
          id="limit-order-input"
          fiatValue={inputFiatValue}
        />
      </SwapSection>
      <Flex alignItems="center">
        <IconButton
          size="small"
          emphasis="secondary"
          fill={false}
          onPress={onSwitchCurrencies}
          aria-label={t('common.swap')}
          icon={<ArrowUpDown />}
        />
      </Flex>
      <SwapSection height="unset">
        <OrbsLimitPriceSection />
      </SwapSection>
      <SwapSection height="unset">
        <SwapCurrencyInputPanel
          label={t('common.buy.label')}
          value={spot.dstTokenPanel.value}
          showMaxButton={false}
          currency={outputCurrency ?? null}
          currencyField={CurrencyField.OUTPUT}
          onUserInput={() => undefined}
          onCurrencySelect={(currency) => onSelectCurrency('outputCurrency', currency)}
          otherCurrency={inputCurrency ?? null}
          id="limit-order-output"
          fiatValue={outputFiatValue}
          numericalInputSettings={{ disabled: true }}
        />
      </SwapSection>
      <OrbsLimitOrderActions connectWallet={connectWallet} isNetworkSupported={isNetworkSupported} />
    </Flex>
  )
}

function OrbsLimitPriceSection() {
  const { t } = useTranslation()
  const spot = useSpot()

  return (
    <Flex gap="$spacing12">
      <Flex row justifyContent="space-between" alignItems="center">
        <Text variant="subheading2">Limit Price</Text>
        <Button size="small" emphasis="tertiary" fill={false} onPress={spot.limitPricePanel.onReset}>
          {t('common.button.reset')}
        </Button>
      </Flex>
      <Flex row alignItems="center" gap="$spacing12">
        <Input value={spot.limitPricePanel.priceUI} onUserInput={spot.limitPricePanel.onInputChange} />
      </Flex>
      <Text variant="body3" color="$neutral2">
        {spot.pricePanel.fromToken?.symbol} / {spot.pricePanel.toToken?.symbol}
      </Text>
      <Text variant="body4" color="$neutral2">
        Market quote: {spot.dstTokenPanel.value || '--'} {spot.pricePanel.toToken?.symbol}
      </Text>
    </Flex>
  )
}

function OrbsLimitOrderActions({
  connectWallet,
  isNetworkSupported,
}: {
  connectWallet: () => void
  isNetworkSupported: boolean
}) {
  const { t } = useTranslation()
  const account = useAccount()
  const spot = useSpot()
  const approveLink = useExplorerLink(spot.orderExecutionPanel.approveTxHash)
  const wrapLink = useExplorerLink(spot.orderExecutionPanel.wrapTxHash)

  const buttonText = !account.isConnected
    ? t('common.connectWallet.button')
    : !isNetworkSupported
      ? 'Unsupported network'
      : 'Create Limit Order'

  return (
    <Flex gap="$spacing12">
      <Button
        variant="branded"
        size="large"
        fill={false}
        width="100%"
        isDisabled={account.isConnected && (!isNetworkSupported || spot.submitOrderButton.disabled)}
        onPress={!account.isConnected ? connectWallet : spot.orderExecutionPanel.onSubmit}
      >
        {buttonText}
      </Button>
      <OrbsExecutionStatus />
      {(approveLink || wrapLink) && (
        <Flex gap="$spacing8">
          <Separator />
          {approveLink && (
            <Anchor href={approveLink} target="_blank" textDecorationLine="none">
              <Text variant="body4" color="$accent1">
                Approval Transaction
              </Text>
            </Anchor>
          )}
          {wrapLink && (
            <Anchor href={wrapLink} target="_blank" textDecorationLine="none">
              <Text variant="body4" color="$accent1">
                Wrap Transaction
              </Text>
            </Anchor>
          )}
        </Flex>
      )}
    </Flex>
  )
}

function OrbsExecutionStatus() {
  const spot = useSpot()

  if (!spot.orderExecutionPanel.status) {
    return null
  }

  const statusText =
    spot.orderExecutionPanel.status === SwapStatus.SUCCESS
      ? 'Order created successfully.'
      : spot.orderExecutionPanel.status === SwapStatus.FAILED
        ? spot.orderExecutionPanel.parsedError?.message || 'Failed to create order.'
        : `Submitting order${spot.orderExecutionPanel.step ? `: ${spot.orderExecutionPanel.step}` : ''}`

  return (
    <SwapSection height="unset">
      <Flex gap="$spacing8">
        <Text variant="subheading2">Order Status</Text>
        <Text variant="body3">{statusText}</Text>
      </Flex>
    </SwapSection>
  )
}

export default function LimitOrderPage() {
  const { initialInputCurrency, initialOutputCurrency, initialChainId, initialTypedValue } = useInitialCurrencyState()

  return (
    <MultichainContextProvider initialChainId={initialChainId}>
      <SwapAndLimitContextProvider
        initialInputCurrency={initialInputCurrency}
        initialOutputCurrency={initialOutputCurrency}
      >
        <PrefetchBalancesWrapper>
          <LimitOrderPageContent initialTypedValue={initialTypedValue} />
        </PrefetchBalancesWrapper>
      </SwapAndLimitContextProvider>
    </MultichainContextProvider>
  )
}
