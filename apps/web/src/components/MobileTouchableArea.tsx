import { isMobileWeb } from '@universe/environment'
import { Flex, type GetProps, TouchableArea } from 'ui/src'

type FlexProps = GetProps<typeof Flex>

// On desktop web, TouchableArea produces unwanted borders (Tamagui bug), so we
// render a plain flex row instead. On mobile web we keep TouchableArea for tap
// feedback and long-press styling.
const DesktopRowContainer = ({ children, ...rest }: FlexProps) => (
  <Flex row alignItems="center" {...rest}>
    {children}
  </Flex>
)

export const MobileTouchableArea = isMobileWeb ? TouchableArea : DesktopRowContainer
