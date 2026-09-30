import { useNavigation } from '@react-navigation/native'
import { Flex, spacing, TouchableArea } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { RotatableChevron } from 'ui/src/components/icons'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'

// Header bar height (below the status-bar inset). Wrappers add insets.top to offset content below it.
export const ONBOARDING_HEADER_BAR_HEIGHT = spacing.spacing48

type OnboardingHeaderProps = {
  disableGoBack?: boolean
  renderHeaderRight?: () => JSX.Element | null
}

// Rendered inside the screen body (not the native-stack header) because RNGH/responder touchables in
// the transparent native header have their press cancelled by the scroll ancestor on the first MOVE
// under Fabric — only instantaneous taps survive. In-screen touchables receive the full touch stream.
export function OnboardingHeader({ disableGoBack, renderHeaderRight }: OnboardingHeaderProps): JSX.Element {
  const insets = useAppInsets()
  const navigation = useNavigation()

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="space-between"
      left={0}
      pointerEvents="box-none"
      position="absolute"
      px="$spacing16"
      right={0}
      top={insets.top}
      zIndex="$sticky"
    >
      {disableGoBack ? (
        <Flex />
      ) : (
        <TouchableArea hitSlop={24} testID={TestID.OnboardingHeaderBack} onPress={() => navigation.goBack()}>
          <RotatableChevron color="$neutral2" size="$icon.28" />
        </TouchableArea>
      )}
      {renderHeaderRight?.()}
    </Flex>
  )
}
