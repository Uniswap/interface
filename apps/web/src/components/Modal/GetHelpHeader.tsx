import GetHelpButton from 'components/Button/GetHelp'
import { ReactNode } from 'react'
import { Flex, ModalCloseIcon, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'

interface GetHelpHeaderProps {
  closeModal: () => void
  link?: string
  title?: ReactNode
  goBack?: () => void
  closeDataTestId?: string
  className?: string
}

export function GetHelpHeader({ title, goBack, link, closeModal, closeDataTestId, className }: GetHelpHeaderProps) {
  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing4" width="100%" className={className}>
      {goBack && (
        <TouchableArea onPress={goBack}>
          <BackArrow size={iconSizes.icon24} color="$neutral2" hoverColor="$neutral2Hovered" />
        </TouchableArea>
      )}
      {title && (
        <Flex>
          <Text variant="body2">{title}</Text>
        </Flex>
      )}
      <Flex row fill justifyContent="flex-end" alignItems="center" gap="10px">
        <GetHelpButton url={link} />
        <ModalCloseIcon testId={closeDataTestId} onClose={closeModal} />
      </Flex>
    </Flex>
  )
}
