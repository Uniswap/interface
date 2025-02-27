import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { AnimateInOrder, ElementAfterText, Flex, TouchableArea } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'
import { setHasSeenBridgingTooltip } from 'uniswap/src/features/behaviorHistory/slice'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useUnichainTooltipVisibility } from 'uniswap/src/features/unichain/hooks/useUnichainTooltipVisibility'
import { isInterface, isMobileWeb } from 'utilities/src/platform'

export type TokenSectionFooterProps = {
  sectionKey: TokenOptionSection
  rightElement?: JSX.Element
  name?: string
  chainId?: UniverseChainId | null
}

export const SectionFooter = memo(function _SectionFooter({
  sectionKey,
  rightElement,
  name,
  chainId,
}: TokenSectionFooterProps): JSX.Element | null {
  const dispatch = useDispatch()
  const { shouldShowUnichainBridgingTooltip } = useUnichainTooltipVisibility()
  const isTooltipPlatform = !isInterface || isMobileWeb
  const isUnichainBridgingSection =
    chainId === UniverseChainId.Unichain && sectionKey === TokenOptionSection.BridgingTokens
  const showUnichainBridgingPromo = shouldShowUnichainBridgingTooltip && isUnichainBridgingSection && isTooltipPlatform

  const title = useTokenOptionsSectionTitle(sectionKey)

  // Hide footer if we shouldn't display it
  if (!showUnichainBridgingPromo) {
    return null
  }

  return (
    <AnimateInOrder index={0} delayMs={800} animation="125msDelayedLong" enterStyle={{ opacity: 0 }}>
      <Flex
        row
        alignItems="center"
        justifyContent="space-between"
        width="calc(100% - 32px)"
        backgroundColor="$surface2"
        mx="$spacing16"
        pl="$spacing16"
        p="$spacing12"
        borderRadius="$rounded12"
      >
        <ElementAfterText
          text={name ?? title}
          textProps={{ variant: 'body3', color: '$neutral1' }}
          wrapperProps={{ flex: 1 }}
          element={rightElement}
        />

        <TouchableArea
          onPress={() => {
            dispatch(setHasSeenBridgingTooltip(true))
          }}
        >
          <Flex ml="auto">
            <X size={16} color="$neutral2" />
          </Flex>
        </TouchableArea>
      </Flex>
    </AnimateInOrder>
  )
})

function useTokenOptionsSectionTitle(section: TokenOptionSection): string {
  const { t } = useTranslation()
  switch (section) {
    case TokenOptionSection.BridgingTokens:
      return t('unichain.promotion.bridging.tooltip.description')
    default:
      return section
  }
}
