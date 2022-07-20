import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { useContext, useState } from 'react'
import { ArrowUpCircle, X } from 'react-feather'
import styled, { ThemeContext } from 'styled-components/macro'

import Circle from '../../assets/images/blue-loader.svg'
import { useQueueCallback } from '../../state/governance/hooks'
import { CustomLightSpinner, ThemedText } from '../../theme'
import { ExternalLink } from '../../theme'
import { ExplorerDataType, getExplorerLink } from '../../utils/getExplorerLink'
import { ButtonPrimary } from '../Button'
import { AutoColumn, ColumnCenter } from '../Column'
import Modal from '../Modal'
import { RowBetween } from '../Row'

const ContentWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 24px;
`

const StyledClosed = styled(X)`
  :hover {
    cursor: pointer;
  }
`

const ConfirmOrLoadingWrapper = styled.div`
  width: 100%;
  padding: 24px;
`

const ConfirmedIcon = styled(ColumnCenter)`
  padding: 60px 0;
`

interface QueueModalProps {
  isOpen: boolean
  onDismiss: () => void
  proposalId: string | undefined // id for the proposal to queue
}

export default function QueueModal({ isOpen, onDismiss, proposalId }: QueueModalProps) {
  const { chainId } = useWeb3React()
  const queueCallback = useQueueCallback()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState<boolean>(false)

  // get theme for colors
  const theme = useContext(ThemeContext)

  // wrapper to reset state on modal close
  function wrappedOnDismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onQueue() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!queueCallback) return

    // try delegation and store hash
    const hash = await queueCallback(proposalId)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOnDismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.MediumHeader fontWeight={500}>
                <Trans>Queue Proposal {proposalId}</Trans>
              </ThemedText.MediumHeader>
              <StyledClosed onClick={wrappedOnDismiss} />
            </RowBetween>
            <RowBetween>
              <ThemedText.Body>
                <Trans>Adding this proposal to the queue will allow it to be executed, after a delay.</Trans>
              </ThemedText.Body>
            </RowBetween>
            <ButtonPrimary onClick={onQueue}>
              <ThemedText.MediumHeader color="white">
                <Trans>Queue</Trans>
              </ThemedText.MediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <ConfirmOrLoadingWrapper>
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOnDismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
          </ConfirmedIcon>
          <AutoColumn gap="100px" justify={'center'}>
            <AutoColumn gap="12px" justify={'center'}>
              <ThemedText.LargeHeader>
                <Trans>Queueing</Trans>
              </ThemedText.LargeHeader>
            </AutoColumn>
            <ThemedText.SubHeader>
              <Trans>Confirm this transaction in your wallet</Trans>
            </ThemedText.SubHeader>
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
      {hash && (
        <ConfirmOrLoadingWrapper>
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOnDismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.deprecated_primary1} />
          </ConfirmedIcon>
          <AutoColumn gap="100px" justify={'center'}>
            <AutoColumn gap="12px" justify={'center'}>
              <ThemedText.LargeHeader>
                <Trans>Transaction Submitted</Trans>
              </ThemedText.LargeHeader>
            </AutoColumn>
            {chainId && (
              <ExternalLink
                href={getExplorerLink(chainId, hash, ExplorerDataType.TRANSACTION)}
                style={{ marginLeft: '4px' }}
              >
                <ThemedText.SubHeader>
                  <Trans>View transaction on Explorer</Trans>
                </ThemedText.SubHeader>
              </ExternalLink>
            )}
          </AutoColumn>
        </ConfirmOrLoadingWrapper>
      )}
    </Modal>
  )
}
