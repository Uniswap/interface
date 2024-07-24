// eslint-disable-next-line no-restricted-imports
import { GetThemeValueForKey } from '@tamagui/core'
import { PropsWithChildren, useCallback } from 'react'
import { Adapt, Dialog, ScrollView, Sheet, VisuallyHidden } from 'tamagui'

type ModalProps = PropsWithChildren<{
  isOpen: boolean
  onClose?: () => void
  width?: number
  maxHeight?: GetThemeValueForKey<'maxHeight'>
}>

export function AdaptiveWebModalSheet({ isOpen, onClose, width, maxHeight, children }: ModalProps): JSX.Element {
  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && onClose) {
        onClose()
      }
    },
    [onClose],
  )
  return (
    <Dialog modal open={isOpen} onOpenChange={handleClose}>
      <VisuallyHidden>
        <Dialog.Title />
      </VisuallyHidden>
      <Adapt when="sm">
        <Sheet dismissOnSnapToBottom modal animation="200ms">
          <Sheet.Frame
            borderBottomWidth="$none"
            borderColor="$surface3"
            borderTopLeftRadius="$rounded16"
            borderTopRightRadius="$rounded16"
            borderWidth="$spacing1"
            gap={4}
            px={24}
            py={4}
          >
            <Sheet.Handle backgroundColor="$surface3" height={4} marginHorizontal="auto" mb={16} width={32} />
            <Adapt.Contents />
          </Sheet.Frame>
          <Sheet.Overlay
            animation="lazy"
            backgroundColor="$scrim"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
          />
        </Sheet>
      </Adapt>

      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          animation="300ms"
          backgroundColor="$scrim"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          opacity={0.5}
        />

        <Dialog.Content
          key="content"
          bordered
          elevate
          animateOnly={['transform', 'opacity']}
          animation={isOpen ? 'fastHeavy' : 'fastExitHeavy'}
          borderColor="$surface3"
          borderRadius="$rounded16"
          enterStyle={{ x: 0, y: 20, opacity: 0 }}
          exitStyle={{ x: 0, y: 10, opacity: 0 }}
          gap={4}
          m="$spacing16"
          maxHeight={maxHeight || '90vh'}
          px={24}
          py={16}
          width={width}
        >
          <ScrollView>{children}</ScrollView>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
