import React from 'react'
import { Modal as BaseModal, ModalProps, StyleSheet } from 'react-native'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
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
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" mb="md">
            <Text px="md">{title}</Text>
            {hide && <PrimaryButton label="Close" onPress={hide} />}
          </Box>
          {children}
        </Box>
      </CenterBox>
    </BaseModal>
  )
}

const style = StyleSheet.create({
  modalBox: {
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
})
