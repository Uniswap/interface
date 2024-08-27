import GetHelpButton from 'components/Button/GetHelp'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { ArrowLeft } from 'react-feather'
import { ClickableStyle, CloseIcon } from 'theme/components'
import { Flex } from 'ui/src'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'

const BackButton = styled(ArrowLeft)`
  color: ${({ theme }) => theme.neutral1};
  ${ClickableStyle};
`

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
      {goBack && <BackButton size={iconSizes.icon24} onClick={goBack} />}
      {title && (
        <Flex>
          <Text variant="body2">{title}</Text>
        </Flex>
      )}
      <Flex row fill justifyContent="flex-end" alignItems="center" gap="10px">
        <GetHelpButton url={link} />
        <CloseIcon data-testid={closeDataTestId} onClick={closeModal} />
      </Flex>
    </Flex>
  )
}
