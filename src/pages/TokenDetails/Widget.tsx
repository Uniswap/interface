import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { Percent } from '@uniswap/sdk-core'
import {
  Currency,
  Field,
  Slippage,
  SwapController,
  SwapEventHandlers,
  SwapSettingsController,
  SwapWidget,
  TradeType,
} from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { DEFAULT_DEADLINE_FROM_NOW } from 'constants/misc'
import { RPC_URLS } from 'constants/networks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useCallback, useMemo, useState } from 'react'
import {
  useIsDarkMode,
  useSetUserSlippageTolerance,
  useUserSlippageTolerance,
  useUserTransactionTTL,
} from 'state/user/hooks'
import { DARK_THEME, LIGHT_THEME } from 'theme/widget'

export const WIDGET_WIDTH = 320

const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

export interface WidgetProps {
  defaultToken: Currency
}

export default function Widget({ defaultToken }: WidgetProps) {
  const locale = useActiveLocale()
  const darkMode = useIsDarkMode()
  const theme = useMemo(() => (darkMode ? DARK_THEME : LIGHT_THEME), [darkMode])
  const { provider } = useWeb3React()

  const { value, tokenSelector } = useSyncWidgetValue(defaultToken)
  const { settings } = useSyncWidgetSettings()
  const { transactions } = useSyncWidgetTransactions()

  return (
    <>
      <SwapWidget
        hideConnectionUI
        jsonRpcUrlMap={RPC_URLS}
        routerUrl={WIDGET_ROUTER_URL}
        width={WIDGET_WIDTH}
        locale={locale}
        theme={theme}
        provider={provider}
        {...value}
        {...settings}
        {...transactions}
      />
      {tokenSelector}
    </>
  )
}

// Integrates the Widget's settings, keeping the widget and app settings in sync.
function useSyncWidgetSettings() {
  const [userTtl, setUserTtl] = useUserTransactionTTL()
  const [ttl, setTtl] = useState<number | undefined>(userTtl / 60)
  const onTransactionDeadlineChange = useCallback(
    (ttl: number | undefined) => {
      setTtl(ttl)
      const userTtl = ttl === undefined ? ttl : ttl * 60
      setUserTtl(userTtl ?? DEFAULT_DEADLINE_FROM_NOW)
    },
    [setUserTtl]
  )
  const [userSlippage, setUserSlippage] = [useUserSlippageTolerance(), useSetUserSlippageTolerance()]
  const [slippage, setSlippage] = useState<string | undefined>(
    userSlippage === 'auto' ? undefined : userSlippage.toFixed(2)
  )
  const onSlippageChange = useCallback(
    (slippage: Slippage) => {
      setSlippage(slippage.max)
      if (slippage.auto || !slippage.max) {
        setUserSlippage('auto')
      } else {
        setUserSlippage(new Percent(Math.floor(Number(slippage.max) * 100), 10_000))
      }
    },
    [setUserSlippage]
  )
  const onSettingsReset = useCallback(() => {
    setTtl(undefined)
    setUserTtl(DEFAULT_DEADLINE_FROM_NOW)
    setSlippage(undefined)
    setUserSlippage('auto')
  }, [setUserSlippage, setUserTtl])
  const settings: SwapSettingsController = useMemo(() => {
    const auto = userSlippage === 'auto'
    return { slippage: { auto, max: slippage }, transactionTtl: ttl }
  }, [slippage, ttl, userSlippage])
  const settingsHandlers: SwapEventHandlers = useMemo(
    () => ({ onSettingsReset, onSlippageChange, onTransactionDeadlineChange }),
    [onSettingsReset, onSlippageChange, onTransactionDeadlineChange]
  )

  return { settings: { settings, ...settingsHandlers } }
}

// Integrates the Widget's controlled value, using the app's CurrencySearchModal for token selection.
function useSyncWidgetValue(defaultToken: Currency) {
  const [isExactInput, setIsExactInput] = useState(false)
  const [amount, setAmount] = useState<string>()
  const onAmountChange = useCallback((field: Field, amount: string) => {
    setIsExactInput(field === Field.INPUT)
    setAmount(amount)
  }, [])
  const [tokens, setTokens] = useState<{ [Field.INPUT]?: Currency; [Field.OUTPUT]?: Currency }>({
    [Field.OUTPUT]: defaultToken,
  })
  const onSwitchTokens = useCallback(() => {
    setIsExactInput((isExactInput) => !isExactInput)
    setTokens((tokens) => ({
      [Field.INPUT]: tokens[Field.OUTPUT],
      [Field.OUTPUT]: tokens[Field.INPUT],
    }))
  }, [])
  const [selectingField, setSelectingField] = useState<Field>()
  const otherField = useMemo(() => (selectingField === Field.INPUT ? Field.OUTPUT : Field.INPUT), [selectingField])
  const [selectingToken, otherToken] = useMemo(() => {
    if (selectingField === undefined) return [undefined, undefined]
    return [tokens[selectingField], tokens[otherField]]
  }, [otherField, selectingField, tokens])
  const onTokenSelectorClick = useCallback((field: Field) => {
    setSelectingField(field)
    return false
  }, [])
  const onTokenSelect = useCallback(
    (token: Currency) => {
      if (selectingField === undefined) return
      setIsExactInput(selectingField === Field.INPUT)
      setTokens(() => {
        return {
          [otherField]: token === otherToken ? selectingToken : otherToken,
          [selectingField]: token,
        }
      })
    },
    [otherField, otherToken, selectingField, selectingToken]
  )
  const value: SwapController = useMemo(
    () => ({ type: isExactInput ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT, amount, ...tokens }),
    [amount, isExactInput, tokens]
  )
  const valueHandlers: SwapEventHandlers = useMemo(
    () => ({ onAmountChange, onSwitchTokens, onTokenSelectorClick }),
    [onAmountChange, onSwitchTokens, onTokenSelectorClick]
  )

  const tokenSelector = (
    <CurrencySearchModal
      isOpen={selectingField !== undefined}
      onDismiss={() => setSelectingField(undefined)}
      selectedCurrency={selectingToken}
      otherSelectedCurrency={otherToken}
      onCurrencySelect={onTokenSelect}
    />
  )
  return { value: { value, ...valueHandlers }, tokenSelector }
}

// Integrates the Widget's transactions, showing the widget's transactions in the app.
function useSyncWidgetTransactions() {
  const txHandlers /*: TransactionEventHandlers */ = useMemo(
    () => ({
      onTxSubmit: (hash: string, tx: unknown) => console.log('onTxSubmit'),
      onTxSuccess: (hash: string, receipt: TransactionReceipt) => console.log('onTxSuccess'),
      onTxFail: (hash: string, receipt: TransactionReceipt) => console.log('onTxFail'),
    }),
    []
  )

  return { transactions: { ...txHandlers } }
}
