import { SharedEventName } from '@uniswap/analytics-events'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ComponentProps, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { AdaptiveWebPopoverContent, Popover, TouchableArea, useIsTouchDevice } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useShadowPropsMedium } from 'ui/src/theme/shadows'
import { MultichainAddressTransitionPanel } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressTransitionPanel'
import { MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_MAX_HEIGHT } from 'uniswap/src/components/MultichainTokenDetails/multichainContextMenuLayout'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { fromGraphQLChain, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isMultichainProjectTokens } from 'uniswap/src/features/dataApi/tokenProjects/utils/isMultichainProjectTokens'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getPortfolioChartPercentChange } from 'uniswap/src/features/portfolio/portfolioChartPercentChange'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import { usePreferProjectMarketData } from 'uniswap/src/features/rwa/usePreferProjectMarketData'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId as toCurrencyId } from 'uniswap/src/utils/currencyId'
import { useCopyClipboard } from 'utilities/src/react/useCopyClipboard'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { getTokenDetailsURL, gqlToCurrency, unwrapToken } from '~/appGraphql/data/util'
import { PriceChartType } from '~/components/Charts/utils'
import { getTokenHoverCardContentWidth, TokenHoverCardContent } from '~/components/TokenHoverCard/TokenHoverCardContent'
import { useTokenHoverCardMultichainCopy } from '~/components/TokenHoverCard/useTokenHoverCardMultichainCopy'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { useCloseOnOutsideScroll } from '~/hooks/useCloseOnOutsideScroll'
import { useTokenPriceChartData } from '~/hooks/useTokenPriceChartData'
import { getNativeTokenDBAddress } from '~/utils/nativeTokens'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

const POPOVER_HORIZONTAL_PADDING = 16

type TokenHoverCardProps = {
  children: ReactNode
  placement?: ComponentProps<typeof Popover>['placement']
  offset?: number
  widthOffset?: number
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
  widthOffset = offset,
  containerWidth,
  onNavigate,
}: TokenHoverCardProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false)
  const popoverContentRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()
  const shadowProps = useShadowPropsMedium()
  const { fullWidth: windowWidth } = useDeviceDimensions()
  const isTouchDevice = useIsTouchDevice()
  const navigate = useNavigate()
  const [isCopied, copyToClipboard] = useCopyClipboard()
  const { defaultChainId } = useEnabledChains()

  const chainId: UniverseChainId = token
    ? (fromGraphQLChain(token.chain) ?? defaultChainId)
    : currencyInfoProp.currency.chainId
  const gqlChain = token ? token.chain : toGraphQLChain(chainId)

  const unwrappedToken = token ? unwrapToken(chainId, token) : undefined
  const currency = unwrappedToken ? gqlToCurrency(unwrappedToken) : undefined
  const currencyIdFromToken = currency ? toCurrencyId(currency) : undefined

  // Only fetch currencyInfo when using the token prop path; use the prop directly otherwise
  const derivedCurrencyInfo = useCurrencyInfo(currencyInfoProp ? undefined : currencyIdFromToken)
  const currencyInfo = currencyInfoProp ?? derivedCurrencyInfo

  const isMultichainAsset = isMultichainProjectTokens(currencyInfo?.searchMultichainParent?.tokenCurrencyIds)

  const rwaCandidates = useMemo(() => {
    const c = currencyInfo?.currency
    return c ? getRWACandidatesFromCurrency(c) : []
  }, [currencyInfo])
  const preferProjectMarketData = usePreferProjectMarketData(rwaCandidates)

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
    preferProjectMarketData,
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

  useCloseOnOutsideScroll({ contentRef: popoverContentRef, isOpen, setIsOpen })

  const isDataLivelinessUIEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)

  const contractAddress = rawAddress && rawAddress !== NATIVE_CHAIN_ID ? rawAddress : undefined

  const trace = useTrace()

  const hasFiredDataLoadedRef = useRef(false)
  useEffect(() => {
    if (!isOpen) {
      hasFiredDataLoadedRef.current = false
      return
    }
    if (chartLoading || hasFiredDataLoadedRef.current || !currencyInfo) {
      return
    }
    hasFiredDataLoadedRef.current = true
    sendAnalyticsEvent(InterfaceEventName.TokenHoverCardDataLoaded, {
      ...trace,
      token_symbol: currencyInfo.currency.symbol,
      chain_id: currencyInfo.currency.chainId,
      token_address: contractAddress ?? undefined,
      is_multichain: isMultichainAsset,
    })
  }, [isOpen, chartLoading, currencyInfo, trace, contractAddress, isMultichainAsset])

  const {
    viewIndex,
    animationType,
    orderedMultichainEntries,
    resetView,
    goBack,
    handleCopy,
    handleCopyMultichainAddress,
  } = useTokenHoverCardMultichainCopy({
    isOpen,
    isMultichainAsset,
    tokenCurrencyIds: currencyInfo?.searchMultichainParent?.tokenCurrencyIds,
    contractAddress,
    currencyInfo,
    chainId,
    copyToClipboard,
    trace,
    setIsOpen,
  })

  const handleExpand = useCallback((): void => {
    const url = getTokenDetailsURL({
      address: rawAddress,
      chain: gqlChain,
      chainQueryParam: isMultichainAsset ? TDP_MULTICHAIN_CHAIN_QUERY_VALUE : undefined,
    })
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      ...trace,
      element: ElementName.TokenHoverCardExpand,
      token_symbol: currencyInfo?.currency.symbol,
      chain_id: chainId,
      token_address: contractAddress ?? undefined,
      is_multichain: isMultichainAsset,
    })
    onNavigate?.()
    navigate(url)
  }, [rawAddress, gqlChain, navigate, onNavigate, trace, currencyInfo, chainId, contractAddress, isMultichainAsset])

  const handleOpenChange = useCallback(
    (open: boolean): void => {
      setIsOpen(open)
      if (!open) {
        resetView()
      }
      if (open && currencyInfo) {
        sendAnalyticsEvent(InterfaceEventName.TokenHoverCardOpened, {
          ...trace,
          token_symbol: currencyInfo.currency.symbol,
          chain_id: currencyInfo.currency.chainId,
          token_address: contractAddress ?? undefined,
          is_multichain: isMultichainAsset,
        })
      }
    },
    [trace, currencyInfo, contractAddress, isMultichainAsset, resetView],
  )

  if (isTouchDevice || !currencyInfo || !isDataLivelinessUIEnabled) {
    return <>{children}</>
  }

  // Constrain content width so the popover fits with a viewport edge gap equal to the width offset (8px on each side).
  // Available space: (windowWidth - containerWidth) / 2, minus the left margin, both inner paddings, and matching right gap.
  const maxContentWidth =
    containerWidth !== undefined
      ? (windowWidth - containerWidth) / 2 - (widthOffset ?? 0) * 2 - POPOVER_HORIZONTAL_PADDING * 2
      : undefined

  return (
    <Popover
      hoverable
      open={isOpen}
      placement={placement}
      offset={offset}
      stayInFrame
      allowFlip
      onOpenChange={handleOpenChange}
    >
      <Popover.Trigger>
        <TouchableArea variant="unstyled" activeOpacity={1} {...stopPressEventPropagation}>
          {children}
        </TouchableArea>
      </Popover.Trigger>
      <AdaptiveWebPopoverContent
        ref={popoverContentRef}
        isOpen={isOpen}
        placement={placement}
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded20"
        borderWidth="$spacing1"
        p="$spacing16"
        overflow="hidden"
        {...shadowProps}
        {...stopPressEventPropagation}
      >
        <MultichainAddressTransitionPanel
          bare
          viewIndex={viewIndex}
          animationType={animationType}
          orderedEntries={orderedMultichainEntries}
          title={t('common.copy.address')}
          width={getTokenHoverCardContentWidth(maxContentWidth)}
          maxHeight={MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_MAX_HEIGHT}
          onCopyAddress={handleCopyMultichainAddress}
          onBack={goBack}
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
        </MultichainAddressTransitionPanel>
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
