import { isTouchable, isWebApp } from '@universe/environment'
import { useState } from 'react'
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
          <NetworkFilterDropdownContent
            autoFocus={!isMobileSheet}
            chainIds={chainIds}
            includeAllNetworks={includeAllNetworks}
            isMobileSheet={isMobileSheet}
            isOpen={isOpen}
            maxHeight={DESKTOP_DROPDOWN_MAX_HEIGHT}
            selectedChain={selectedChain}
            tieredOptions={tieredOptions}
            onPressChain={handlePressChain}
          />
        </Flex>
      </AdaptiveWebPopoverContent>
    </Popover>
  )
}
