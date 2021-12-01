import { ResponsiveValue } from '@shopify/restyle'
import React from 'react'
import { Modal as BaseModal, ModalProps, StyleSheet, View } from 'react-native'
import { CloseButton } from 'src/components/buttons/CloseButton'
import { Box } from 'src/components/layout/Box'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

interface Props extends ModalProps {
  title: string
  hide?: () => void
  position?: 'top' | 'center' | 'bottom'
}

export function Modal({
  title,
  hide,
  children,
  position,
  ...rest
}: React.PropsWithChildren<Props>) {
  let justifyContent: ResponsiveValue<'center' | 'flex-start' | 'flex-end', Theme> = 'center'
  if (position === 'top') justifyContent = 'flex-start'
  if (position === 'bottom') justifyContent = 'flex-end'

  return (
    <BaseModal
      animationType="slide"
      transparent={true}
      presentationStyle="overFullScreen"
      {...rest}>
      <Box alignItems="center" justifyContent={justifyContent} flexGrow={1}>
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
      </Box>
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
