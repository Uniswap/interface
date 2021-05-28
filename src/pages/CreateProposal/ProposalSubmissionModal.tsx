import React, { useContext } from 'react'
import { ThemeContext } from 'styled-components'
import { ChainId } from '@uniswap/sdk-core'
import { Text } from 'rebass'
import { ExternalLink, TYPE } from 'theme'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

export const ProposalSubmissionModal = ({
  isOpen,
  hash,
  chainId,
  onDismiss,
}: {
  isOpen: boolean
  hash: string | undefined
  chainId: ChainId | undefined
  onDismiss: () => void
}) => {
  const theme = useContext(ThemeContext)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      {!hash ? (
        <LoadingView onDismiss={onDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TYPE.largeHeader>Submitting Proposal</TYPE.largeHeader>
          </AutoColumn>
        </LoadingView>
      ) : (
        <SubmittedView onDismiss={onDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <Text fontWeight={500} fontSize={20} textAlign="center">
              Proposal Submitted
            </Text>
            {chainId && hash && (
              <ExternalLink href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}>
                <Text fontWeight={500} fontSize={14} color={theme.primary1}>
                  View on Etherscan
                </Text>
              </ExternalLink>
            )}
            <ButtonPrimary onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
              <Text fontWeight={500} fontSize={20}>
                Return
              </Text>
            </ButtonPrimary>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
