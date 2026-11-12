import { Flex, iconSizes } from '@universe/mycelium'
import { ConfirmedIcon, SubmittedIcon } from '~/components/Activity/Logos'
import { LogoLoadingSpinner } from '~/components/LogoLoadingSpinner'
import { FadePresence } from '~/theme/components/FadePresence/FadePresence'

/** Oversized absolute overlay ring; color is the spinner's own neutral3 default. */
const LoadingIndicator = (): JSX.Element => (
  <LogoLoadingSpinner
    style={{ width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', top: -4, left: -4, position: 'absolute' }}
  />
)

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
