import { Currency, SwapWidget } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { RPC_URLS } from 'constants/networks'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { useIsDarkMode } from 'state/user/hooks'
import { DARK_THEME, LIGHT_THEME } from 'theme/widget'

import { useSyncWidgetInputs } from './inputs'
import { useSyncWidgetSettings } from './settings'
import { useSyncWidgetTransactions } from './transactions'

export const WIDGET_WIDTH = 320

const WIDGET_ROUTER_URL = 'https://api.uniswap.org/v1/'

export interface WidgetProps {
  defaultToken?: Currency
}

export default function Widget({ defaultToken }: WidgetProps) {
  const locale = useActiveLocale()
  const darkMode = useIsDarkMode()
  const theme = useMemo(() => (darkMode ? DARK_THEME : LIGHT_THEME), [darkMode])
  const { provider } = useWeb3React()

  const { inputs, tokenSelector } = useSyncWidgetInputs(defaultToken)
  const { settings } = useSyncWidgetSettings()
  const { transactions } = useSyncWidgetTransactions()

  // todo: jordan - integrate widget tx states via useSyncWidgetTransactions
  // const { loading } = useTokenDetailPageQuery(tokenAddress)
  // const tokenSymbol = useToken(tokenAddress)?.symbol

  // const [maxSlippage, setMaxSlippage] = useState<Percent | null>(null)
  // const addTransaction = useTransactionAdder()
  // const darkMode = useIsDarkMode()
  // const widgetTheme = useMemo(() => (darkMode ? DARK_THEME : LIGHT_THEME), [darkMode])
  // const locale = useActiveLocale()
  // const onTxSubmit = useCallback(
  //   (_txHash: string, data: any) => {
  //     if (!data?.trade || !data.tradeType || !maxSlippage) {
  //       return
  //     }
  //     const { trade, tradeType } = data
  //     const baseTxInfo: BaseSwapTransactionInfo = {
  //       type: TransactionType.SWAP,
  //       tradeType,
  //       inputCurrencyId: currencyId(trade.inputAmount.currency),
  //       outputCurrencyId: currencyId(trade.outputAmount.currency),
  //     }
  //     if (tradeType === TradeType.EXACT_OUTPUT) {
  //       addTransaction(data.txResponse, {
  //         ...baseTxInfo,
  //         maximumInputCurrencyAmountRaw: trade.maximumAmountIn(maxSlippage).quotient.toString(),
  //         outputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
  //         expectedInputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
  //       } as ExactOutputSwapTransactionInfo)
  //     } else {
  //       addTransaction(data.txResponse, {
  //         ...baseTxInfo,
  //         inputCurrencyAmountRaw: trade.inputAmount.quotient.toString(),
  //         expectedOutputCurrencyAmountRaw: trade.outputAmount.quotient.toString(),
  //         minimumOutputCurrencyAmountRaw: trade.minimumAmountOut(maxSlippage).quotient.toString(),
  //       } as ExactInputSwapTransactionInfo)
  //     }
  //   },
  //   [addTransaction, maxSlippage]
  // )

  // let tokenDetail
  // if (!tokenAddress) {
  //   // TODO: handle no address / invalid address cases
  //   tokenDetail = 'invalid token'
  // } else if (loading) {
  //   tokenDetail = <LoadingTokenDetail />
  // } else {
  //   tokenDetail = <TokenDetail address={tokenAddress} />
  // }

  return (
    <>
      <SwapWidget
        hideConnectionUI
        jsonRpcUrlMap={RPC_URLS}
        routerUrl={WIDGET_ROUTER_URL}
        width={WIDGET_WIDTH}
        locale={locale}
        theme={theme}
        // defaultChainId is excluded - it is always inferred from the passed provider
        provider={provider}
        {...inputs}
        {...settings}
        {...transactions}
      />
      {tokenSelector}
    </>
  )
}
