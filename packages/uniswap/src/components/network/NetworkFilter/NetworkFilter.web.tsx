import { SharedEventName } from '@uniswap/analytics-events'
import { UniverseChainId } from '@universe/chains'
import { isTouchable, isWebApp } from '@universe/environment'
import { Flex, Text, type TextProps } from '@universe/mycelium'
import { AdaptiveWebPopoverContentCompat, PopoverCompat } from '@universe/mycelium/popover-compat'
import { useMedia, useShadowPropsMedium } from '@universe/mycelium/theme-hooks-compat'
import { iconSizes } from '@universe/mycelium/tokens'
import { TriggerButtonCompat, type TriggerButtonCompatSize } from '@universe/mycelium/trigger-button-compat'
import { TestID } from '@universe/test'
import isEqual from 'lodash/isEqual'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'
import type { NetworkFilterProps } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { NetworkFilterDropdownContent } from 'uniswap/src/components/network/NetworkFilter/NetworkFilterDropdownContent'
import { NetworkFilterTrigger } from 'uniswap/src/components/network/NetworkFilter/NetworkFilterTrigger'
import { resolveNetworkFilterDisplay } from 'uniswap/src/components/network/NetworkFilter/resolveNetworkFilterDisplay'
import {
  type NetworkFilterOpenLayout,
  resolveNetworkFilterOpenLayout,
} from 'uniswap/src/components/network/NetworkFilter/resolveNetworkFilterOpenLayout'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { getChainLabel, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ALL_NETWORKS_LABEL } from 'uniswap/src/features/telemetry/types'
import { useEvent } from 'utilities/src/react/hooks'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { debounceCallback } from 'utilities/src/time/timing'

const DESKTOP_DROPDOWN_MAX_HEIGHT = 320
const DROPDOWN_WIDTH = 240
const PILL_DROPDOWN_WIDTH = 272
const DROPDOWN_PADDING_AND_BORDER_WIDTH = 10
const DROPDOWN_OFFSET = 8
const SCROLL_SETTLE_MS = 150

const PILL_LOGO_SIZES: Record<TriggerButtonCompatSize, number> = {
  large: iconSizes.icon24,
  medium: iconSizes.icon20,
  small: iconSizes.icon16,
  xsmall: iconSizes.icon16,
}

const PILL_LABEL_VARIANTS: Record<TriggerButtonCompatSize, TextProps['variant']> = {
  large: 'buttonLabel2',
  medium: 'buttonLabel3',
  small: 'buttonLabel4',
  xsmall: 'buttonLabel4',
}

function isVisibleAtCenter(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2)
  return hit !== null && element.contains(hit)
}

function NetworkFilterPillTrigger({
  displayedChainId,
  label,
  isOpen,
  onPress,
  size = 'medium',
  showLabel = false,
  transition,
}: {
  displayedChainId: UniverseChainId | null
  label: string
  isOpen: boolean
  onPress: () => void
  size?: TriggerButtonCompatSize
  showLabel?: boolean
  transition?: string
}): JSX.Element {
  return (
    <TriggerButtonCompat isExpanded={isOpen} size={size} testID={TestID.TokensNetworkFilterTrigger} onPress={onPress}>
      <NetworkLogo chainId={displayedChainId} size={PILL_LOGO_SIZES[size]} transition={transition} />
      {showLabel && (
        <Text variant={PILL_LABEL_VARIANTS[size]} color="$neutral1" transition={transition}>
          {label}
        </Text>
      )}
    </TriggerButtonCompat>
  )
}

export function NetworkFilter({
  chainIds,
  selectedChain,
  onPressChain,
  includeAllNetworks,
  tieredOptions,
  allNetworksChainIds,
  forceAllNetworksLabel,
  footer,
  showSearchInput = true,
  trigger = { variant: 'icon' },
  placement = 'bottom-end',
  contentMaxHeight,
  selectionAnalytics,
  dropdownOnMobile = false,
}: NetworkFilterProps): JSX.Element {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const parentTrace = useTrace()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)
  const listContainerRef = useRef<HTMLDivElement | null>(null)
  const preferredMaxHeight = Math.min(DESKTOP_DROPDOWN_MAX_HEIGHT, contentMaxHeight ?? DESKTOP_DROPDOWN_MAX_HEIGHT)
  const preferredAlign = placement === 'bottom-start' ? 'start' : 'end'
  const [openLayout, setOpenLayout] = useState<NetworkFilterOpenLayout>({
    side: 'bottom',
    align: preferredAlign,
    maxHeight: preferredMaxHeight,
  })
  const media = useMedia()
  const shadowProps = useShadowPropsMedium()
  const isMobileWeb = isWebApp && media.sm
  const isMobileSheet = isMobileWeb && !dropdownOnMobile
  const listWidth = trigger.variant === 'pill' ? PILL_DROPDOWN_WIDTH : DROPDOWN_WIDTH
  const dropdownWidth = isMobileSheet ? '100%' : listWidth
  const resolvedPlacement = `${openLayout.side}-${openLayout.align}` as const
  const { showAllNetworks, displayedChainId } = resolveNetworkFilterDisplay({
    chainIds,
    selectedChain,
    includeAllNetworks,
    defaultChainId,
  })
  const displayedLabel = displayedChainId ? getChainLabel(displayedChainId) : t('transaction.network.all')

  const handleOpenChange = useEvent((nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen)
  })

  const handleClose = useEvent(() => {
    setIsOpen(false)
  })

  const handlePressChain = useEvent((chainId: UniverseChainId | null) => {
    if (selectionAnalytics) {
      const nextChainInfo = chainId ? getChainInfo(chainId) : null
      const previousChainInfo = selectedChain ? getChainInfo(selectedChain) : null
      const allNetworksChainName = t('transaction.network.all')
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...parentTrace,
        ...selectionAnalytics,
        modal: ModalName.NetworkSelector,
        chain: nextChainInfo ? toGraphQLChain(nextChainInfo.id) : allNetworksChainName,
        chain_id: nextChainInfo?.id ?? ALL_NETWORKS_LABEL,
        chain_name: nextChainInfo?.label ?? ALL_NETWORKS_LABEL,
        previous_connected_chain: previousChainInfo ? toGraphQLChain(previousChainInfo.id) : allNetworksChainName,
        previous_chain_id: previousChainInfo?.id ?? ALL_NETWORKS_LABEL,
        previous_chain_name: previousChainInfo?.label ?? ALL_NETWORKS_LABEL,
      })
    }
    onPressChain(chainId)
    handleClose()
  })

  const handleToggleOpen = useEvent(() => {
    setIsOpen(!isOpen)
  })

  // Base UI's collision handling re-decides every scroll frame and swings the menu sideways when neither
  // side fits, so the layout is only decided on open, resize and scroll settle.
  useLayoutEffect(() => {
    if (!isOpen || isMobileSheet || !triggerRef.current) {
      return undefined
    }

    const updateOpenLayout = (): void => {
      if (!triggerRef.current) {
        return
      }

      const nextLayout = resolveNetworkFilterOpenLayout({
        triggerRect: triggerRef.current.getBoundingClientRect(),
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
        preferredMaxHeight,
        menuWidth: listWidth + DROPDOWN_PADDING_AND_BORDER_WIDTH,
        preferredAlign,
        offset: DROPDOWN_OFFSET,
      })
      setOpenLayout((prev) => (isEqual(prev, nextLayout) ? prev : nextLayout))
    }

    const { triggerDebounce: onScrollSettle, cancelDebounce } = debounceCallback(() => {
      if (triggerRef.current && isVisibleAtCenter(triggerRef.current)) {
        updateOpenLayout()
      } else {
        handleClose()
      }
    }, SCROLL_SETTLE_MS)
    const handleScroll = (event: Event): void => {
      if (event.target instanceof Node && listContainerRef.current?.contains(event.target)) {
        return
      }
      onScrollSettle()
    }

    updateOpenLayout()
    window.addEventListener('resize', updateOpenLayout)
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true })

    return () => {
      cancelDebounce()
      window.removeEventListener('resize', updateOpenLayout)
      window.removeEventListener('scroll', handleScroll, { capture: true })
    }
  }, [handleClose, isMobileSheet, isOpen, listWidth, preferredAlign, preferredMaxHeight])

  // Focusing on mount, before the positioner has placed the popup, scrolls the window to the top.
  // Skipped on phones so the soft keyboard doesn't cover the list.
  useEffect(() => {
    if (!isOpen || isMobileWeb || !showSearchInput) {
      return undefined
    }

    const frame = window.requestAnimationFrame(() => {
      listContainerRef.current?.querySelector('input')?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(frame)
  }, [isMobileWeb, isOpen, showSearchInput])

  return (
    <PopoverCompat
      allowFlip={false}
      open={isOpen}
      placement={resolvedPlacement}
      offset={{ mainAxis: DROPDOWN_OFFSET }}
      onOpenChange={handleOpenChange}
    >
      <PopoverCompat.Trigger ref={triggerRef}>
        {trigger.variant === 'pill' ? (
          <NetworkFilterPillTrigger
            displayedChainId={displayedChainId}
            label={displayedLabel}
            isOpen={isOpen}
            size={trigger.size}
            showLabel={trigger.showLabel}
            transition={trigger.transition}
            onPress={handleToggleOpen}
          />
        ) : (
          <NetworkFilterTrigger
            displayedChainId={displayedChainId}
            isOpen={isOpen}
            tooltipLabel={isTouchable ? undefined : displayedLabel}
            content={trigger.variant === 'custom' ? trigger.content : undefined}
            outlined={trigger.variant === 'icon' && trigger.outlined}
            onPress={handleToggleOpen}
          />
        )}
      </PopoverCompat.Trigger>

      <AdaptiveWebPopoverContentCompat
        adaptWhen={isMobileSheet}
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded24"
        borderWidth={1}
        {...shadowProps}
        isOpen={isOpen}
        placement={resolvedPlacement}
        px="$spacing4"
        pb="$none"
        overflow="hidden"
        webBottomSheetProps={{ onClose: handleClose, snapPoints: [60], snapPointsMode: 'percent' }}
      >
        <Flex
          ref={listContainerRef}
          width={dropdownWidth}
          flex={isMobileSheet ? 1 : undefined}
          height={isMobileSheet ? '100%' : undefined}
          maxHeight={isMobileSheet ? undefined : openLayout.maxHeight}
          flexDirection="column"
          minHeight={0}
          overflow="hidden"
        >
          <NetworkFilterDropdownContent
            chainIds={chainIds}
            includeAllNetworks={showAllNetworks}
            allNetworksChainIds={allNetworksChainIds}
            forceAllNetworksLabel={forceAllNetworksLabel}
            footer={footer}
            showSearchInput={showSearchInput}
            isOpen={isOpen}
            selectedChain={selectedChain}
            tieredOptions={tieredOptions}
            onPressChain={handlePressChain}
          />
        </Flex>
      </AdaptiveWebPopoverContentCompat>
    </PopoverCompat>
  )
}
