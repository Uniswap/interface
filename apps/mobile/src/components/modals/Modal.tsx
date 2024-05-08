import { Modal as BaseModal, ModalProps, StyleSheet, View } from 'react-native'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { Flex, FlexProps, Text, TouchableArea } from 'ui/src'

interface Props extends ModalProps {
  position?: 'top' | 'center' | 'bottom'
  title?: string
  hide?: () => void
  dismissable?: boolean
  showCloseButton?: boolean
  width?: number | '100%'
  dimBackground?: boolean
}

// TODO: [MOB-197] excluding some props here due to bug with React Native's Modal and reanimated
// May be resolved after upgrading reanimated to latest but uncertain
// https://github.com/facebook/react-native/issues/32329
export function Modal({
  animationType = 'none',
  visible,
  hide,
  showCloseButton,
  title,
  position,
  width,
  dimBackground,
  children,
  dismissable = true,
  transparent = true,
  presentationStyle = 'overFullScreen',
}: // ...rest (TODO above)
Props): JSX.Element {
  let justifyContent: FlexProps['justifyContent'] = 'center'
  if (position === 'top') {
    justifyContent = 'flex-start'
  }
  if (position === 'bottom') {
    justifyContent = 'flex-end'
  }

  return (
    <BaseModal
      animationType={animationType}
      presentationStyle={presentationStyle}
      transparent={transparent} /* {...rest} */
      visible={visible}>
      <TouchableArea
        alignItems="center"
        flexGrow={1}
        justifyContent={justifyContent}
        style={dimBackground && style.bgDimmed}
        onPress={dismissable ? hide : undefined}>
        <Flex
          backgroundColor="$surface1"
          style={width === '100%' ? style.modalBoxFullWidth : style.modalBox}
          width={width}>
          {title && (
            <Text mb="$spacing12" px="$spacing16" variant="heading3">
              {title}
            </Text>
          )}
          {hide && showCloseButton && (
            <View style={style.closeButtonContainer}>
              <CloseButton size={14} onPress={hide} />
            </View>
          )}
          {children}
        </Flex>
      </TouchableArea>
    </BaseModal>
  )
}

const modalBoxBaseStyle = StyleSheet.create({
  base: {
    alignItems: 'center',
    borderRadius: 15,
    elevation: 5,
    margin: 20,
    padding: 20,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      height: 2,
      width: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
})

const style = StyleSheet.create({
  bgDimmed: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeButtonContainer: {
    position: 'absolute',
    right: 20,
    top: 20,
  },
  modalBox: modalBoxBaseStyle.base,
  modalBoxFullWidth: {
    ...modalBoxBaseStyle.base,
    margin: 0,
    padding: 0,
  },
})
