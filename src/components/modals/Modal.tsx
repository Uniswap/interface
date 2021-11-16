import React from 'react'
import { Modal as BaseModal, ModalProps, StyleSheet, View } from 'react-native'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'

interface Props extends ModalProps {
  title: string
  hide?: () => void
}

export function Modal(props: React.PropsWithChildren<Props>) {
  const { title, hide, children, ...rest } = props
  return (
    <BaseModal
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen"
      {...rest}>
      <CenterBox flexGrow={1}>
        <Box style={style.modalBox} backgroundColor="mainBackground">
          <Text variant="h3" px="md" mb="sm">
            {title}
          </Text>
          {hide && (
            <View style={style.closeButtonContainer}>
              <CloseButton onPress={hide} size={14} />
            </View>
          )}
          {children}
        </Box>
      </CenterBox>
    </BaseModal>
  )
}

const style = StyleSheet.create({
  modalBox: {
    position: 'relative',
    margin: 20,
    borderRadius: 20,
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
  closeButtonContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
})
