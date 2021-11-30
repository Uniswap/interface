import { Trans } from '@lingui/macro'
import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Modal from 'components/Modal'
import { LoadingView, SubmittedView } from 'components/ModalViews'
import React, { useContext } from 'react'
import { Link } from 'react-router-dom'
import { Text as RebassText } from 'rebass'
import { ThemeContext } from 'styled-components/macro'
import { ExternalLink, TextPreset } from 'theme'
import { ExplorerDataType, getExplorerLink } from 'utils/getExplorerLink'

export const ProposalSubmissionModal = ({
  isOpen,
  hash,
  onDismiss,
}: {
  isOpen: boolean
  hash: string | undefined
  onDismiss: () => void
}) => {
  const theme = useContext(ThemeContext)

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      {!hash ? (
        <LoadingView onDismiss={onDismiss}>
          <AutoColumn gap="12px" justify={'center'}>
            <TextPreset.LargeHeader>
              <Trans>Submitting Proposal</Trans>
            </TextPreset.LargeHeader>
          </AutoColumn>
        </LoadingView>
      ) : (
        <SubmittedView onDismiss={onDismiss} hash={hash}>
          <AutoColumn gap="12px" justify={'center'}>
            <RebassText fontWeight={500} fontSize={20} textAlign="center">
              <Trans>Proposal Submitted</Trans>
            </RebassText>
            {hash && (
              <ExternalLink href={getExplorerLink(1, hash, ExplorerDataType.TRANSACTION)}>
                <RebassText fontWeight={500} fontSize={14} color={theme.primary1}>
                  <Trans>View on Etherscan</Trans>
                </RebassText>
              </ExternalLink>
            )}
            <ButtonPrimary as={Link} to="/vote" onClick={onDismiss} style={{ margin: '20px 0 0 0' }}>
              <RebassText fontWeight={500} fontSize={20}>
                <Trans>Return</Trans>
              </RebassText>
            </ButtonPrimary>
          </AutoColumn>
        </SubmittedView>
      )}
    </Modal>
  )
}
