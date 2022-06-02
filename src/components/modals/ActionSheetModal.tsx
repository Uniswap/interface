import { selectionAsync } from 'expo-haptics'
import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from 'src/components/buttons/Button'
import { Flex } from 'src/components/layout'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { ModalName } from 'src/features/telemetry/constants'

interface MenuItemProp {
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
    <Flex>
      <Flex centered bg="neutralSurface" borderRadius="lg" gap="none">
        {typeof header === 'string' ? (
          <Flex centered gap="xxs" py="md">
            <Text variant="mediumLabel">{header}</Text>
          </Flex>
        ) : (
          header
        )}
        <Flex gap="none" width="100%">
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
        </Flex>
      </Flex>
      <Button
        onPress={() => {
          selectionAsync()
          onClose()
        }}>
        <Flex centered bg="neutralSurface" borderRadius="lg" py="md">
          <Text color="neutralTextPrimary" variant="subHead1">
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

export function ActionSheetModal({ isVisible, ...rest }: ActionSheetModalProps) {
  return (
    <BottomSheetDetachedModal
      hideHandlebar
      backgroundColor="transparent"
      isVisible={isVisible}
      name={ModalName.NetworkSelector}
      onClose={rest.onClose}>
      <ActionSheetModalContent {...rest} />
    </BottomSheetDetachedModal>
  )
}
