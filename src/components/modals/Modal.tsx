import { ResponsiveValue } from '@shopify/restyle'
import React from 'react'
import { Modal as BaseModal, ModalProps, StyleSheet, View } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

interface Props extends ModalProps {
  position?: 'top' | 'center' | 'bottom'
  title?: string
  hide?: () => void
  dismissable?: boolean
  showCloseButton?: boolean
  width?: number
  dimBackground?: boolean
}

// TODO excluding some props here due to bug with React Native's Modal and reanimated
// May be resolved after upgrading reanimated to latest but uncertain
// https://github.com/facebook/react-native/issues/32329
export function Modal({
  visible,
  hide,
  showCloseButton,
  title,
  position,
  width,
  dimBackground,
  children,
  dismissable = true,
}: // ...rest (TODO above)
React.PropsWithChildren<Props>) {
  let justifyContent: ResponsiveValue<'center' | 'flex-start' | 'flex-end', Theme> = 'center'
  if (position === 'top') justifyContent = 'flex-start'
  if (position === 'bottom') justifyContent = 'flex-end'

  return (
    <BaseModal
      visible={visible}
      animationType="none"
      transparent={true}
      presentationStyle="overFullScreen" /* {...rest} */
    >
      <Button
        alignItems="center"
        justifyContent={justifyContent}
        flexGrow={1}
        style={dimBackground && style.bgDimmed}
        onPress={dismissable ? hide : undefined}>
        <Box style={style.modalBox} backgroundColor="mainBackground" width={width}>
          {title && (
            <Text variant="h3" px="md" mb="sm">
              {title}
            </Text>
          )}
          {hide && showCloseButton && (
            <View style={style.closeButtonContainer}>
              <CloseButton onPress={hide} size={14} />
            </View>
          )}
          {children}
        </Box>
      </Button>
    </BaseModal>
  )
}

const style = StyleSheet.create({
  modalBox: {
    position: 'relative',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  bgDimmed: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
})
