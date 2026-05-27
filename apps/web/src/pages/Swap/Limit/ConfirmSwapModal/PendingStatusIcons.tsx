import { Flex, styled } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { ConfirmedIcon, SubmittedIcon } from '~/components/AccountDrawer/MiniPortfolio/Activity/Logos'
import { LogoLoadingSpinner } from '~/components/LogoLoadingSpinner'
import { FadePresence } from '~/theme/components/FadePresence'

const LoadingIndicator = styled(LogoLoadingSpinner, {
  color: '$neutral3',
  width: 'calc(100% + 8px)',
  height: 'calc(100% + 8px)',
  top: -4,
  left: -4,
  position: 'absolute',
})

export function LoadingIndicatorOverlay() {
  return (
    <FadePresence>
      <LoadingIndicator />
    </FadePresence>
  )
}

const ICON_SIZE = iconSizes.icon64

export function AnimatedEntranceConfirmationIcon() {
  return (
    <Flex width={ICON_SIZE} height={ICON_SIZE} centered>
      <ConfirmedIcon />
    </Flex>
  )
}

export function AnimatedEntranceSubmittedIcon() {
  return (
    <Flex width={ICON_SIZE} height={ICON_SIZE} centered>
      <SubmittedIcon />
    </Flex>
  )
}
