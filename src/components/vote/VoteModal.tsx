import { Trans } from '@lingui/macro'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import { useContext, useState } from 'react'
import { ArrowUpCircle, X } from 'react-feather'
import styled, { ThemeContext } from 'styled-components/macro'
import { formatCurrencyAmount } from 'utils/formatCurrencyAmount'

import Circle from '../../assets/images/blue-loader.svg'
import { useUserVotes, useVoteCallback } from '../../state/governance/hooks'
import { VoteOption } from '../../state/governance/types'
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

interface VoteModalProps {
  isOpen: boolean
  onDismiss: () => void
  voteOption: VoteOption | undefined
  proposalId: string | undefined // id for the proposal to vote on
}

export default function VoteModal({ isOpen, onDismiss, proposalId, voteOption }: VoteModalProps) {
  const { chainId } = useActiveWeb3React()
  const { voteCallback } = useVoteCallback()
  const { votes: availableVotes } = useUserVotes()

  // monitor call to help UI loading state
  const [hash, setHash] = useState<string | undefined>()
  const [attempting, setAttempting] = useState<boolean>(false)

  // get theme for colors
  const theme = useContext(ThemeContext)

  // wrapper to reset state on modal close
  function wrappedOndismiss() {
    setHash(undefined)
    setAttempting(false)
    onDismiss()
  }

  async function onVote() {
    setAttempting(true)

    // if callback not returned properly ignore
    if (!voteCallback || voteOption === undefined) return

    // try delegation and store hash
    const hash = await voteCallback(proposalId, voteOption)?.catch((error) => {
      setAttempting(false)
      console.log(error)
    })

    if (hash) {
      setHash(hash)
    }
  }

  return (
    <Modal isOpen={isOpen} onDismiss={wrappedOndismiss} maxHeight={90}>
      {!attempting && !hash && (
        <ContentWrapper gap="lg">
          <AutoColumn gap="lg" justify="center">
            <RowBetween>
              <ThemedText.MediumHeader fontWeight={500}>
                {voteOption === VoteOption.Against ? (
                  <Trans>Vote against proposal {proposalId}</Trans>
                ) : voteOption === VoteOption.For ? (
                  <Trans>Vote for proposal {proposalId}</Trans>
                ) : (
                  <Trans>Vote to abstain on proposal {proposalId}</Trans>
                )}
              </ThemedText.MediumHeader>
              <StyledClosed stroke="black" onClick={wrappedOndismiss} />
            </RowBetween>
            <ThemedText.LargeHeader>
              <Trans>{formatCurrencyAmount(availableVotes, 4)} Votes</Trans>
            </ThemedText.LargeHeader>
            <ButtonPrimary onClick={onVote}>
              <ThemedText.MediumHeader color="white">
                {voteOption === VoteOption.Against ? (
                  <Trans>Vote against proposal {proposalId}</Trans>
                ) : voteOption === VoteOption.For ? (
                  <Trans>Vote for proposal {proposalId}</Trans>
                ) : (
                  <Trans>Vote to abstain on proposal {proposalId}</Trans>
                )}
              </ThemedText.MediumHeader>
            </ButtonPrimary>
          </AutoColumn>
        </ContentWrapper>
      )}
      {attempting && !hash && (
        <ConfirmOrLoadingWrapper>
          <RowBetween>
            <div />
            <StyledClosed onClick={wrappedOndismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <CustomLightSpinner src={Circle} alt="loader" size={'90px'} />
          </ConfirmedIcon>
          <AutoColumn gap="100px" justify={'center'}>
            <AutoColumn gap="12px" justify={'center'}>
              <ThemedText.LargeHeader>
                <Trans>Submitting Vote</Trans>
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
            <StyledClosed onClick={wrappedOndismiss} />
          </RowBetween>
          <ConfirmedIcon>
            <ArrowUpCircle strokeWidth={0.5} size={90} color={theme.primary1} />
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
