import { GraphQLApi } from '@universe/api'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { AdaptiveWebPopoverContent, Popover, TouchableArea, useIsTouchDevice } from 'ui/src'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId as toCurrencyId } from 'uniswap/src/utils/currencyId'
import { getTokenDetailsURL, gqlToCurrency, unwrapToken } from '~/appGraphql/data/util'
import { PriceChartType } from '~/components/Charts/utils'
import { TokenHoverCardContent } from '~/components/TokenHoverCard/TokenHoverCardContent'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCopyClipboard } from '~/hooks/useCopyClipboard'
import { useTokenPriceChartData } from '~/hooks/useTokenPriceChartData'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

interface TokenHoverCardProps {
  token: GraphQLApi.Token
  children: ReactNode
}

const stopPressEventPropagation = {
  onPressIn: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPressOut: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPress: (e: { stopPropagation: () => void }) => e.stopPropagation(),
}

export function TokenHoverCard({ token, children }: TokenHoverCardProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const shadowProps = useShadowPropsMedium()
  const isTouchDevice = useIsTouchDevice()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isCopied, copyToClipboard] = useCopyClipboard()
  const { defaultChainId } = useEnabledChains()

  const chainId = fromGraphQLChain(token.chain) ?? defaultChainId
  const unwrappedToken = unwrapToken(chainId, token)
  const currency = gqlToCurrency(unwrappedToken)
  const currencyInfo = useCurrencyInfo(currency ? toCurrencyId(currency) : undefined)

  // Read spot price from Apollo cache (populated by TDP data) — no extra network call
  const currencyIdValue = currency ? toCurrencyId(currency) : undefined
  const spotPrice = useTokenSpotPrice(currencyIdValue)

  // NATIVE_CHAIN_ID is a frontend sentinel — the backend expects undefined (not 'NATIVE') for native-token price queries
  const rawAddress = unwrappedToken.address
  const tokenAddress = !rawAddress || rawAddress === NATIVE_CHAIN_ID ? getNativeTokenDBAddress(token.chain) : rawAddress
  const variables = useMemo(
    () => ({
      chain: token.chain,
      address: tokenAddress,
      duration: GraphQLApi.HistoryDuration.Day,
      multichain: false,
    }),
    [token.chain, tokenAddress],
  )

  const { entries, loading: chartLoading } = useTokenPriceChartData({
    variables,
    skip: !isOpen,
    priceChartType: PriceChartType.LINE,
    currentPriceOverride: spotPrice,
  })

  const price = entries.length > 0 ? entries[entries.length - 1].value : undefined

  const priceChange = useMemo(() => {
    const values = entries.map((entry) => entry.value)
    return getPortfolioChartPercentChange(values)
  }, [entries])

  const priceAbsoluteChange = useMemo(() => {
    if (priceChange?.absoluteChangeUSD != null) {
      return priceChange.absoluteChangeUSD
    }
    if (entries.length < 2) {
      return undefined
    }
    return entries[entries.length - 1].value - entries[0].value
  }, [priceChange, entries])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }
    const handleScroll = (): void => setIsOpen(false)
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
    return (): void => window.removeEventListener('scroll', handleScroll, { capture: true })
  }, [isOpen])

  const isDataLivelinessUIEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  const contractAddress =
    unwrappedToken.address && unwrappedToken.address !== NATIVE_CHAIN_ID ? unwrappedToken.address : undefined

  const handleCopy = useCallback((): void => {
    if (!contractAddress) {
      return
    }
    copyToClipboard(contractAddress)
    dispatch(
      pushNotification({
        type: AppNotificationType.Copied,
        copyType: CopyNotificationType.ContractAddress,
      }),
    )
  }, [contractAddress, copyToClipboard, dispatch])

  const handleExpand = useCallback((): void => {
    const url = getTokenDetailsURL({
      address: unwrappedToken.address,
      chain: token.chain,
    })
    navigate(url)
  }, [unwrappedToken.address, token.chain, navigate])

  if (isTouchDevice || !currencyInfo || !isDataLivelinessUIEnabled) {
    return <>{children}</>
  }

  return (
    <Popover hoverable open={isOpen} placement="bottom-start" stayInFrame allowFlip onOpenChange={setIsOpen}>
      <Popover.Trigger>
        <TouchableArea variant="unstyled" activeOpacity={1} {...stopPressEventPropagation}>
          {children}
        </TouchableArea>
      </Popover.Trigger>
      <AdaptiveWebPopoverContent
        isOpen={isOpen}
        placement="bottom-start"
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        p="$spacing16"
        {...shadowProps}
        {...stopPressEventPropagation}
      >
        <TokenHoverCardContent
          currencyInfo={currencyInfo}
          price={price}
          pricePercentChange={priceChange?.percentChange}
          priceAbsoluteChange={priceAbsoluteChange}
          priceData={entries}
          chartLoading={chartLoading}
          isCopied={isCopied}
          onCopy={contractAddress ? handleCopy : undefined}
          onExpand={handleExpand}
        />
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
