import { isWebApp, isWebPlatform } from '@universe/environment'
import {
  Flex,
  type FlexCompatProps as FlexProps,
  type ModifierPressProps,
  Text,
  type TextCompatProps as TextProps,
} from '@universe/mycelium'
import { memo, ReactNode, useCallback } from 'react'
import { OptionItemPressableArea } from 'uniswap/src/components/lists/items/OptionItemPressableArea'
import { dismissNativeKeyboard } from 'utilities/src/device/keyboard/dismissNativeKeyboard'
import { KeyAction } from 'utilities/src/device/keyboard/types'
import { useIsKeyboardOpen } from 'utilities/src/device/keyboard/useIsKeyboardOpen'
import { useKeyDown } from 'utilities/src/device/keyboard/useKeyDown'
import { noop } from 'utilities/src/react/noop'

// Props for manually managing the focused row index of a list
// i.e. via keyboard ArrowUp/ArrowDown navigation
export interface FocusedRowControl {
  rowIndex: number // this item's row index
  focusedRowIndex: number | undefined // index of the list's focused row
  setFocusedRowIndex: (index: number | undefined) => void
}

export interface OptionItemProps extends ModifierPressProps {
  image: JSX.Element
  title: string | JSX.Element
  subtitle?: JSX.Element
  rightElement?: JSX.Element
  /** Persistent category pill (e.g. "Stocks") rendered before `rightElement`, independent of hover. */
  categoryTag?: ReactNode
  /** Rendered immediately after the title on the same baseline (e.g. a dimmed RWA issuer label). When present,
   *  the title shrinks/ellipsizes and the suffix holds its width. Absent → title renders exactly as before. */
  titleSuffix?: ReactNode
  badge?: JSX.Element
  titleProps?: TextProps
  onPress: () => void
  onLongPress?: () => void
  disabled?: boolean
  testID?: string
  modalInfo?: {
    modal: JSX.Element
    modalShouldShow: boolean
    modalSetIsOpen: (isOpen: boolean) => void
  }
  focusedRowControl?: FocusedRowControl
}

function OptionItemInner({
  image,
  title,
  subtitle,
  rightElement,
  categoryTag,
  titleSuffix,
  badge,
  titleProps,
  onPress,
  onLongPress,
  disabled,
  testID,
  modalInfo,
  focusedRowControl,
  modifierPressHref,
  onModifierPress,
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
      if (isKeyboardOpen && isWebApp) {
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

  // Custom keyboard list nav behavior using arrow + enter keys
  const { focusedRowIndex, rowIndex, setFocusedRowIndex } = focusedRowControl ?? {}
  const keyboardNavEnabled = isWebPlatform && focusedRowControl && setFocusedRowIndex
  const isFocused = focusedRowIndex !== undefined && focusedRowIndex === rowIndex
  useKeyDown({
    keys: ['Enter'],
    keyAction: KeyAction.UP,
    disabled: !keyboardNavEnabled,
    callback: isFocused ? onPressOption : noop,
    shouldTriggerInInput: true,
  })
  const focusedStyleProps: FlexProps = keyboardNavEnabled
    ? {
        backgroundColor: isFocused ? '$surface1Hovered' : undefined,
        onMouseEnter: (): void => {
          setFocusedRowIndex(rowIndex)
        },
        onMouseLeave: (): void => {
          setFocusedRowIndex(undefined)
        },
      }
    : { hoverStyle: { backgroundColor: '$surface1Hovered' } }

  return (
    <>
      <OptionItemPressableArea
        disabled={disabled}
        modifierPressHref={modifierPressHref}
        onPress={onPressOption}
        onLongPress={onLongPress}
        onModifierPress={onModifierPress}
      >
        <Flex
          row
          alignItems="center"
          gap="$spacing8"
          justifyContent="space-between"
          p="$spacing8"
          style={{
            pointerEvents: 'auto',
          }}
          borderRadius="$rounded16"
          {...focusedStyleProps}
          testID={testID}
        >
          <Flex row shrink alignItems="center" gap="$spacing12">
            {image}
            <Flex shrink>
              <Flex row alignItems="center" gap="$spacing8">
                {titleSuffix ? (
                  <Flex row shrink alignItems="baseline" gap="$spacing6" minWidth={0}>
                    {typeof title === 'string' ? (
                      <Text
                        color="$neutral1"
                        variant="body1"
                        whiteSpace="nowrap"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        numberOfLines={1}
                        flexShrink={1}
                        {...titleProps}
                      >
                        {title}
                      </Text>
                    ) : (
                      title
                    )}
                    {titleSuffix}
                  </Flex>
                ) : typeof title === 'string' ? (
                  <Text
                    color="$neutral1"
                    variant="body1"
                    whiteSpace="nowrap"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    numberOfLines={1}
                    flexShrink={1}
                    {...titleProps}
                  >
                    {title}
                  </Text>
                ) : (
                  title
                )}
                {badge}
              </Flex>
              {subtitle}
            </Flex>
          </Flex>

          {(categoryTag || rightElement) && (
            <Flex row grow alignItems="center" justifyContent="flex-end" gap="$spacing8">
              {categoryTag}
              {rightElement}
            </Flex>
          )}
        </Flex>
      </OptionItemPressableArea>

      {modal}
    </>
  )
}

export const OptionItem = memo(OptionItemInner)
