import React, { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { BottomSheetDetachedModal } from 'src/components/modals/BottomSheetModal'
import { ModalName } from 'src/features/telemetry/constants'
import { Flex, Text } from 'ui/src'
import { dimensions } from 'ui/src/theme'
import { flex } from 'ui/src/theme/restyle'

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

  const { header, closeButtonLabel = t('Cancel'), options, onClose } = props

  return (
    <Flex gap="$spacing12" justifyContent="flex-end">
      <Flex centered bg="$surface2" borderRadius="$rounded16" gap="$none" overflow="hidden">
        {typeof header === 'string' ? (
          <Flex centered gap="$spacing4" py="$spacing16">
            <Text variant="buttonLabelMedium">{header}</Text>
          </Flex>
        ) : (
          header
        )}

        <Flex gap="$none" maxHeight={dimensions.fullHeight * 0.5} width="100%">
          <ScrollView bounces={false} style={flex.grow}>
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
            <Text color="$neutral1" variant="buttonLabelMedium">
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
