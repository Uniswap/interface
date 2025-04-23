import { memo, useCallback } from 'react'
import { ElementAfterText, Flex, TextProps, TouchableArea, TouchableAreaProps } from 'ui/src'
import useIsKeyboardOpen from 'uniswap/src/hooks/useIsKeyboardOpen'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard'
import { isInterface } from 'utilities/src/platform'

export interface OptionItemProps {
  image: JSX.Element
  title: string
  subtitle?: JSX.Element
  rightElement?: JSX.Element
  badge?: JSX.Element
  titleProps?: TextProps
  onPress: () => void
  onLongPress?: TouchableAreaProps['onLongPress']
  disabled?: boolean
  testID?: string
  modalInfo?: {
    modal: JSX.Element
    modalShouldShow: boolean
    modalSetIsOpen: (isOpen: boolean) => void
  }
}

function _OptionItem({
  image,
  title,
  subtitle,
  rightElement,
  badge,
  titleProps,
  onPress,
  onLongPress,
  disabled,
  testID,
  modalInfo,
}: OptionItemProps): JSX.Element {
  const isKeyboardOpen = useIsKeyboardOpen()

  const { modal, modalShouldShow, modalSetIsOpen } = modalInfo ?? {}

  const onPressOption = useCallback(() => {
    const handleShowModal = (): void => {
      dismissNativeKeyboard()
      modalSetIsOpen?.(true)
    }

    if (modalShouldShow && modal) {
      // On mobile web we need to wait for the keyboard to hide
      // before showing the modal to avoid height issues
      if (isKeyboardOpen && isInterface) {
        const activeElement = document.activeElement as HTMLElement | null
        activeElement?.blur()
        setTimeout(handleShowModal, 700)
      } else {
        handleShowModal()
      }
      return
    }

    onPress()
  }, [modalShouldShow, modal, isKeyboardOpen, modalSetIsOpen, onPress])

  return (
    <>
      <TouchableArea
        animation="300ms"
        hoverStyle={{ backgroundColor: '$surface1Hovered' }}
        opacity={disabled ? 0.5 : 1}
        width="100%"
        onPress={onPressOption}
        onLongPress={onLongPress}
      >
        <Flex
          row
          alignItems="center"
          gap="$spacing8"
          justifyContent="space-between"
          px="$spacing16"
          py="$spacing12"
          style={{
            pointerEvents: 'auto',
          }}
          testID={testID}
        >
          <Flex row shrink alignItems="center" gap="$spacing12">
            {image}
            <Flex shrink>
              <ElementAfterText
                text={title}
                element={badge}
                textProps={{
                  variant: 'body1',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  ...titleProps,
                }}
                wrapperProps={{ gap: '$spacing8' }}
              />
              {subtitle}
            </Flex>
          </Flex>

          {rightElement && (
            <Flex grow alignItems="flex-end" justifyContent="center">
              {rightElement}
            </Flex>
          )}
        </Flex>
      </TouchableArea>

      {modal}
    </>
  )
}

export const OptionItem = memo(_OptionItem)
