import { Trans, t } from '@lingui/macro'
import dayjs from 'dayjs'
import { transparentize } from 'polished'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { ChevronDown } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import Column from 'components/Column'
import LaunchIcon from 'components/Icons/LaunchIcon'
import Row, { RowBetween, RowFit } from 'components/Row'
import { useActiveWeb3React } from 'hooks'
import { useVotingInfo } from 'hooks/kyberdao'
import { ProposalDetail, ProposalStatus, ProposalType } from 'hooks/kyberdao/types'
import useTheme from 'hooks/useTheme'
import { useSwitchToEthereum } from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import { useWalletModalToggle } from 'state/application/hooks'

import { readableTime } from '..'
import VoteConfirmModal from '../VoteConfirmModal'
import OptionButton from './OptionButton'
import Participants from './Participants'
import VoteInformation from './VoteInformation'

const ProposalItemWrapper = styled.div`
  content-visibility: auto;
  contain-intrinsic-size: 60px;
  padding: ${isMobile ? '16px' : '20px 24px'};
  border-radius: 20px;
  box-shadow: 0px 2px 34px rgba(0, 0, 0, 0.0467931);
  overflow: hidden;
  ${({ theme }) => css`
    background-color: ${theme.background};
  `}
`

const ProposalHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${isMobile ? '16px' : '20px'};
  z-index: 1;
  & > *:first-child {
    cursor: pointer;
  }
  ${({ theme }) => css`
    background-color: ${theme.background};
  `}
`

const ExpandButton = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 50%;
  ${({ theme }) => css`
    color: ${theme.subText};
    background-color: ${transparentize(0.8, theme.subText)};
  `}
`
const Badged = css`
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 12px;
  padding: 2px 14px;
`
const IDBadged = styled.div`
  ${Badged}
  color: ${({ theme }) => theme.subText};
  background-color: ${({ theme }) => theme.buttonBlack};
`

const StatusBadged = styled.div<{ color?: string }>`
  ${Badged}
  cursor: pointer;

  :hover {
    filter: brightness(0.8);
  }

  ${({ color, theme }) =>
    color
      ? css`
          color: ${color};
          background-color: ${transparentize(0.8, color)};
        `
      : css`
          color: ${theme.subText};
          background-color: ${theme.buttonBlack};
        `}
`

const Content = styled.div`
  gap: 24px;
  padding: 24px 0;
  transition: all 0.2s ease;
  z-index: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const OptionsWrapper = styled(RowBetween)<{ optionCount?: number }>`
  ${({ optionCount, theme }) => {
    if (optionCount && optionCount > 2) {
      return css`
        flex-wrap: wrap;
        justify-content: flex-start;
        > * {
          width: calc(33.33% - 20px * 2 / 3);
        }
        ${theme.mediaWidth.upToMedium`
          > * {
            width: calc(50% - 20px / 2);
          }
        `}
        ${theme.mediaWidth.upToSmall`
          > * {
            width: 100%;
          }
        `}
      `
    }

    return ''
  }}
`

const VoteButton = ({
  status,
  onVoteClick,
  errorMessage,
  voted,
}: {
  status: string
  onVoteClick: () => void
  errorMessage: string | null
  voted: boolean
}) => {
  const { account } = useActiveWeb3React()
  const toggleWalletModal = useWalletModalToggle()
  const onLoad = useRef(true)
  useEffect(() => {
    const timeout = setTimeout(() => {
      onLoad.current = false
    }, 1500)
    return () => {
      clearTimeout(timeout)
    }
  }, [])

  return (
    <>
      {status === ProposalStatus.Active ? (
        account ? (
          <ButtonPrimary
            width={isMobile ? '100%' : 'fit-content'}
            minWidth={'200px'}
            fontWeight={500}
            fontSize="14px"
            onClick={onVoteClick}
            disabled={onLoad.current || !!errorMessage}
          >
            {errorMessage && !onLoad.current ? (
              errorMessage
            ) : voted ? (
              <Trans>Update Vote</Trans>
            ) : (
              <Trans>Vote now</Trans>
            )}
          </ButtonPrimary>
        ) : (
          <ButtonLight width={isMobile ? '100%' : '200px'} onClick={toggleWalletModal}>
            <Trans>Connect Wallet</Trans>
          </ButtonLight>
        )
      ) : (
        <></>
      )}
    </>
  )
}

function ProposalItem({
  proposal,
  showByDefault,
  onBadgeClick,
  voteCallback,
}: {
  proposal: ProposalDetail
  showByDefault?: boolean
  onBadgeClick?: (name: string) => void
  voteCallback?: (proposal_id: number, option: number) => Promise<boolean>
}) {
  const theme = useTheme()
  const { account } = useActiveWeb3React()
  const { votesInfo, stakerInfo } = useVotingInfo()
  const totalVotePowerAmount = stakerInfo
    ? (stakerInfo.delegate.toLowerCase() === account?.toLowerCase() ? stakerInfo.stake_amount : 0) +
      stakerInfo.delegated_stake_amount
    : 0

  const isDelegated = !!stakerInfo && stakerInfo.delegate.toLowerCase() !== account?.toLowerCase()

  const [show, setShow] = useState(!!showByDefault)
  const [selectedOptions, setSelectedOptions] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  useEffect(() => {
    if (isDelegated) {
      setErrorMessage(t`You already delegated your Voting power`)
    } else if (!totalVotePowerAmount) {
      setErrorMessage(t`You dont have Voting power`)
    } else if (selectedOptions?.length === 0) {
      setErrorMessage(t`Not selected option`)
    } else {
      setErrorMessage(null)
    }
  }, [selectedOptions.length, stakerInfo?.stake_amount, isDelegated, totalVotePowerAmount])

  const contentRef = useRef<any>()
  const tagColor = () => {
    switch (proposal.status) {
      case ProposalStatus.Pending:
        return theme.warning
      case ProposalStatus.Active:
        return theme.blue
      case ProposalStatus.Approved:
      case ProposalStatus.Executed:
        return theme.primary
      case ProposalStatus.Canceled:
      case ProposalStatus.Failed:
        return theme.red
      default:
        return theme.blue
    }
  }
  const { switchToEthereum } = useSwitchToEthereum()
  const handleVote = useCallback(() => {
    switchToEthereum().then(() => {
      selectedOptions.length > 0 && setShowConfirmModal(true)
    })
  }, [switchToEthereum, setShowConfirmModal, selectedOptions])

  const handleVoteConfirm = useCallback(() => {
    setShowConfirmModal(false)
    selectedOptions.length > 0 &&
      voteCallback?.(
        proposal.proposal_id,
        selectedOptions.map(i => i + 1).reduce((acc, item) => (acc += 1 << (item - 1)), 0),
      ).then(() => {
        setSelectedOptions([])
      })
  }, [selectedOptions, proposal.proposal_id, voteCallback])

  const votedOfCurrentProposal = useMemo(
    () => votesInfo?.find(v => v.proposal_id === proposal.proposal_id),
    [votesInfo, proposal.proposal_id],
  )

  useEffect(() => {
    setSelectedOptions([])
  }, [votedOfCurrentProposal])
  const handleOptionClick = useCallback(
    (option: number) => {
      if (proposal.proposal_type === ProposalType.BinaryProposal) {
        setSelectedOptions([option])
      }
      if (proposal.proposal_type === ProposalType.GenericProposal) {
        if (selectedOptions.length === 0) {
          setSelectedOptions([option])
        } else {
          const newOptions: number[] = [...selectedOptions] || []
          const index = newOptions.indexOf(option)
          if (index !== -1) {
            newOptions.splice(index, index + 1)
          } else {
            newOptions.push(option)
          }
          setSelectedOptions(newOptions)
        }
      }
    },
    [proposal.proposal_type, setSelectedOptions, selectedOptions],
  )
  const isActive = proposal.status === ProposalStatus.Active

  const renderVotes = useMemo(() => {
    return (
      <OptionsWrapper
        gap={isMobile ? '16px' : '20px'}
        flexDirection={isMobile ? 'column' : 'row'}
        optionCount={proposal.options.length}
      >
        {proposal.options.map((option: string, index: number) => {
          const voted = votedOfCurrentProposal?.options?.includes(index) || false
          const voteStat = proposal?.vote_stats?.options?.find(o => o.option === index)
          return (
            <OptionButton
              disabled={!isActive}
              key={option}
              percent={voteStat ? (voteStat.vote_count / proposal.vote_stats.total_vote_count) * 100 : 0}
              title={option}
              checked={selectedOptions?.includes(index) || voted}
              onOptionClick={() => handleOptionClick(index)}
              type={
                proposal.status === ProposalStatus.Pending
                  ? 'Pending'
                  : selectedOptions?.includes(index)
                  ? 'Choosing'
                  : voted
                  ? 'Active'
                  : 'Finished'
              }
              isCheckBox={proposal.proposal_type === ProposalType.GenericProposal}
              id={index}
            />
          )
        })}
      </OptionsWrapper>
    )
  }, [proposal, selectedOptions, votedOfCurrentProposal?.options, handleOptionClick, isActive])

  return (
    <ProposalItemWrapper>
      <ProposalHeader>
        <RowBetween onClick={() => setShow(s => !s)}>
          <Text>
            <Trans>{proposal.title}</Trans>
          </Text>
          <ExpandButton>
            <ChevronDown
              size={24}
              style={{ transition: 'all 0.2s ease', transform: show ? 'rotate(180deg)' : undefined }}
            />
          </ExpandButton>
        </RowBetween>
        {(show || isActive) && isMobile && (
          <RowBetween>
            <RowFit gap="8px" flexWrap="wrap">
              <StatusBadged color={tagColor()} onClick={() => onBadgeClick?.(proposal.status)}>
                {proposal.status}
              </StatusBadged>
              <IDBadged>ID #{proposal.proposal_id}</IDBadged>
            </RowFit>
            {isActive && (
              <RowFit gap="4px" flexShrink={0}>
                <Text color={theme.subText} fontSize={12}>
                  <Trans>Voting ends in: </Trans>
                </Text>
                <StatusBadged color={theme.primary}>
                  {readableTime(proposal.end_timestamp - Date.now() / 1000)}
                </StatusBadged>
              </RowFit>
            )}
          </RowBetween>
        )}
        {(show || isActive) && renderVotes}
        <RowBetween>
          {isActive ? (
            <Column gap="4px">
              <VoteButton
                status={proposal.status}
                onVoteClick={handleVote}
                errorMessage={errorMessage}
                voted={!!votedOfCurrentProposal?.options && votedOfCurrentProposal.options.length > 0}
              />
            </Column>
          ) : proposal.status === ProposalStatus.Pending ? (
            <RowFit gap="4px">
              <Text color={theme.subText} fontSize={12}>
                <Trans>Voting starts in: </Trans>
              </Text>
              <StatusBadged color={theme.primary}>
                {readableTime(proposal.start_timestamp - Date.now() / 1000)}
              </StatusBadged>
            </RowFit>
          ) : (
            <Text color={theme.subText} fontSize={12}>
              Ended {dayjs(proposal.end_timestamp * 1000).format('DD MMM YYYY')}
            </Text>
          )}
          {!((show || isActive) && isMobile) && (
            <Column gap="8px">
              <Row gap="8px" justify="flex-end">
                <StatusBadged color={tagColor()} onClick={() => onBadgeClick?.(proposal.status)}>
                  {proposal.status}
                </StatusBadged>
                <IDBadged>ID #{proposal.proposal_id}</IDBadged>
              </Row>
              {isActive && (
                <Row gap="4px">
                  <Text color={theme.subText} fontSize={12}>
                    <Trans>Voting ends in: </Trans>
                  </Text>
                  <StatusBadged color={theme.primary}>
                    {readableTime(proposal.end_timestamp - Date.now() / 1000)}
                  </StatusBadged>
                </Row>
              )}
            </Column>
          )}
        </RowBetween>
      </ProposalHeader>
      {show && (
        <Content ref={contentRef as any}>
          <Row align="flex-start" gap="16px">
            <div style={{ flex: 1 }}>
              {proposal?.link && proposal.link !== '0x0' && (
                <a
                  href={proposal.link?.startsWith('http') ? proposal.link : 'http://' + proposal.link}
                  style={{ marginBottom: '12px', width: 'fit-content' }}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span style={{ marginRight: '4px' }}>
                    <LaunchIcon size={14} />
                  </span>
                  <span style={{ fontSize: '14px', verticalAlign: 'top' }}>
                    <Trans>Github</Trans>
                  </span>
                </a>
              )}
              <Text
                fontSize={isMobile ? 14 : 16}
                lineHeight={isMobile ? '18px' : '22px'}
                color={theme.subText}
                marginBottom="20px"
                dangerouslySetInnerHTML={{ __html: proposal.desc.replaceAll('\\n', '').replaceAll('\\r', '') }}
                style={{ wordBreak: 'break-word' }}
              ></Text>
              {isMobile && <VoteInformation proposal={proposal} />}
            </div>
            {!isMobile && (
              <div style={{ width: '368px' }}>
                <VoteInformation proposal={proposal} />
              </div>
            )}
          </Row>
          <Participants proposalId={proposal.proposal_id} />
        </Content>
      )}
      {proposal.status === ProposalStatus.Active && (
        <VoteConfirmModal
          isShow={showConfirmModal}
          title={proposal.title}
          toggle={() => setShowConfirmModal(false)}
          options={selectedOptions.length > 0 ? selectedOptions.map(option => proposal.options[option]).join(', ') : ''}
          onVoteConfirm={handleVoteConfirm}
        />
      )}
    </ProposalItemWrapper>
  )
}
export default React.memo(ProposalItem)
