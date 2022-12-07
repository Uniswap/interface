import { Trans } from '@lingui/macro'
import { darken } from 'polished'
import { X } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useToggleEthPowAckModal } from 'state/application/hooks'
import { useUrlOnEthPowAck } from 'state/pools/hooks'

const AckButton = styled(ButtonPrimary)`
  height: 36px;
  background-color: ${({ theme }) => theme.warning};
  color: ${({ theme }) => theme.textReverse};
  &:hover {
    background-color: ${({ theme }) => darken(0.05, theme.warning)};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => darken(0.1, theme.warning)};
    background-color: ${({ theme }) => darken(0.1, theme.warning)};
  }
  &:disabled {
    background-color: ${({ theme, altDisabledStyle }) => (altDisabledStyle ? theme.warning : theme.buttonGray)};
    cursor: not-allowed;
    box-shadow: none;
    border: 1px solid transparent;
    outline: none;
  }
`

const ModalEthPoWAck = () => {
  const theme = useTheme()
  const isModalOpen = useModalOpen(ApplicationModal.ETH_POW_ACK)
  const toggleOpenThisModal = useToggleEthPowAckModal()
  const navigate = useNavigate()
  const [url] = useUrlOnEthPowAck()

  return (
    <Modal
      isOpen={isModalOpen}
      onDismiss={toggleOpenThisModal}
      maxWidth="calc(100vw - 32px)"
      width="fit-content"
      height="fit-content"
    >
      <Flex
        width="100%"
        maxWidth="360px"
        flexDirection="column"
        sx={{
          padding: '24px',
          justifyContent: 'center',
          gap: '24px',
        }}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <Text fontWeight={500} color={theme.warning}>
            <Text
              as="span"
              role="img"
              aria-label="warning"
              sx={{
                marginRight: '4px',
              }}
            >
              ⚠️
            </Text>
            <Text as="span">
              <Trans>Warning</Trans>
            </Text>
          </Text>
          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleOpenThisModal}>
            <X size={20} color={theme.subText} />
          </Flex>
        </Flex>

        <Text as="span" fontSize="14px">
          <Trans>We don&apos;t recommend you create a pool and add liquidity on Ethereum PoW</Trans>
        </Text>
        <AckButton
          onClick={() => {
            toggleOpenThisModal()
            navigate(url)
          }}
        >
          <Trans>Acknowledge</Trans>
        </AckButton>
      </Flex>
    </Modal>
  )
}

export default ModalEthPoWAck
