import { RemoveScroll } from '@tamagui/remove-scroll'
import { PropsWithChildren, ReactNode, useCallback, useState } from 'react'
import { Adapt, Dialog, GetProps, Sheet, View, VisuallyHidden, styled, useIsTouchDevice } from 'tamagui'
import { Flex } from 'ui/src/components/layout'
import { zIndices } from 'ui/src/theme'
import { useShadowPropsShort } from 'ui/src/theme/shadows'

export function WebBottomSheet({ isOpen, onClose, children, ...rest }: ModalProps): JSX.Element {
  const isTouchDevice = useIsTouchDevice()
  const [isHandlePressed, setHandlePressed] = useState(false)

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && onClose) {
        onClose()
      }
    },
    [onClose],
  )

  const sheetOverrideStyles: GetProps<typeof View> = {
    ...rest,
    width: '100%',
    maxWidth: '100%',
    minWidth: '100%',
  }

  return (
    <RemoveScroll enabled={isOpen}>
      <Sheet
        dismissOnOverlayPress
        dismissOnSnapToBottom
        modal
        animation="200ms"
        disableDrag={isTouchDevice && !isHandlePressed}
        open={isOpen}
        snapPointsMode="fit"
        zIndex={zIndices.modal}
        onOpenChange={handleClose}
      >
        <Sheet.Frame
          borderBottomWidth="$none"
          borderColor="$surface3"
          borderTopLeftRadius="$rounded16"
          borderTopRightRadius="$rounded16"
          borderWidth="$spacing1"
          flex={1}
          height={rest.$sm?.height}
          maxHeight={rest.$sm?.maxHeight ?? '100dvh'}
          px="$spacing8"
          zIndex={zIndices.modal}
          {...sheetOverrideStyles}
        >
          <Sheet.Handle
            justifyContent="center"
            m={0}
            pb="$spacing16"
            pt="$spacing8"
            width="100%"
            backgroundColor="$transparent"
            onMouseDown={() => setHandlePressed(true)}
            onMouseUp={() => setHandlePressed(false)}
          >
            <Flex backgroundColor="$surface3" height="$spacing4" width="$spacing32" />
          </Sheet.Handle>
          {children}
        </Sheet.Frame>
        <Sheet.Overlay
          animation="lazy"
          backgroundColor="$scrim"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          zIndex={zIndices.modalBackdrop}
        />
      </Sheet>
    </RemoveScroll>
  )
}

const Overlay = styled(Dialog.Overlay, {
  animation: '300ms',
  backgroundColor: '$scrim',
  opacity: 0.5,
  enterStyle: { opacity: 0 },
  exitStyle: { opacity: 0 },
})

type ModalProps = GetProps<typeof View> &
  PropsWithChildren<{
    isOpen: boolean
    onClose?: () => void
    adaptToSheet?: boolean
    alignment?: 'center' | 'top'
  }>

/**
 * AdaptiveWebModal is a responsive modal component that adapts to different screen sizes.
 * On larger screens, it renders as a dialog modal.
 * On smaller screens (mobile devices), it adapts into a bottom sheet.
 */
export function AdaptiveWebModal({
  isOpen,
  onClose,
  children,
  adaptToSheet = true,
  style,
  alignment = 'center',
  ...rest
}: ModalProps): JSX.Element {
  const filteredRest = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined)) // Filter out undefined properties from rest

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && onClose) {
        onClose()
      }
    },
    [onClose],
  )

  const isTopAligned = alignment === 'top'

  return (
    <Dialog modal open={isOpen} onOpenChange={handleClose}>
      <VisuallyHidden>
        <Dialog.Title />
      </VisuallyHidden>
      {adaptToSheet &&
        !isTopAligned && ( // Tamagui Sheets always animate in from the bottom, so we cannot use Sheets on top aligned modals
          <Adapt when="sm">
            <WebBottomSheet isOpen={isOpen} style={style} onClose={onClose} {...filteredRest}>
              <Adapt.Contents />
            </WebBottomSheet>
          </Adapt>
        )}

      <Dialog.Portal zIndex={zIndices.modal}>
        <Overlay key="overlay" zIndex={zIndices.modalBackdrop} />

        <Dialog.Content
          key="content"
          bordered
          elevate
          animateOnly={['transform', 'opacity']}
          animation={isOpen ? 'fastHeavy' : 'fastExitHeavy'}
          borderColor="$surface3"
          borderRadius="$rounded16"
          enterStyle={{ x: 0, y: isTopAligned ? -20 : 20, opacity: 0 }}
          exitStyle={{ x: 0, y: isTopAligned ? -20 : 10, opacity: 0 }}
          gap={4}
          m="$spacing16"
          maxHeight="calc(100vh - 32px)"
          maxWidth={420}
          overflow="hidden"
          px="$spacing24"
          py="$spacing16"
          style={style}
          width="calc(100vw - 32px)"
          zIndex={zIndices.modal}
          {...filteredRest}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}

/**
 * Copy of AdaptiveWebModal with a bottom attachment, used temporarily until we can fully test and adapt to rest of app
 * TODO WALL-5146 Combine this with AdaptiveWebModal and fix for all use cases
 */
export function WebModalWithBottomAttachment({
  isOpen,
  onClose,
  children,
  adaptToSheet = true,
  style,
  alignment = 'center',
  bottomAttachment,
  backgroundColor = '$surface1',
  ...rest
}: ModalProps & { bottomAttachment?: ReactNode }): JSX.Element {
  const shadowProps = useShadowPropsShort()

  const filteredRest = Object.fromEntries(Object.entries(rest).filter(([_, v]) => v !== undefined)) // Filter out undefined properties from rest

  const handleClose = useCallback(
    (open: boolean) => {
      if (!open && onClose) {
        onClose()
      }
    },
    [onClose],
  )

  const isTopAligned = alignment === 'top'

  return (
    <Dialog modal open={isOpen} onOpenChange={handleClose}>
      <VisuallyHidden>
        <Dialog.Title />
      </VisuallyHidden>
      {adaptToSheet &&
        !isTopAligned && ( // Tamagui Sheets always animate in from the bottom, so we cannot use Sheets on top aligned modals
          <Adapt when="sm">
            <WebBottomSheet isOpen={isOpen} style={style} onClose={onClose} {...filteredRest}>
              <Adapt.Contents />
            </WebBottomSheet>
          </Adapt>
        )}

      <Dialog.Portal zIndex={zIndices.modal}>
        <Overlay key="overlay" zIndex={zIndices.modalBackdrop} />

        <Dialog.Content
          key="content"
          unstyled
          animateOnly={['transform', 'opacity']}
          animation={isOpen ? 'fastHeavy' : 'fastExitHeavy'}
          backgroundColor="$transparent"
          enterStyle={{ x: 0, y: isTopAligned ? -20 : 20, opacity: 0 }}
          exitStyle={{ x: 0, y: isTopAligned ? -20 : 10, opacity: 0 }}
          maxHeight="calc(100vh - 32px)"
          maxWidth={420}
          overflow="hidden"
          p="$none"
          style={style}
          width="calc(100vw - 32px)"
          zIndex={zIndices.modal}
        >
          <Flex height="100%" width="100%" gap="$spacing8">
            <Flex
              {...shadowProps}
              backgroundColor={backgroundColor}
              borderColor="$surface3"
              borderRadius="$rounded16"
              borderWidth="$spacing1"
              px="$spacing24"
              py="$spacing16"
              gap="$spacing4"
              overflow="hidden"
              {...filteredRest}
            >
              {children}
            </Flex>
            {bottomAttachment && <Flex>{bottomAttachment}</Flex>}
          </Flex>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  )
}
