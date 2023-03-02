import { Trans } from '@lingui/macro'
import { BigNumber } from 'ethers'
import { useMemo, useState } from 'react'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import Gold from 'assets/svg/gold_icon.svg'
import Divider from 'components/Divider'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { useProposalInfoById } from 'hooks/kyberdao'
import { ProposalType, VoteDetail } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { getFullDisplayBalance } from 'utils/formatBalance'

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 20px;
  & > * {
    width: calc(25% - 20px * 3 / 4);
  }
  flex-wrap: wrap;

  ${({ theme }) => theme.mediaWidth.upToMedium`
     & > * {
      width: calc(33.33% - 20px * 2 / 3);
    }
  `}
  ${({ theme }) => theme.mediaWidth.upToSmall`
     & > * {
      width: calc(50% - 20px / 2);
    }
  `}
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     & > * {
      width: 100%;
    }
  `}
`
const OptionWrapper = styled.div<{ isWonOption?: boolean; hasHoverStyle?: boolean }>`
  border-radius: 20px;
  padding: 12px 16px;
  transition: all 0.1s ease;
  ${({ hasHoverStyle }) =>
    hasHoverStyle &&
    css`
      cursor: pointer;
      :hover {
        filter: brightness(1.2);
        box-shadow: 0 2px 5px 2px ${({ theme }) => theme.buttonBlack};
      }
    `}
  ${({ theme, isWonOption }) => css`
    border: 1px solid ${theme.border};
    background-color: ${theme.buttonBlack};
    ${isWonOption &&
    `background: linear-gradient(180deg, rgba(41, 41, 41, 0) 0%, rgba(41, 41, 41, 0.12) 54.69%, rgba(41, 41, 41, 0.7) 100%), linear-gradient(90deg, rgba(228, 181, 86, 0.25) 0%, rgba(241, 192, 94, 0.127155) 69.27%, rgba(255, 204, 102, 0) 100%);`}
  `}
`
const ParticipantWrapper = styled.div`
  height: 150px;
  overflow: auto;
  user-select: none;
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
     height: 130px;
  `}
`
const InfoRow = styled(RowBetween)`
  font-size: 12px;
  padding: 6px 0;
  & > * {
    flex: 1;
  }
  & > *:nth-child(2) {
    text-align: center;
  }
  & > *:last-child {
    text-align: right;
  }
`

const TableHeaderWrapper = styled(RowBetween)`
  & > * {
    flex: 1;
  }
  & > *:nth-child(2) {
    text-align: center;
  }
  & > *:last-child {
    text-align: right;
  }
`

const VotersListModal = ({
  isOpen,
  onDismiss,
  participants,
  isWonOption,
  sumPower,
  option,
}: {
  isOpen: boolean
  onDismiss: () => void
  participants: VoteDetail[]
  isWonOption: boolean
  sumPower: number | undefined
  option: string
}) => {
  const theme = useTheme()

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss}>
      <OptionWrapper isWonOption={isWonOption} style={{ width: '100%' }}>
        <RowBetween>
          <RowFit height={19}>
            {isWonOption && <img alt="gold-medal" src={Gold} style={{ marginRight: '8px' }} />}
            <Text style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{option}</Text>
          </RowFit>

          <Text style={{ paddingLeft: '10px', flexShrink: 0 }}>
            {sumPower ? Math.round(sumPower).toLocaleString() : '--'}
          </Text>
        </RowBetween>
        <Divider margin="10px 0" />
        <TableHeaderWrapper fontSize={12} color={theme.subText}>
          <Text>
            <Trans>Wallet</Trans>
          </Text>
          <Text>
            <Trans>Amount</Trans>
          </Text>
        </TableHeaderWrapper>
        <Divider margin="10px 0" />
        <ParticipantWrapper style={{ height: 'fit-content', maxHeight: '70vh', minHeight: '200px' }}>
          {participants.map(vote => {
            return (
              <InfoRow key={vote.staker}>
                <Text>{vote.staker_name || vote.staker}</Text>
                <Text color={theme.subText}>{vote.power}</Text>
              </InfoRow>
            )
          })}
        </ParticipantWrapper>
      </OptionWrapper>
    </Modal>
  )
}

export default function Participants({ proposalId }: { proposalId?: number }) {
  const { proposalInfo } = useProposalInfoById(proposalId)
  const theme = useTheme()
  const [modalIndex, setModalIndex] = useState<number | null>(null)

  const participants = useMemo(() => {
    if (!proposalInfo?.vote_stats?.votes) return
    return proposalInfo.vote_stats.votes
      .sort((a, b) => (BigNumber.from(a.power).sub(BigNumber.from(b.power)).gt(0) ? -1 : 1))
      .map(v => {
        return {
          ...v,
          staker: v.staker.slice(0, 9) + '...' + v.staker.slice(-4),
          power: Math.floor(parseFloat(getFullDisplayBalance(BigNumber.from(v.power), 18))).toLocaleString(),
        }
      })
  }, [proposalInfo])
  const options = proposalInfo?.options

  // flag to reduce fontsize when contents are too long
  const isLongText = useMemo(() => {
    if (!options) return false
    return options.some(o => o.length > 30)
  }, [options])

  return (
    <Wrapper>
      {options && participants
        ? options.map((o, index) => {
            const sumPower = proposalInfo?.vote_stats.options.find(option => option.option === index)?.vote_count
            const isWonOption =
              proposalInfo?.proposal_type === ProposalType.BinaryProposal &&
              proposalInfo?.vote_stats?.options.reduce((max, o) => (o.vote_count > max.vote_count ? o : max)).option ===
                index
            const filteredParticipants = participants.filter(p => p.option === index)
            return (
              <OptionWrapper key={o} isWonOption={isWonOption} onClick={() => setModalIndex(index)} hasHoverStyle>
                <RowBetween>
                  <RowFit height={19}>
                    {isWonOption && <img alt="gold-medal" src={Gold} style={{ marginRight: '8px' }} />}
                    <Text
                      fontSize={isLongText ? '14px' : '16px'}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {o}
                    </Text>
                  </RowFit>

                  <Text fontSize={isLongText ? '14px' : '16px'} style={{ paddingLeft: '10px', flexShrink: 0 }}>
                    {sumPower ? Math.round(sumPower).toLocaleString() : '--'}
                  </Text>
                </RowBetween>
                <Divider margin="10px 0" />
                <TableHeaderWrapper fontSize={12} color={theme.subText}>
                  <Text>
                    <Trans>Wallet</Trans>
                  </Text>
                  <Text>
                    <Trans>Amount</Trans>
                  </Text>
                </TableHeaderWrapper>
                <Divider margin="10px 0" />

                <ParticipantWrapper>
                  {filteredParticipants.slice(0, 5).map(vote => {
                    return (
                      <InfoRow key={vote.staker}>
                        <Text>{vote.staker_name || vote.staker}</Text>
                        <Text color={theme.subText}>{vote.power}</Text>
                      </InfoRow>
                    )
                  })}
                  {filteredParticipants.length > 5 && (
                    <Row justify="center" marginTop="4px">
                      <Text fontSize="12px" color={theme.primary}>
                        View more
                      </Text>
                    </Row>
                  )}
                </ParticipantWrapper>
                <VotersListModal
                  participants={filteredParticipants}
                  isOpen={index === modalIndex}
                  onDismiss={() => setModalIndex(null)}
                  isWonOption={isWonOption}
                  sumPower={sumPower}
                  option={o}
                />
              </OptionWrapper>
            )
          })
        : null}
    </Wrapper>
  )
}
