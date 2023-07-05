import { MOONPAY_SUPPORTED_CURRENCY_CODES } from 'components/FiatOnrampModal'
import TokenDetails from 'components/Tokens/TokenDetails'
import { TokenDetailsPageSkeleton } from 'components/Tokens/TokenDetails/Skeleton'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { Chain, useTokenPriceQuery, useTokenQuery } from 'graphql/data/__generated__/types-and-hooks'
import { TimePeriod, toHistoryDuration, validateUrlChainParam } from 'graphql/data/util'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useAtom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getMoonpayAllowedCurrencies } from 'state/application/hooks'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

function CHAIN_ADDRESS_TO_CODE(chain: Chain, address: string | undefined) {
  switch (chain) {
    case Chain.Ethereum:
      switch (address) {
        case 'NATIVE':
          return 'eth'
        case '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48':
          return 'usdc'
        case '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599':
          return 'wbtc'
        case '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2':
          return 'weth'
        case '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0':
          return 'polygon'
        default:
          return
      }
    case Chain.Arbitrum:
      switch (address) {
        case 'NATIVE':
          return 'eth_arbitrum'
        case '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9':
          return 'usdc_arbitrum'
        default:
          return
      }
    case Chain.Optimism:
      switch (address) {
        case 'NATIVE':
          return 'eth_optimism'
        case '0x2791bca1f2de4661ed88a30c99a7a9449aa84174':
          return 'usdc_optimism'
        default:
          return
      }
    case Chain.Polygon:
      switch (address) {
        case 'NATIVE':
          return 'eth_polygon'
        case '0x2791bca1f2de4661ed88a30c99a7a9449aa84174':
          return 'usdc_polygon'
        case '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619':
          return 'matic_polygon'
        default:
          return
      }
    default:
      return
  }
}

export const pageTimePeriodAtom = atomWithStorage<TimePeriod>('tokenDetailsTimePeriod', TimePeriod.DAY)

export default function TokenDetailsPage() {
  const { tokenAddress, chainName } = useParams<{
    tokenAddress: string
    chainName?: string
  }>()
  const chain = validateUrlChainParam(chainName)
  const isNative = tokenAddress === NATIVE_CHAIN_ID
  const [timePeriod, setTimePeriod] = useAtom(pageTimePeriodAtom)
  const [detailedTokenAddress, duration] = useMemo(
    // tokenAddress will always be defined in the path for for this page to render, but useParams will always
    // return optional arguments; nullish coalescing operator is present here to appease typechecker
    () => [isNative ? getNativeTokenDBAddress(chain) : tokenAddress ?? '', toHistoryDuration(timePeriod)],
    [chain, isNative, timePeriod, tokenAddress]
  )

  const parsedQs = useParsedQueryString()

  const parsedInputTokenAddress: string | undefined = useMemo(() => {
    return typeof parsedQs.inputCurrency === 'string' ? (parsedQs.inputCurrency as string) : undefined
  }, [parsedQs])

  const { data: tokenQuery } = useTokenQuery({
    variables: {
      address: detailedTokenAddress,
      chain,
    },
    errorPolicy: 'all',
  })

  const { data: tokenPriceQuery } = useTokenPriceQuery({
    variables: {
      address: detailedTokenAddress,
      chain,
      duration,
    },
    errorPolicy: 'all',
  })

  // Saves already-loaded chart data into state to display while tokenPriceQuery is undefined timePeriod input changes
  const [currentPriceQuery, setCurrentPriceQuery] = useState(tokenPriceQuery)
  useEffect(() => {
    if (tokenPriceQuery) setCurrentPriceQuery(tokenPriceQuery)
  }, [setCurrentPriceQuery, tokenPriceQuery])

  useEffect(() => {
    async function getMoonpayCurrencies() {
      let data = await getMoonpayAllowedCurrencies()
      data = data.filter((code) => MOONPAY_SUPPORTED_CURRENCY_CODES.includes(code))
      const code = CHAIN_ADDRESS_TO_CODE(chain, tokenAddress)
    }
    getMoonpayCurrencies()
  }, [chain, tokenAddress])

  if (!tokenQuery) return <TokenDetailsPageSkeleton />

  return (
    <TokenDetails
      urlAddress={tokenAddress}
      chain={chain}
      tokenQuery={tokenQuery}
      tokenPriceQuery={currentPriceQuery}
      onChangeTimePeriod={setTimePeriod}
      inputTokenAddress={parsedInputTokenAddress}
    />
  )
}
