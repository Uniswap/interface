import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { UnsupportedChainIdError } from '@web3-react/core'
import { X } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Modal from 'components/Modal'
import { Z_INDEXS } from 'constants/styles'
import { useWeb3React } from 'hooks'
import { ApplicationModal } from 'state/application/actions'
import { useModalOpen, useNetworkModalToggle } from 'state/application/hooks'
import { TYPE } from 'theme'

import Networks from './Networks'

const Wrapper = styled.div`
  width: 100%;
  padding: 32px 24px 24px;
`

export default function NetworkModal({
  activeChainIds,
  selectedId,
  customOnSelectNetwork,
  isOpen,
  customToggleModal,
  disabledMsg,
}: {
  activeChainIds?: ChainId[]
  selectedId?: ChainId
  isOpen?: boolean
  customOnSelectNetwork?: (chainId: ChainId) => void
  customToggleModal?: () => void
  disabledMsg?: string
}): JSX.Element | null {
  const { error } = useWeb3React()
  const isWrongNetwork = error instanceof UnsupportedChainIdError
  const networkModalOpen = useModalOpen(ApplicationModal.NETWORK)
  const toggleNetworkModalGlobal = useNetworkModalToggle()
  const toggleNetworkModal = customToggleModal || toggleNetworkModalGlobal
  return (
    <Modal
      isOpen={isOpen !== undefined ? isOpen : networkModalOpen}
      onDismiss={toggleNetworkModal}
      maxWidth={624}
      zindex={Z_INDEXS.MODAL}
    >
      <Wrapper>
        <Flex alignItems="center" justifyContent="space-between">
          <Text fontWeight="500" fontSize={20}>
            {isWrongNetwork ? <Trans>Wrong Chain</Trans> : <Trans>Select a Chain</Trans>}
          </Text>

          <Flex sx={{ cursor: 'pointer' }} role="button" onClick={toggleNetworkModal}>
            <X />
          </Flex>
        </Flex>
        {isWrongNetwork && (
          <TYPE.main fontSize={16} marginTop={14}>
            <Trans>Please connect to the appropriate chain.</Trans>
          </TYPE.main>
        )}
        <Networks
          onChangedNetwork={toggleNetworkModal}
          selectedId={selectedId}
          activeChainIds={activeChainIds}
          customOnSelectNetwork={customOnSelectNetwork}
          customToggleModal={customToggleModal}
          disabledMsg={disabledMsg}
        />
      </Wrapper>
    </Modal>
  )
}
