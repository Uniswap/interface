import { Flex } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import noop from 'utilities/src/react/noop'

interface OverlayProps {
  onClick?: () => void
}

export const Overlay = ({ onClick = noop }: OverlayProps) => {
  return (
    <Flex
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      $platform-web={{
        position: 'fixed',
      }}
      display="block"
      backgroundColor="$black"
      opacity={0.72}
      overflow="hidden"
      zIndex={zIndexes.modalBackdrop - 2}
      onPress={onClick}
    />
  )
}
