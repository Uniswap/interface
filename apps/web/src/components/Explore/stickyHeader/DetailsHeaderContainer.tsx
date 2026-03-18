import { Flex, useMedia } from 'ui/src'
import { HEADER_TRANSITION } from '~/components/Explore/stickyHeader/constants'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'

interface DetailsHeaderContainerProps {
  children: React.ReactNode
  /** When true, reduces vertical padding for a compact sticky header. Pass from page scroll state. */
  isCompact?: boolean
}

export function DetailsHeaderContainer({ children, isCompact = false }: DetailsHeaderContainerProps): JSX.Element {
  const appHeaderHeight = useAppHeaderHeight()
  const media = useMedia()

  return (
    <Flex
      width="100%"
      px="$spacing40"
      $lg={{ px: '$padding20' }}
      backgroundColor="$surface1"
      zIndex="$header"
      alignSelf="center"
      $platform-web={{
        position: 'sticky',
        top: appHeaderHeight,
      }}
    >
      <Flex
        width="100%"
        borderBottomWidth={1}
        borderBottomColor="$surface3"
        py={isCompact && media.sm ? '$spacing12' : '$spacing20'}
        transition={HEADER_TRANSITION}
      >
        {children}
      </Flex>
    </Flex>
  )
}
