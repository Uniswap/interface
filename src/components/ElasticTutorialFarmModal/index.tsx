import React from 'react'
import Modal, { ModalProps } from 'components/Modal'
import styled from 'styled-components'
import { Trans } from '@lingui/macro'
import { ButtonEmpty } from 'components/Button'
import { X } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { Flex, Text } from 'rebass'
import { ExternalLink } from 'theme'

const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 20px;
  background-color: ${({ theme }) => theme.background};
`

function ElasticTutorialFarmModal(props: ModalProps) {
  const theme = useTheme()
  return (
    <Modal {...props} maxWidth="808px" maxHeight={80} minHeight={50}>
      <ModalContentWrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontWeight="500">
            <Trans>Elastic Farms Tutorial</Trans>
          </Text>

          <ButtonEmpty onClick={props.onDismiss} width="36px" height="36px" padding="0">
            <X color={theme.text} />
          </ButtonEmpty>
        </Flex>
        <Text color={theme.subText} fontSize={12} marginTop="24px" marginBottom="16px">
          <Trans>
            To learn more about KyberSwap Elastic Farming, view{' '}
            <ExternalLink href="https://docs.kyberswap.com/guides/how-to-farm"> here</ExternalLink>
          </Trans>
        </Text>
        <iframe
          width="100%"
          height="100%"
          src="https://www.youtube.com/embed/moSUtCxQdfA"
          title="KyberSwap: Elastic Farm Tutorial"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </ModalContentWrapper>
    </Modal>
  )
}

export default ElasticTutorialFarmModal
