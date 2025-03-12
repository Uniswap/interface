import { EnvelopeHeartIcon } from 'components/Icons/EnvelopeHeart'
import Row from 'components/deprecated/Row'
import styled from 'lib/styled-components'
import { ReactNode } from 'react'
import { Trans } from 'react-i18next'
import { ExternalLink } from 'theme/components'
import { Flex, ModalCloseIcon, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { Text } from 'ui/src/components/text/Text'
import { iconSizes } from 'ui/src/theme'
import { uniswapUrls } from 'uniswap/src/constants/urls'

const StyledExternalLink = styled(ExternalLink)`
  width: fit-content;
  border-radius: 16px;
  padding: 4px 8px;
  font-size: 14px;
  font-weight: 485;
  line-height: 20px;
  background: ${({ theme }) => theme.surface2};
  color: ${({ theme }) => theme.neutral2};
  :hover {
    background: ${({ theme }) => theme.surface3};
    color: ${({ theme }) => theme.neutral1};
    path {
      fill: ${({ theme }) => theme.neutral1};
    }
    opacity: unset;
  }
  stroke: none;
`

function GetHelpButton({ url }: { url?: string }) {
  return (
    <StyledExternalLink href={url ?? uniswapUrls.helpUrl}>
      <Row gap="4px">
        <EnvelopeHeartIcon />
        <Trans i18nKey="common.getHelp.button" />
      </Row>
    </StyledExternalLink>
  )
}

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
