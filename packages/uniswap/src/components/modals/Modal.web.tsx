import { useEffect, useState } from 'react'
// biome-ignore lint/style/noRestrictedImports: needed here
import { AdaptiveWebModal, WebModalWithBottomAttachment } from 'ui/src/components/modal/AdaptiveWebModal'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import type { ModalProps } from 'uniswap/src/components/modals/ModalProps'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { isExtensionApp, isWebApp } from 'utilities/src/platform'

const ANIMATION_MS = 200

export function Modal({
  children,
  name,
  onClose,
  fullScreen,
  backgroundColor,
  isModalOpen = true,
  alignment = 'center',
  maxWidth,
  maxHeight,
  height,
  padding,
  bottomAttachment,
  gap,
  paddingX,
  paddingY,
  pt,
  pb,
  mx = '$none',
  analyticsProperties,
  skipLogImpression,
  position,
  flex,
  zIndex,
  isDismissible = true,
  hideHandlebar,
}: ModalProps): JSX.Element {
  const [fullyClosed, setFullyClosed] = useState(false)

  if (fullyClosed && isModalOpen) {
    setFullyClosed(false)
  }

  // Not the greatest, we are syncing 200 here to 200ms animation
  // TODO(EXT-745): Add Tamagui onFullyClosed callback and replace here
  useEffect(() => {
    if (!isModalOpen) {
      const tm = setTimeout(() => {
        setFullyClosed(true)
      }, ANIMATION_MS)

      return () => {
        clearTimeout(tm)
      }
    }
    return undefined
  }, [isModalOpen])

  const ModalComponent = bottomAttachment ? WebModalWithBottomAttachment : AdaptiveWebModal

  return (
    <Trace logImpression={skipLogImpression ? false : isModalOpen} modal={name} properties={analyticsProperties}>
      {(isModalOpen || !fullyClosed) && (
        <ModalComponent
          position={position}
          bottomAttachment={bottomAttachment}
          shadowOpacity={isExtensionApp ? 0 : undefined}
          borderWidth={isExtensionApp ? 0 : undefined}
          adaptToSheet={isWebApp}
          alignment={alignment}
          backgroundColor={backgroundColor}
          height={height ?? (fullScreen ? '100%' : undefined)}
          isOpen={isModalOpen}
          mx={mx}
          my="$none"
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          gap={gap}
          zIndex={zIndex}
          hideHandlebar={hideHandlebar}
          $sm={{
            p: padding ?? '$spacing12',
            ...(isWebApp && {
              '$platform-web': {
                height: height ?? 'max-content',
                maxHeight: `calc(100dvh - ${INTERFACE_NAV_HEIGHT}px)`,
              },
            }),
          }}
          p={padding ?? '$spacing24'}
          px={paddingX}
          py={paddingY}
          pt={pt}
          pb={pb}
          flex={flex}
          onClose={isDismissible ? onClose : undefined}
        >
          {/*
            To keep this consistent with how the `Modal` works on native mobile, we only mount the children when the modal is open.
            It is critical for the modal to work this way or else it breaks existing assumptions throughout our codebase about when components are mounted / unmounted.
          */}
          {fullyClosed ? null : children}
        </ModalComponent>
      )}
    </Trace>
  )
}
