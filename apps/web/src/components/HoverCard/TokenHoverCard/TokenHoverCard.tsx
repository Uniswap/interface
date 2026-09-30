import { SharedEventName } from '@uniswap/analytics-events'
import { useCallback } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { MultichainAddressTransitionPanel } from 'uniswap/src/components/MultichainTokenDetails/MultichainAddressTransitionPanel'
import { MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_MAX_HEIGHT } from 'uniswap/src/components/MultichainTokenDetails/multichainContextMenuLayout'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName, InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import {
  HoverCard,
  type HoverCardPlacement,
  useHoverCardMaxContentWidth,
  useHoverCardState,
} from '~/components/HoverCard/HoverCard'
import { getHoverCardContentWidth } from '~/components/HoverCard/HoverCardContent'
import { deriveTokenIdentity } from '~/components/HoverCard/TokenHoverCard/deriveTokenIdentity'
import {
  TokenHoverCardContent,
  TokenHoverCardPlaceholder,
} from '~/components/HoverCard/TokenHoverCard/TokenHoverCardContent'
import type { TokenHoverCardToken } from '~/components/HoverCard/TokenHoverCard/types'
import { useTokenHoverCardData } from '~/components/HoverCard/TokenHoverCard/useTokenHoverCardData'
import { useTokenHoverCardMultichainCopy } from '~/components/HoverCard/TokenHoverCard/useTokenHoverCardMultichainCopy'
import { useFireOncePerOpen } from '~/components/HoverCard/useFireOncePerOpen'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'
import { getTokenDetailsURL } from '~/data/util'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

export type { TokenHoverCardToken } from '~/components/HoverCard/TokenHoverCard/types'

type TokenHoverCardProps = {
  children: ReactNode
  placement?: HoverCardPlacement
  offset?: number
  widthOffset?: number
  containerWidth?: number
  onNavigate?: () => void
  /** The child already shrinks on press; opts the trigger's own shrink out so the two don't compound. */
  childOwnsPressFeedback?: boolean
} & ({ token: TokenHoverCardToken; currencyInfo?: never } | { token?: never; currencyInfo: CurrencyInfo })

export function TokenHoverCard({
  token,
  currencyInfo: currencyInfoProp,
  children,
  placement = 'bottom-start',
  offset,
  widthOffset = offset,
  containerWidth,
  onNavigate,
  childOwnsPressFeedback,
}: TokenHoverCardProps): JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()

  const { chainId, gqlChain, currencyIdFromToken, rawAddress } = deriveTokenIdentity({
    token,
    currencyInfoProp,
    defaultChainId,
  })

  const { isOpen, hasOpenIntent, close, onOpenChange } = useHoverCardState()

  const {
    currencyInfo,
    currencyInfoUnavailable,
    isMultichainAsset,
    entries,
    chartLoading,
    price,
    pricePercentChange,
    priceAbsoluteChange,
  } = useTokenHoverCardData({ currencyInfoProp, currencyIdFromToken, gqlChain, rawAddress, hasOpenIntent, isOpen })

  const contractAddress = rawAddress && rawAddress !== NATIVE_CHAIN_ID ? rawAddress : undefined

  const trace = useTrace()

  useFireOncePerOpen({
    isOpen,
    ready: !chartLoading && !!currencyInfo,
    fire: () =>
      sendAnalyticsEvent(InterfaceEventName.TokenHoverCardDataLoaded, {
        ...trace,
        token_symbol: currencyInfo?.currency.symbol,
        chain_id: currencyInfo?.currency.chainId,
        token_address: contractAddress ?? undefined,
        is_multichain: isMultichainAsset,
      }),
  })

  const {
    viewIndex,
    animationType,
    orderedMultichainEntries,
    isCopied,
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
    trace,
    onClose: close,
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
      onOpenChange(open)
      if (!open) {
        resetView()
      }
    },
    [onOpenChange, resetView],
  )

  useFireOncePerOpen({
    isOpen,
    // Fires at open rather than waiting on the deferred fetch, which would drop opens that end mid-flight.
    // Row token data fills the payload, so is_multichain may read false on a first open.
    fire: () =>
      sendAnalyticsEvent(InterfaceEventName.TokenHoverCardOpened, {
        ...trace,
        token_symbol: currencyInfo?.currency.symbol ?? token?.symbol ?? undefined,
        chain_id: currencyInfo?.currency.chainId ?? chainId,
        token_address: contractAddress ?? undefined,
        is_multichain: isMultichainAsset,
      }),
  })

  const maxContentWidth = useHoverCardMaxContentWidth({ containerWidth, widthOffset })

  return (
    <HoverCard
      isOpen={isOpen}
      placement={placement}
      offset={offset}
      childOwnsPressFeedback={childOwnsPressFeedback}
      onOpenChange={handleOpenChange}
      content={
        <MultichainAddressTransitionPanel
          bare
          viewIndex={viewIndex}
          animationType={animationType}
          orderedEntries={orderedMultichainEntries}
          title={t('common.copy.address')}
          width={getHoverCardContentWidth(maxContentWidth)}
          maxHeight={MULTICHAIN_CONTEXT_MENU_ADDRESSES_PANEL_MAX_HEIGHT}
          onCopyAddress={handleCopyMultichainAddress}
          onBack={goBack}
        >
          {currencyInfo ? (
            <TokenHoverCardContent
              currencyInfo={currencyInfo}
              isMultichainAsset={isMultichainAsset}
              price={price}
              pricePercentChange={pricePercentChange}
              priceAbsoluteChange={priceAbsoluteChange}
              priceData={entries}
              chartLoading={chartLoading}
              isCopied={isCopied}
              onCopy={contractAddress ? handleCopy : undefined}
              onExpand={handleExpand}
              maxWidth={maxContentWidth}
            />
          ) : (
            // Stays mounted when the fetch settles empty: unmounting mid-hover flickers, and an unmounted
            // Popover can't fire onOpenChange to reset isOpen.
            <TokenHoverCardPlaceholder unavailable={currencyInfoUnavailable} maxWidth={maxContentWidth} />
          )}
        </MultichainAddressTransitionPanel>
      }
    >
      {children}
    </HoverCard>
  )
}
