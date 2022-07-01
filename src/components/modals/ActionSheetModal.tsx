import { selectionAsync } from 'expo-haptics'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'

export interface MenuItemProp {
  key: string
  onPress: () => void
  render: () => ReactNode
}

interface ActionSheetModalContentProps {
  closeButtonLabel?: string
  onClose: () => void
  options: MenuItemProp[]
  header?: ReactNode | string
}

export function ActionSheetModalContent(props: ActionSheetModalContentProps) {
  const { t } = useTranslation()

  const { header, closeButtonLabel = t('Cancel'), options, onClose } = props

  return (
    <Flex justifyContent="flex-end">
      <Flex centered bg="backgroundSurface" borderRadius="lg" gap="none" overflow="hidden">
        {typeof header === 'string' ? (
          <Flex centered gap="xxs" py="md">
            <Text variant="mediumLabel">{header}</Text>
          </Flex>
        ) : (
          header
        )}

        <Flex gap="none" maxHeight={dimensions.fullHeight * 0.5} width="100%">
          <ScrollView style={flex.grow}>
            {options.map(({ key, onPress, render }) => {
              return (
                <Button
                  key={key}
                  name={key}
                  onPress={() => {
                    selectionAsync()
                    onPress()
                  }}>
                  {render()}
                </Button>
              )
            })}
          </ScrollView>
        </Flex>
      </Flex>
      <Button
        onPress={() => {
          selectionAsync()
          onClose()
        }}>
        <Flex centered bg="backgroundSurface" borderRadius="lg" py="md">
          <Text color="textPrimary" variant="subhead">
            {closeButtonLabel}
          </Text>
        </Flex>
      </Button>
    </Flex>
  )
}

interface ActionSheetModalProps extends ActionSheetModalContentProps {
  isVisible: boolean
  name: ModalName
}

export function ActionSheetModal({ isVisible, onClose, ...rest }: ActionSheetModalProps) {
  return (
    <BottomSheetDetachedModal
      hideHandlebar
      backgroundColor="transparent"
      isVisible={isVisible}
      name={ModalName.NetworkSelector}
      onClose={onClose}>
      <ActionSheetModalContent onClose={onClose} {...rest} />
    </BottomSheetDetachedModal>
  )
}
