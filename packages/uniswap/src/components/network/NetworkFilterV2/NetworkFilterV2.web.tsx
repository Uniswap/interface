import { isTouchable, isWebApp } from '@universe/environment'
import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdaptiveWebPopoverContent, Flex, Popover, useMedia, useShadowPropsMedium } from 'ui/src'
import { NetworkFilterDropdownContent } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterDropdownContent'
import { NetworkFilterTrigger } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterTrigger'
import type { NetworkFilterV2Props } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'

const DESKTOP_DROPDOWN_MAX_HEIGHT = 320
const DROPDOWN_WIDTH = 240
const DROPDOWN_OFFSET = 8

function getViewportConstrainedMaxHeight({
  triggerElement,
  preferredMaxHeight,
}: {
  triggerElement: HTMLElement
  preferredMaxHeight: number
}): number {
  const rect = triggerElement.getBoundingClientRect()
  const viewportEdgeInset = DROPDOWN_OFFSET
  const spaceBelow = window.innerHeight - rect.bottom - DROPDOWN_OFFSET - viewportEdgeInset
  const spaceAbove = rect.top - DROPDOWN_OFFSET - viewportEdgeInset
  const fitsBelow = preferredMaxHeight <= spaceBelow

  if (fitsBelow) {
    return Math.min(preferredMaxHeight, Math.max(0, spaceBelow))
  }

  const fitsAbove = preferredMaxHeight <= spaceAbove
  if (fitsAbove && spaceAbove > spaceBelow) {
    return Math.min(preferredMaxHeight, Math.max(0, spaceAbove))
  }

  const flipVertical = spaceAbove > spaceBelow
  const availableSpace = flipVertical ? spaceAbove : spaceBelow

  return Math.min(preferredMaxHeight, Math.max(0, availableSpace))
}

export function NetworkFilterV2({
  chainIds,
  selectedChain,
  onPressChain,
  includeAllNetworks,
  tieredOptions,
}: NetworkFilterV2Props): JSX.Element {
  const { t } = useTranslation()
  const { defaultChainId } = useEnabledChains()
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLElement | null>(null)
  const [dropdownMaxHeight, setDropdownMaxHeight] = useState(DESKTOP_DROPDOWN_MAX_HEIGHT)
  const media = useMedia()
  const shadowProps = useShadowPropsMedium()
  const isMobileSheet = isWebApp && media.sm
  const dropdownWidth = isMobileSheet ? '100%' : DROPDOWN_WIDTH
  const displayedChainId = selectedChain ?? (includeAllNetworks ? null : defaultChainId)
  const selectedChainTooltipLabel = displayedChainId
    ? getChainInfo(displayedChainId).label
    : t('transaction.network.all')

  const handleOpenChange = useEvent((nextIsOpen: boolean) => {
    setIsOpen(nextIsOpen)
  })

  const handleClose = useEvent(() => {
    setIsOpen(false)
  })

  const handlePressChain = useEvent((chainId: UniverseChainId | null) => {
    onPressChain(chainId)
    handleClose()
  })

  const handleToggleOpen = useEvent(() => {
    setIsOpen(!isOpen)
  })

  useLayoutEffect(() => {
    if (!isOpen || isMobileSheet || !triggerRef.current) {
      return undefined
    }

    const updateMaxHeight = (): void => {
      if (!triggerRef.current) {
        return
      }

      setDropdownMaxHeight(
        getViewportConstrainedMaxHeight({
          triggerElement: triggerRef.current,
          preferredMaxHeight: DESKTOP_DROPDOWN_MAX_HEIGHT,
        }),
      )
    }

    updateMaxHeight()
    window.addEventListener('resize', updateMaxHeight)
    window.addEventListener('scroll', updateMaxHeight, true)

    return () => {
      window.removeEventListener('resize', updateMaxHeight)
      window.removeEventListener('scroll', updateMaxHeight, true)
    }
  }, [isMobileSheet, isOpen])

  return (
    <Popover
      stayInFrame
      allowFlip
      open={isOpen}
      placement="bottom-end"
      offset={{ mainAxis: DROPDOWN_OFFSET }}
      onOpenChange={handleOpenChange}
    >
      <Popover.Trigger ref={triggerRef}>
        <NetworkFilterTrigger
          defaultChainId={defaultChainId}
          includeAllNetworks={includeAllNetworks}
          isOpen={isOpen}
          selectedChain={selectedChain}
          tooltipLabel={isTouchable ? undefined : selectedChainTooltipLabel}
          onPress={handleToggleOpen}
        />
      </Popover.Trigger>

      <AdaptiveWebPopoverContent
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderRadius="$rounded24"
        borderWidth={1}
        {...shadowProps}
        isOpen={isOpen}
        placement="bottom-end"
        px="$spacing4"
        pb="$none"
        overflow="hidden"
        webBottomSheetProps={{ onClose: handleClose, snapPoints: [60], snapPointsMode: 'percent' }}
      >
        <Flex
          width={dropdownWidth}
          flex={isMobileSheet ? 1 : undefined}
          height={isMobileSheet ? '100%' : undefined}
          maxHeight={isMobileSheet ? undefined : dropdownMaxHeight}
          flexDirection="column"
          minHeight={0}
          overflow="hidden"
        >
          <NetworkFilterDropdownContent
            autoFocus={!isMobileSheet}
            chainIds={chainIds}
            fillAvailableHeight={!isMobileSheet}
            includeAllNetworks={includeAllNetworks}
            isMobileSheet={isMobileSheet}
            isOpen={isOpen}
            selectedChain={selectedChain}
            tieredOptions={tieredOptions}
            onPressChain={handlePressChain}
          />
        </Flex>
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
