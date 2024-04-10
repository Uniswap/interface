import { ImpactFeedbackStyle } from 'expo-haptics'
import { PropsWithChildren, useMemo, useRef, useState } from 'react'
import { Keyboard, Platform, ScrollView, View } from 'react-native'
import {
  AnimatePresence,
  Flex,
  FlexProps,
  Portal,
  TouchableArea,
  styled,
  useDeviceDimensions,
  useDeviceInsets,
  useIsDarkMode,
} from 'ui/src'
import { spacing, zIndices } from 'ui/src/theme'
import { BaseCard } from 'wallet/src/components/BaseCard/BaseCard'
import { MenuItemProp } from 'wallet/src/components/modals/ActionSheetModal'

const DEFAULT_MIN_WIDTH = 225

type LayoutMeasurements = {
  x: number
  y: number
  width: number
  height: number
}

type DropdownState = {
  isOpen: boolean
  toggleMeasurements: LayoutMeasurements | null
}

type ActionSheetDropdownProps = PropsWithChildren<{
  options: MenuItemProp[]
  alignment?: 'left' | 'right'
  backdropOpacity?: number
}>

export function ActionSheetDropdown({
  children,
  backdropOpacity,
  ...contentProps
}: ActionSheetDropdownProps): JSX.Element {
  const insets = useDeviceInsets()
  const toggleRef = useRef<View>(null)
  const [{ isOpen, toggleMeasurements }, setState] = useState<DropdownState>({
    isOpen: false,
    toggleMeasurements: null,
  })

  const openDropdown = (): void => {
    Keyboard.dismiss()

    const containerNode = toggleRef.current

    if (containerNode) {
      containerNode.measureInWindow((x, y, width, height) => {
        setState({
          isOpen: true,
          toggleMeasurements: {
            x,
            y: y + (Platform.OS === 'android' ? insets.top : 0),
            width,
            height,
          },
        })
      })
    }
  }

  const closeDropdown = (): void => {
    setState({ isOpen: false, toggleMeasurements: null })
  }

  return (
    <>
      <TouchableArea
        hapticFeedback
        hapticStyle={ImpactFeedbackStyle.Light}
        py="$spacing8"
        onPress={openDropdown}>
        {/* collapsable property prevents removing view on Android. Without this property we were
        getting undefined in measureInWindow callback. (https://reactnative.dev/docs/view.html#collapsable-android) */}
        <View ref={toggleRef} collapsable={false} testID="dropdown-toggle">
          {children}
        </View>
      </TouchableArea>

      {/* This is the minimum zIndex to ensure that the dropdown is above the modal in the extension. */}
      <Portal zIndex={zIndices.overlay}>
        <AnimatePresence custom={{ isOpen }}>
          {isOpen && toggleMeasurements && (
            <>
              <Backdrop handleClose={closeDropdown} opacity={backdropOpacity} />
              <DropdownContent
                {...contentProps}
                handleClose={closeDropdown}
                toggleMeasurements={toggleMeasurements}
              />
            </>
          )}
        </AnimatePresence>
      </Portal>
    </>
  )
}

type DropdownContentProps = FlexProps & {
  options: MenuItemProp[]
  alignment?: 'left' | 'right'
  toggleMeasurements: LayoutMeasurements
  handleClose?: () => void
}

/**
 * AnimatePresence `custom` prop will update variants *as* the exit animation runs,
 * which otherwise is impossible. We want to make sure people can touch behind the dropdown
 * as its animating closed. With slow animations it can be especially annoying.
 */
const TouchableWhenOpen = styled(Flex, {
  variants: {
    isOpen: {
      true: {
        pointerEvents: 'auto',
      },
      false: {
        pointerEvents: 'none',
      },
    },
  },
})

function DropdownContent({
  options,
  alignment = 'left',
  toggleMeasurements,
  handleClose,
  ...rest
}: DropdownContentProps): JSX.Element {
  const [overflowsContainer, setOverflowsContainer] = useState(false)
  const { fullWidth, fullHeight } = useDeviceDimensions()

  const containerProps = useMemo<FlexProps>(() => {
    if (alignment === 'left') {
      return {
        left: toggleMeasurements.x,
        maxWidth: fullWidth - toggleMeasurements.x - spacing.spacing12,
      }
    }
    return {
      right: fullWidth - (toggleMeasurements.x + toggleMeasurements.width),
      maxWidth: toggleMeasurements.x + toggleMeasurements.width - spacing.spacing12,
    }
  }, [alignment, fullWidth, toggleMeasurements])

  const maxHeight =
    fullHeight - toggleMeasurements.y - toggleMeasurements.height - spacing.spacing12

  return (
    <TouchableWhenOpen
      animation={[
        'quicker',
        {
          opacity: {
            overshootClamping: true,
          },
        },
      ]}
      enterStyle={{
        opacity: 0,
        y: -5,
      }}
      exitStyle={{
        opacity: 0,
        y: 5,
      }}
      maxHeight={maxHeight}
      minWidth={DEFAULT_MIN_WIDTH}
      position="absolute"
      testID="dropdown-content"
      top={toggleMeasurements.y + toggleMeasurements.height}
      {...containerProps}>
      <BaseCard.Shadow backgroundColor="$surface2" p="$none" {...rest}>
        <ScrollView
          contentContainerStyle={{
            padding: spacing.spacing8,
          }}
          scrollEnabled={overflowsContainer}
          showsVerticalScrollIndicator={false}>
          <Flex
            onLayout={({
              nativeEvent: {
                layout: { height },
              },
            }) => {
              setOverflowsContainer(height > maxHeight)
            }}>
            {options.map(({ key, onPress, render }: MenuItemProp) => (
              <TouchableArea
                key={key}
                hapticFeedback
                testID={key}
                onPress={() => {
                  onPress()
                  handleClose?.()
                }}>
                {render()}
              </TouchableArea>
            ))}
          </Flex>
        </ScrollView>
      </BaseCard.Shadow>
    </TouchableWhenOpen>
  )
}

type BackdropProps = {
  opacity?: number
  handleClose?: () => void
}

function Backdrop({ handleClose, opacity: opacityProp }: BackdropProps): JSX.Element {
  const isDarkMode = useIsDarkMode()

  const opacity = opacityProp ?? (isDarkMode ? 0.4 : 0.2)

  return (
    <TouchableWhenOpen
      animation="100ms"
      backgroundColor="$sporeBlack"
      enterStyle={{
        opacity: 0,
      }}
      exitStyle={{
        opacity: 0,
      }}
      flex={1}
      inset={0}
      opacity={opacity}
      position="absolute"
      testID="dropdown-backdrop"
      onPress={handleClose}
    />
  )
}
