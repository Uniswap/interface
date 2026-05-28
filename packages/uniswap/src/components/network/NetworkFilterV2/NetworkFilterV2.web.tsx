import { isTouchable, isWebApp } from '@universe/environment'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { LayoutChangeEvent } from 'react-native'
import { AdaptiveWebPopoverContent, Flex, Popover, useMedia, useScrollbarStyles, useShadowPropsMedium } from 'ui/src'
import { NetworkFilterContent } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterContent'
import { NetworkFilterTrigger } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterTrigger'
import type { NetworkFilterV2Props } from 'uniswap/src/components/network/NetworkFilterV2/NetworkFilterV2'
import { NetworkSearchBar } from 'uniswap/src/components/network/NetworkFilterV2/NetworkSearchBar'
import { useNetworkFilterSearch } from 'uniswap/src/components/network/NetworkFilterV2/useNetworkFilterSearch'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'

const DESKTOP_DROPDOWN_MAX_HEIGHT = 320
const DROPDOWN_WIDTH = 240

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
  const { searchQuery, setSearchQuery, filteredChainIds, filteredTieredOptions, showAllNetworks } =
    useNetworkFilterSearch({
      chainIds,
      includeAllNetworks,
      tieredOptions,
    })
  const media = useMedia()
  const scrollbarStyles = useScrollbarStyles()
  const shadowProps = useShadowPropsMedium()
  const isMobileSheet = isWebApp && media.sm
  const [desktopContentHeight, setDesktopContentHeight] = useState<number | null>(null)
  const dropdownWidth = isMobileSheet ? '100%' : DROPDOWN_WIDTH
  const desktopListHeight =
    desktopContentHeight === null
      ? DESKTOP_DROPDOWN_MAX_HEIGHT
      : Math.min(desktopContentHeight, DESKTOP_DROPDOWN_MAX_HEIGHT)
  const hasDesktopScrollbar = desktopContentHeight !== null && desktopContentHeight > DESKTOP_DROPDOWN_MAX_HEIGHT
  const displayedChainId = selectedChain ?? (includeAllNetworks ? null : defaultChainId)
  const selectedChainTooltipLabel = displayedChainId
    ? getChainInfo(displayedChainId).label
    : t('transaction.network.all')

  const handleOpenChange = useEvent((nextIsOpen: boolean) => {
    if (!nextIsOpen) {
      setSearchQuery('')
    }
    setIsOpen(nextIsOpen)
  })

  const handleClose = useEvent(() => {
    handleOpenChange(false)
  })

  const handlePressChain = useEvent((chainId: UniverseChainId | null) => {
    onPressChain(chainId)
    handleClose()
  })

  const handleToggleOpen = useEvent(() => {
    handleOpenChange(!isOpen)
  })

  const handleDesktopContentLayout = useCallback(
    (event: LayoutChangeEvent) => {
      if (isMobileSheet) {
        return
      }

      setDesktopContentHeight(event.nativeEvent.layout.height)
    },
    [isMobileSheet],
  )

  return (
    <Popover open={isOpen} placement="bottom-end" offset={{ mainAxis: 8 }} onOpenChange={handleOpenChange}>
      <Popover.Trigger>
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
        webBottomSheetProps={{ onClose: handleClose, snapPoints: ['60%'] }}
      >
        <Flex width={dropdownWidth} flex={isMobileSheet ? 1 : undefined} height={isMobileSheet ? '100%' : undefined}>
          <NetworkSearchBar autoFocus={!isMobileSheet} value={searchQuery} onChangeText={setSearchQuery} />
          <Flex
            flex={isMobileSheet ? 1 : undefined}
            height={isMobileSheet ? undefined : desktopListHeight}
            minHeight={0}
            pr={isMobileSheet || hasDesktopScrollbar ? '$none' : '$spacing2'}
            style={{
              ...scrollbarStyles,
              scrollbarWidth: 'auto',
              overflow: 'auto',
              transition: isMobileSheet ? undefined : 'height 160ms ease',
            }}
          >
            <Flex onLayout={handleDesktopContentLayout}>
              <NetworkFilterContent
                searchQuery={searchQuery}
                chainIds={filteredChainIds}
                selectedChain={selectedChain}
                showAllNetworks={showAllNetworks}
                tieredOptions={filteredTieredOptions}
                onPressChain={handlePressChain}
              />
            </Flex>
          </Flex>
        </Flex>
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
