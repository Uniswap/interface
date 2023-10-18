import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { ModalName } from 'src/features/telemetry/constants'
import { Flex, flexStyles, Text, TouchableArea, useDeviceDimensions } from 'ui/src'

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

export function ActionSheetModalContent(props: ActionSheetModalContentProps): JSX.Element {
  const { t } = useTranslation()
  const { fullHeight } = useDeviceDimensions()

  const { header, closeButtonLabel = t('Cancel'), options, onClose } = props

  return (
    <Flex gap="$spacing12" justifyContent="flex-end">
      <Flex centered bg="$surface2" borderRadius="$rounded16" overflow="hidden">
        {typeof header === 'string' ? (
          <Flex centered gap="$spacing4" py="$spacing16">
            <Text variant="buttonLabel2">{header}</Text>
          </Flex>
        ) : (
          header
        )}

        <Flex maxHeight={fullHeight * 0.5} width="100%">
          <ScrollView bounces={false} style={flexStyles.grow}>
            {options.map(({ key, onPress, render }) => {
              return (
                <TouchableArea key={key} hapticFeedback testID={key} onPress={onPress}>
                  {render()}
                </TouchableArea>
              )
            })}
          </ScrollView>
        </Flex>
      </Flex>
      <Flex bg="$surface2" borderRadius="$rounded12">
        <TouchableArea hapticFeedback onPress={onClose}>
          <Flex centered bg="$surface2" borderRadius="$rounded12" py="$spacing16">
            <Text color="$neutral1" variant="buttonLabel2">
              {closeButtonLabel}
            </Text>
          </Flex>
        </TouchableArea>
      </Flex>
    </Flex>
  )
}

interface ActionSheetModalProps extends ActionSheetModalContentProps {
  isVisible: boolean
  name: ModalName
}

export function ActionSheetModal({
  isVisible,
  onClose,
  name,
  ...rest
}: ActionSheetModalProps): JSX.Element | null {
  if (!isVisible) return null

  return (
    <BottomSheetDetachedModal
      hideHandlebar
      backgroundColor="transparent"
      name={name}
      onClose={onClose}>
      <ActionSheetModalContent onClose={onClose} {...rest} />
    </BottomSheetDetachedModal>
  )
}
