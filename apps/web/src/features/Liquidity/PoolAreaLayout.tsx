import { Flex, type FlexCompatProps } from '@universe/mycelium'
import { MAX_CONTENT_WIDTH_PX } from '~/theme'

export function PoolAreaLayout({ $xxl: xxl, $lg: lg, ...props }: FlexCompatProps): JSX.Element {
  return (
    <Flex
      width="100%"
      maxWidth={MAX_CONTENT_WIDTH_PX}
      mx="auto"
      px="$none"
      $xxl={{ px: '$spacing40', ...xxl }}
      $lg={{ px: '$spacing20', ...lg }}
      {...props}
    />
  )
}
