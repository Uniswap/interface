import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import { AdaptiveWebPopoverContent, Popover, TouchableArea, useIsTouchDevice } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType, CopyNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId as toCurrencyId } from 'uniswap/src/utils/currencyId'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import { getTokenDetailsURL, gqlToCurrency, unwrapToken } from '~/appGraphql/data/util'
import { PriceChartType } from '~/components/Charts/utils'
import { TokenHoverCardContent } from '~/components/TokenHoverCard/TokenHoverCardContent'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useTokenPriceChartData } from '~/hooks/useTokenPriceChartData'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'

const POPOVER_HORIZONTAL_PADDING = 16

type TokenHoverCardProps = {
  children: ReactNode
  placement?: ComponentProps<typeof Popover>['placement']
  offset?: number
  containerWidth?: number
  onNavigate?: () => void
} & ({ token: GraphQLApi.Token; currencyInfo?: never } | { token?: never; currencyInfo: CurrencyInfo })

const stopPressEventPropagation = {
  onPressIn: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPressOut: (e: { stopPropagation: () => void }) => e.stopPropagation(),
  onPress: (e: { stopPropagation: () => void }) => e.stopPropagation(),
}

export function TokenHoverCard({
  token,
  currencyInfo: currencyInfoProp,
  children,
  placement = 'bottom-start',
  offset,
  containerWidth,
  onNavigate,
}: TokenHoverCardProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const shadowProps = useShadowPropsMedium()
  const { fullWidth: windowWidth } = useDeviceDimensions()
  const isTouchDevice = useIsTouchDevice()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [isCopied, copyToClipboard] = useCopyClipboard()
  const { defaultChainId } = useEnabledChains()

  const chainId: UniverseChainId = token
    ? (fromGraphQLChain(token.chain) ?? defaultChainId)
    : currencyInfoProp.currency.chainId
  const gqlChain = token ? token.chain : toGraphQLChain(chainId)

  const unwrappedToken = token ? unwrapToken(chainId, token) : undefined
  const currency = unwrappedToken ? gqlToCurrency(unwrappedToken) : undefined
  const currencyIdFromToken = currency ? toCurrencyId(currency) : undefined
  const currencyIdValue = currencyInfoProp ? currencyInfoProp.currencyId : currencyIdFromToken

  // Read spot price from Apollo cache (populated by TDP data) — no extra network call
  const spotPrice = useTokenSpotPrice(currencyIdValue)

  // Only fetch currencyInfo when using the token prop path; use the prop directly otherwise
  const derivedCurrencyInfo = useCurrencyInfo(currencyInfoProp ? undefined : currencyIdFromToken)
  const currencyInfo = currencyInfoProp ?? derivedCurrencyInfo

  const isMultichainAsset = isMultichainProjectTokens(currencyInfo?.searchMultichainParent?.tokenCurrencyIds)

  // NATIVE_CHAIN_ID is a frontend sentinel — the backend expects undefined (not 'NATIVE') for native-token price queries
  const rawAddress = token
    ? unwrappedToken?.address
    : currencyInfoProp.currency.isToken
      ? currencyInfoProp.currency.address
      : undefined
  const tokenAddress = !rawAddress || rawAddress === NATIVE_CHAIN_ID ? getNativeTokenDBAddress(gqlChain) : rawAddress

  const variables = useMemo(
    () => ({
      chain: gqlChain,
      address: tokenAddress,
      duration: GraphQLApi.HistoryDuration.Day,
      multichain: isMultichainAsset,
    }),
    [gqlChain, tokenAddress, isMultichainAsset],
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

  const contractAddress = rawAddress && rawAddress !== NATIVE_CHAIN_ID ? rawAddress : undefined

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
      address: rawAddress,
      chain: gqlChain,
    })
    onNavigate?.()
    navigate(url)
  }, [rawAddress, gqlChain, navigate, onNavigate])

  if (isTouchDevice || !currencyInfo || !isDataLivelinessUIEnabled) {
    return <>{children}</>
  }

  // Constrain content width so the popover fits with a viewport edge gap equal to the offset (8px on each side).
  // Available space: (windowWidth - containerWidth) / 2, minus the left offset, both inner paddings, and matching right gap.
  const maxContentWidth =
    containerWidth !== undefined
      ? (windowWidth - containerWidth) / 2 - (offset ?? 0) * 2 - POPOVER_HORIZONTAL_PADDING * 2
      : undefined

  return (
    <Popover
      hoverable
      open={isOpen}
      placement={placement}
      offset={offset}
      stayInFrame
      allowFlip
      onOpenChange={setIsOpen}
    >
      <Popover.Trigger>
        <TouchableArea variant="unstyled" activeOpacity={1} {...stopPressEventPropagation}>
          {children}
        </TouchableArea>
      </Popover.Trigger>
      <AdaptiveWebPopoverContent
        isOpen={isOpen}
        placement={placement}
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
          isMultichainAsset={isMultichainAsset}
          price={price}
          pricePercentChange={priceChange?.percentChange}
          priceAbsoluteChange={priceAbsoluteChange}
          priceData={entries}
          chartLoading={chartLoading}
          isCopied={isCopied}
          onCopy={contractAddress ? handleCopy : undefined}
          onExpand={handleExpand}
          maxWidth={maxContentWidth}
        />
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
