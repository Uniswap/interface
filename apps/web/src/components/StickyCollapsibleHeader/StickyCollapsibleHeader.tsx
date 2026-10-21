import { Flex } from '@universe/mycelium'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { ComponentProps } from 'react'
import { APP_BODY_MOBILE_GUTTER_PX } from '~/app/layout/constants'
import { HEADER_TRANSITION } from '~/components/StickyCollapsibleHeader/constants'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'

type StickyCollapsibleHeaderProps = ComponentProps<typeof Flex> & {
  children: React.ReactNode
  /** When true, reduces vertical padding for a compact sticky header. Pass from page scroll state. */
  isCompact?: boolean
}

/**
 * Sticky page header below the app chrome: surface background, bottom border, and compact vertical padding on scroll.
 */
export function StickyCollapsibleHeader({
  children,
  isCompact = false,
  ...flexProps
}: StickyCollapsibleHeaderProps): JSX.Element {
  const appHeaderHeight = useAppHeaderHeight()
  const media = useMedia()

  return (
    <Flex
      width="100%"
      px="$spacing40"
      $lg={{ px: '$padding20' }}
      // Bleeds over AppBody's gutter so content scrolling under the header can't show beside it.
      $md={{
        alignSelf: 'stretch',
        width: 'auto',
        mx: -APP_BODY_MOBILE_GUTTER_PX,
        px: APP_BODY_MOBILE_GUTTER_PX,
      }}
      backgroundColor="$surface1"
      transition={HEADER_TRANSITION}
      zIndex="$header"
      alignSelf="center"
      $platform-web={{
        position: 'sticky',
        top: appHeaderHeight,
      }}
      {...flexProps}
    >
      <Flex
        width="100%"
        borderBottomWidth={1}
        borderColor="$surface3"
        py={isCompact && media.sm ? '$spacing12' : '$spacing20'}
        transition={HEADER_TRANSITION}
      >
        {children}
      </Flex>
    </Flex>
  )
}
