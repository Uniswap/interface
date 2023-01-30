import { Trace } from '@uniswap/analytics'
import { InterfacePageName } from '@uniswap/analytics-events'
import { Token } from '@uniswap/sdk-core'
import { Field } from '@uniswap/widgets'
import { useWeb3React } from '@web3-react/core'
import { NetworkAlert } from 'components/NetworkAlert/NetworkAlert'
import UnsupportedCurrencyFooter from 'components/swap/UnsupportedCurrencyFooter'
import TokenSafetyModal from 'components/TokenSafety/TokenSafetyModal'
import Widget from 'components/Widget'
import { useIsSwapUnsupported } from 'hooks/useIsSwapUnsupported'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { PageWrapper } from '../../components/swap/styleds'
import { SwitchLocaleLink } from '../../components/SwitchLocaleLink'
import { TOKEN_SHORTHANDS } from '../../constants/tokens'
import { useAllTokens, useCurrency } from '../../hooks/Tokens'
import { useDefaultsFromURLSearch } from '../../state/swap/hooks'
import { supportedChainId } from '../../utils/supportedChainId'

export default function Swap() {
  const navigate = useNavigate()
  const { chainId } = useWeb3React()
  const loadedUrlParams = useDefaultsFromURLSearch()
  const [loadedInputCurrency, loadedOutputCurrency] = [
    useCurrency(loadedUrlParams?.[Field.INPUT]?.currencyId),
    useCurrency(loadedUrlParams?.[Field.OUTPUT]?.currencyId),
  ]

  const [dismissTokenWarning, setDismissTokenWarning] = useState<boolean>(false)
  const urlLoadedTokens: Token[] = useMemo(
    () => [loadedInputCurrency, loadedOutputCurrency]?.filter((c): c is Token => c?.isToken ?? false) ?? [],
    [loadedInputCurrency, loadedOutputCurrency]
  )
  // dismiss warning if all URL-loaded tokens are in active lists
  const defaultTokens = useAllTokens()
  const importTokensNotInDefault = useMemo(
    () =>
      urlLoadedTokens &&
      urlLoadedTokens
        .filter((token: Token) => {
          return !(token.address in defaultTokens)
        })
        .filter((token: Token) => {
          // Any token addresses that are loaded from the shorthands map do not need to show the import URL
          const supported = supportedChainId(chainId)
          if (!supported) return true
          return !Object.keys(TOKEN_SHORTHANDS).some((shorthand) => {
            const shorthandTokenAddress = TOKEN_SHORTHANDS[shorthand][supported]
            return shorthandTokenAddress && shorthandTokenAddress === token.address
          })
        }),
    [chainId, defaultTokens, urlLoadedTokens]
  )

  // reset if they close warning without tokens in params
  const handleDismissTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
    navigate('/swap/')
  }, [navigate])
  const handleConfirmTokenWarning = useCallback(() => {
    setDismissTokenWarning(true)
  }, [])

  const swapIsUnsupported = useIsSwapUnsupported(loadedInputCurrency, loadedOutputCurrency)

  // todo: log the swap quote received event from the widget callback
  ////////////////////////
  // const [swapQuoteReceivedDate, setSwapQuoteReceivedDate] = useState<Date | undefined>()
  // useEffect(() => {
  //   const now = new Date()
  //   // If a trade exists, and we need to log the receipt of this new swap quote:
  //   if (newSwapQuoteNeedsLogging && !!trade) {
  //     // Set the current datetime as the time of receipt of latest swap quote.
  //     setSwapQuoteReceivedDate(now)
  //     // Log swap quote.
  //     sendAnalyticsEvent(
  //       SwapEventName.SWAP_QUOTE_RECEIVED,
  //       formatSwapQuoteReceivedEventProperties(trade, trade.gasUseEstimateUSD ?? undefined, fetchingSwapQuoteStartTime)
  //     )
  //     // Latest swap quote has just been logged, so we don't need to log the current trade anymore
  //     // unless user inputs change again and a new trade is in the process of being generated.
  //     setNewSwapQuoteNeedsLogging(false)
  //     // New quote is not being fetched, so set start time of quote fetch to undefined.
  //     setFetchingSwapQuoteStartTime(undefined)
  //   }
  //   // If another swap quote is being loaded based on changed user inputs:
  //   if (routeIsLoading) {
  //     setNewSwapQuoteNeedsLogging(true)
  //     if (!fetchingSwapQuoteStartTime) setFetchingSwapQuoteStartTime(now)
  //   }
  // }, [
  //   newSwapQuoteNeedsLogging,
  //   routeIsSyncing,
  //   routeIsLoading,
  //   fetchingSwapQuoteStartTime,
  //   trade,
  //   setSwapQuoteReceivedDate,
  // ])
  ////////////////////////

  return (
    <Trace page={InterfacePageName.SWAP_PAGE} shouldLogImpression>
      <>
        <TokenSafetyModal
          isOpen={importTokensNotInDefault.length > 0 && !dismissTokenWarning}
          tokenAddress={importTokensNotInDefault[0]?.address}
          secondTokenAddress={importTokensNotInDefault[1]?.address}
          onContinue={handleConfirmTokenWarning}
          onCancel={handleDismissTokenWarning}
          showCancel={true}
        />
        <PageWrapper>
          <Widget token={loadedInputCurrency ?? undefined} width="100%" defaultField={Field.INPUT} />
          <NetworkAlert />
        </PageWrapper>
        <SwitchLocaleLink />
        {!swapIsUnsupported ? null : (
          <UnsupportedCurrencyFooter
            show={swapIsUnsupported}
            currencies={[loadedInputCurrency, loadedOutputCurrency]}
          />
        )}
      </>
    </Trace>
  )
}
