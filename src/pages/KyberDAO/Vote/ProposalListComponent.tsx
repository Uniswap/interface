import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import React, { useMemo, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Info } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { css } from 'styled-components'

import FAQIcon from 'components/Icons/FAQIcon'
import ForumIcon from 'components/Icons/ForumIcon'
import History from 'components/Icons/History'
import AnimateLoader from 'components/Loader/AnimatedLoader'
import { RowBetween, RowFit } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail, ProposalStatus } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import YourTransactionsModal from '../StakeKNC/YourTransactionsModal'
import ProposalItem from './ProposalItem'
import SearchProposal from './SearchProposal'
import SelectProposalStatus from './SelectProposalStatus'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  margin-top: 10px;
`

const TextButton = styled.a`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  cursor: pointer;
  ${({ theme }) => css`
    color: ${theme.subText};
    :hover {
      color: ${lighten(0.2, theme.primary)} !important;
    }
  `}
`
const HistoryButton = styled(RowFit)`
  justify-content: flex-end;
  gap: 4px;
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  :hover {
    color: ${({ theme }) => lighten(0.2, theme.primary)};
  }
`

function ProposalListComponent({
  voteCallback,
}: {
  voteCallback?: (proposal_id: number, option: number) => Promise<boolean>
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { proposals } = useVotingInfo()
  const [status, setStatus] = useState<string | undefined>()
  const [search, setSearch] = useState<string | undefined>()
  const filteredProposals = useMemo(
    () =>
      proposals
        ?.filter(p => {
          if (!!status) {
            return p.status === status
          }
          if (!!search) {
            return p.title.toLowerCase().includes(search.toLowerCase())
          }
          return true
        })
        .sort((a, b) => b.proposal_id - a.proposal_id)
        .sort((a, b) => {
          if (a.status === ProposalStatus.Active) return -1
          if (b.status === ProposalStatus.Active) return 1
          return 0
        }) || [],
    [proposals, status, search],
  )
  const toggleYourTransactions = useToggleModal(ApplicationModal.YOUR_TRANSACTIONS_STAKE_KNC)

  return (
    <Wrapper>
      <RowBetween marginBottom={'10px'}>
        <Flex>
          <Text color={theme.primary} fontSize={20}>
            <Trans>KIPs</Trans>
          </Text>
        </Flex>
        <Flex style={{ gap: '30px' }}>
          {account && (
            <HistoryButton onClick={toggleYourTransactions}>
              <History />
              <Text fontSize={14} hidden={isMobile}>
                {' '}
                <Trans>History</Trans>
              </Text>
            </HistoryButton>
          )}
          <TextButton href="https://gov.kyber.org/" target="_blank" rel="noreferrer">
            <ForumIcon />{' '}
            <Text hidden={isMobile}>
              <Trans>Forum</Trans>
            </Text>
          </TextButton>
          <TextButton
            href="https://docs.kyberswap.com/kyber-dao/kyber-dao-introduction"
            target="_blank"
            rel="noreferrer"
          >
            <FAQIcon />
            <Text hidden={isMobile}>
              <Trans>FAQ</Trans>
            </Text>
          </TextButton>
        </Flex>
      </RowBetween>
      <RowBetween>
        <SelectProposalStatus status={status} setStatus={setStatus} />
        <SearchProposal search={search} setSearch={setSearch} />
      </RowBetween>
      {proposals ? (
        filteredProposals.length > 0 ? (
          filteredProposals.map((p: ProposalDetail, index: number) => {
            return (
              <ProposalItem
                key={p.proposal_id.toString()}
                proposal={p}
                showByDefault={index === 0}
                onBadgeClick={setStatus}
                voteCallback={voteCallback}
              />
            )
          })
        ) : (
          <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            color={theme.subText}
            style={{ height: '200px', gap: '12px' }}
          >
            <Info size={24} color={theme.subText} />
            <Text color={theme.subText}>
              <Trans>No proposal found</Trans>
            </Text>
          </Flex>
        )
      ) : (
        <Flex
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          color={theme.subText}
          style={{ height: '200px', gap: '12px' }}
        >
          <AnimateLoader />
        </Flex>
      )}
      <YourTransactionsModal />
    </Wrapper>
  )
}

export default React.memo(ProposalListComponent)
