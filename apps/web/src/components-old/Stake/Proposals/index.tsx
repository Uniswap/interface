import { t } from 'i18n'
import { useProposals } from 'pages/Stake/hooks/romulus/useProposals'
import React, { useMemo, useState } from 'react'
import { Box } from 'rebass'
import { ButtonPrimary } from '../../Button'
import Loader from '../../Loader'
import Row from '../../Row'

import { ProposalCard } from './ProposalCard'

interface ProposalProps {
  onClickProposal: (url: string, isNewContract: boolean) => void
}

export const Proposals: React.FC<ProposalProps> = ({ onClickProposal }: ProposalProps) => {
  const [showMore, setShowMore] = useState<boolean>(false)
  const proposals = useProposals()
  const visibleProposals = useMemo(
    () =>
      proposals && proposals?.length > 1
        ? showMore
          ? proposals.slice(1).reverse()
          : proposals.slice(-3).reverse()
        : undefined,
    [proposals, showMore]
  )

  const showProposal = (url: string, isNewContract: boolean) => {
    onClickProposal(url, isNewContract)
  }

  return (
    <>
      {visibleProposals ? (
        <>
          {visibleProposals.map((proposalEvent, idx) => (
            <Box
              my={2}
              key={idx}
              onClick={() => showProposal(proposalEvent.args.id.toString(), proposalEvent.blockNumber > 25_000_000)}
            >
              <ProposalCard proposalEvent={proposalEvent} clickable={true} showId={true} showAuthor={false} />
            </Box>
          ))}
          <ButtonPrimary padding="6px" borderRadius="12px" fontSize={14} mt={3} onClick={() => setShowMore(!showMore)}>
            {showMore ? t`Show Less` : t`Show More`}
          </ButtonPrimary>
        </>
      ) : (
        <Row justify="center" mt={2}>
          <Loader size="48px"></Loader>
        </Row>
      )}
    </>
  )
}
