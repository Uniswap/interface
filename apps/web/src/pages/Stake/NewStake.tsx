import { CurrencyAmount, Fraction } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { UBE } from 'constants/tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useContract } from 'hooks/useContract'
import { t } from 'i18n'
import JSBI from 'jsbi'
import { useSingleCallResult } from 'lib/hooks/multicall'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { BodyWrapper } from 'pages/AppBody'
import React, { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Text } from 'rebass'
import { useTokenBalance } from 'state/connection/hooks'
import styled from 'styled-components'
import { ExternalLink } from 'theme/components'
import {
  RomulusDelegate__factory,
  VotableStakingRewards,
  VotableStakingRewards__factory,
  Voter__factory,
} from 'uniswap/src/abis/types'
import VOTABLE_STAKING_ABI from 'uniswap/src/abis/votable-staking-rewards.json'
import { shortenAddress } from 'utilities/src/addresses'
import { ButtonEmpty, ButtonLight, ButtonPrimary, ButtonRadio } from '../../components-old/Button'
import { AutoColumn } from '../../components-old/Column'
import CurrencyLogo from '../../components-old/CurrencyLogo'
import Loader from '../../components-old/Loader'
import { AutoRow } from '../../components-old/Row'
import ChangeDelegateModal from '../../components-old/Stake/ChangeDelegateModal'
import { Proposals } from '../../components-old/Stake/Proposals'
import { InformationWrapper } from '../../components-old/Stake/Proposals/ProposalCard'
import StakeCollapseCard from '../../components-old/Stake/StakeCollapseCard'
import StakeInputField from '../../components-old/Stake/StakeInputField'
import { ViewProposalModal } from '../../components-old/Stake/ViewProposalModal'
import { useRomulus } from './hooks/romulus/useRomulus'
import { useVotingTokens } from './hooks/romulus/useVotingTokens'
import { useDoTransaction } from './hooks/useDoTransaction'

const BIG_INT_SECONDS_IN_WEEK = JSBI.BigInt(60 * 60 * 24 * 7)
const BIG_INT_SECONDS_IN_YEAR = new Fraction(JSBI.BigInt(60 * 60 * 24 * 365))

enum DelegateIdx {
  ABSTAIN,
  FOR,
  AGAINST,
}

const StyledButtonRadio = styled(ButtonRadio)({
  padding: '8px',
  borderRadius: '4px',
})

const VOTABLE_STAKING_REWARDS_ADDRESS = '0x388D611A57Ac15dCC1B937f287E5E908Ba5ff5c9'

const TopSection = styled(AutoColumn)({
  maxWidth: '480px',
  width: '100%',
})

const Wrapper = styled.div({
  margin: '0px 24px',
})

export const NewStake: React.FC = () => {
  const navigate = useNavigate()
  const { account, chainId, provider } = useWeb3React()
  const ube = chainId ? UBE[chainId] : undefined

  const signer = provider?.getSigner()
  const [, toggleAccountDrawer] = useAccountDrawer()
  const [amount, setAmount] = useState('')
  const [showChangeDelegateModal, setShowChangeDelegateModal] = useState(false)
  const [showViewProposalModal, setShowViewProposalModal] = useState(false)
  const [selectedProposal, setSelectedProposal] = useState('')
  const [isSelectedProposalNew, setIsSelectedProposalNew] = useState(false)
  const tokenAmount = tryParseCurrencyAmount(amount === '' ? '0' : amount, ube)
  const [approvalState, approve] = useApproveCallback(tokenAmount, VOTABLE_STAKING_REWARDS_ADDRESS)
  const [staking, setStaking] = useState(true)
  const ubeBalance = useTokenBalance(account ?? undefined, ube)
  const contract = useContract<VotableStakingRewards>(VOTABLE_STAKING_REWARDS_ADDRESS, VOTABLE_STAKING_ABI, true)
  const doTransaction = useDoTransaction()

  const crank = useCallback(
    async (delegateIdx: DelegateIdx) => {
      if (!provider) {
        return
      }
      const staking = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, provider)
      const voterAddr = await staking.delegates(delegateIdx)
      const supportName =
        delegateIdx === DelegateIdx.ABSTAIN ? 'ABSTAIN' : delegateIdx === DelegateIdx.FOR ? 'FOR' : 'AGAINST'
      const voter = Voter__factory.connect(voterAddr, provider)
      const romulus = RomulusDelegate__factory.connect(await voter.romulusDelegate(), provider)
      const proposalCount = await romulus.proposalCount()
      await doTransaction(voter, 'castVote', {
        args: [proposalCount.sub(1)],
        summary: `Cranking the ${supportName} vote`,
      })
    },
    [provider, doTransaction]
  )

  const _stakeBalance = useSingleCallResult(contract, 'balanceOf', [account ?? undefined]).result?.[0] ?? 0
  const stakeBalance = ube ? CurrencyAmount.fromRawAmount(ube, _stakeBalance) : undefined

  // 0 - Abstain
  // 1 - For
  // 2 - Against
  const userDelegateIdx = useSingleCallResult(contract, 'userDelegateIdx', [account ?? undefined]).result?.[0]

  const _earned = useSingleCallResult(contract, 'earned', [account ?? undefined]).result?.[0] ?? 0
  const earned = ube ? CurrencyAmount.fromRawAmount(ube, _earned) : undefined

  const _totalSupply = useSingleCallResult(contract, 'totalSupply', []).result?.[0] ?? 0
  const totalSupply = ube ? CurrencyAmount.fromRawAmount(ube, _totalSupply) : undefined

  const _rewardRate = useSingleCallResult(contract, 'rewardRate', []).result?.[0] ?? 0
  const rewardRate = ube ? CurrencyAmount.fromRawAmount(ube, _rewardRate) : undefined

  const apy =
    rewardRate && totalSupply && totalSupply.greaterThan('0')
      ? rewardRate.asFraction.multiply(BIG_INT_SECONDS_IN_YEAR).divide(totalSupply.asFraction)
      : undefined
  const userRewardRate =
    rewardRate && stakeBalance && totalSupply && totalSupply?.greaterThan('0')
      ? JSBI.divide(JSBI.multiply(stakeBalance.quotient, rewardRate.quotient), totalSupply.quotient)
      : undefined
  const userWeeklyRewards =
    userRewardRate && ube
      ? CurrencyAmount.fromRawAmount(ube, JSBI.multiply(userRewardRate, BIG_INT_SECONDS_IN_WEEK))
      : undefined

  const { tokenDelegate, quorumVotes, proposalThreshold } = useRomulus()

  const { votingPower, releaseVotingPower } = useVotingTokens(0)
  const totalVotingPower = votingPower && releaseVotingPower ? votingPower.add(releaseVotingPower) : undefined

  const disablePropose =
    !totalVotingPower || !proposalThreshold || totalVotingPower?.lessThan(proposalThreshold?.quotient)

  const onStakeClick = useCallback(async () => {
    if (!signer || !tokenAmount) {
      return
    }
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
    return await doTransaction(c, 'stake', {
      args: [tokenAmount.quotient.toString()],
      summary: `Stake ${amount} UBE`,
    })
  }, [doTransaction, amount, signer, tokenAmount])
  const onUnstakeClick = useCallback(async () => {
    if (!signer) {
      return
    }
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
    if (!tokenAmount) {
      return
    }
    return await doTransaction(c, 'withdraw', {
      args: [tokenAmount.quotient.toString()],
      summary: `Unstake ${amount} UBE`,
    })
  }, [doTransaction, amount, signer, tokenAmount])
  const onClaimClick = useCallback(async () => {
    if (!signer) {
      return
    }
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
    return await doTransaction(c, 'getReward', {
      args: [],
      summary: `Claim UBE rewards`,
    })
  }, [doTransaction, signer])
  const changeDelegateIdx = useCallback(
    async (delegateIdx: number) => {
      if (delegateIdx === userDelegateIdx || !signer) {
        return
      }
      const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
      return await doTransaction(c, 'changeDelegateIdx', {
        args: [delegateIdx],
        summary: `Change auto-governance selection to ${DelegateIdx[delegateIdx]}`,
      })
    },
    [doTransaction, signer, userDelegateIdx]
  )

  let button = <ButtonLight onClick={() => toggleAccountDrawer()}>{t('Connect Wallet')}</ButtonLight>
  if (account) {
    if (staking) {
      if (approvalState !== ApprovalState.APPROVED) {
        button = (
          <ButtonPrimary
            onClick={() => approve().catch(console.error)}
            disabled={!tokenAmount}
            altDisabledStyle={approvalState === ApprovalState.PENDING} // show solid button while waiting
          >
            {approvalState === ApprovalState.PENDING ? (
              <AutoRow gap="6px" justify="center">
                Approving <Loader stroke="white" />
              </AutoRow>
            ) : (
              `${t('Approve')} UBE`
            )}
          </ButtonPrimary>
        )
      } else {
        button = (
          <ButtonPrimary onClick={onStakeClick} disabled={isNaN(Number(amount)) || Number(amount) <= 0}>
            {t('Stake')}
          </ButtonPrimary>
        )
      }
    } else {
      button = (
        <ButtonPrimary onClick={onUnstakeClick} disabled={isNaN(Number(amount)) || Number(amount) <= 0}>
          {t('Unstake')}
        </ButtonPrimary>
      )
    }
  }

  return (
    <>
      <TopSection gap="lg" justify="center">
        <BodyWrapper>
          <CurrencyLogo
            currency={ube}
            size="42px"
            style={{ position: 'absolute', top: '30px', right: 'calc(50% + 112px)' }}
          />
          <h2 style={{ textAlign: 'center', margin: '15px 0px 15px 6px' }}>New Ube Stake</h2>
          <div style={{ margin: '10px 0 0 6px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '100px' }}>
              <StyledButtonRadio active={staking} onClick={() => setStaking(true)}>
                {t('Stake')}
              </StyledButtonRadio>
            </div>
            <div style={{ width: '100px' }}>
              <StyledButtonRadio active={!staking} onClick={() => setStaking(false)}>
                {t('Unstake')}
              </StyledButtonRadio>
            </div>
          </div>

          <Wrapper>
            <div style={{ margin: '24px 0' }}>
              <StakeInputField
                id="stake-currency"
                value={amount}
                onUserInput={setAmount}
                onMax={() => {
                  if (staking) {
                    ubeBalance && setAmount(ubeBalance.toSignificant(18))
                  } else {
                    stakeBalance && setAmount(stakeBalance.toSignificant(18))
                  }
                }}
                currency={ube}
                stakeBalance={stakeBalance}
                walletBalance={ubeBalance}
              />
            </div>
            {userRewardRate && JSBI.greaterThan(userRewardRate, JSBI.BigInt(0)) && (
              <InformationWrapper style={{ margin: '0px 8px 0px 8px' }}>
                <Text fontWeight={500} fontSize={16}>
                  {t('Unclaimed Rewards')}
                </Text>
                <div style={{ display: 'flex' }}>
                  <ButtonEmpty padding="0 8px" borderRadius="8px" width="fit-content" onClick={onClaimClick}>
                    {t('Claim')}
                  </ButtonEmpty>
                  <Text fontWeight={500} fontSize={16}>
                    {userRewardRate && earned ? earned.toFixed(4, { groupSeparator: ',' }) : '--'}
                  </Text>
                </div>
              </InformationWrapper>
            )}
            <div style={{ margin: '24px 0 16px 0' }}>{button}</div>
          </Wrapper>
        </BodyWrapper>

        {!(userRewardRate && JSBI.greaterThan(userRewardRate, JSBI.BigInt(0))) && (
          <Text fontSize={20} fontWeight={500} padding="0px 8px">
            {t('Your Weekly Rewards') + ' '}
            {userWeeklyRewards ? userWeeklyRewards.toFixed(0, { groupSeparator: ',' }) : '--'} UBE / week (
            {apy?.multiply('100').toFixed(2, { groupSeparator: ',' }) ?? '--'}% APR)
          </Text>
        )}

        <StakeCollapseCard title="Voter cranks">
          <InformationWrapper>
            <div>
              <Text fontWeight={500} fontSize={16} marginTop={12}>
                For Voter
              </Text>
              <ButtonPrimary
                onClick={async () => {
                  await crank(DelegateIdx.FOR)
                }}
              >
                Crank
              </ButtonPrimary>
            </div>
            <div>
              <Text fontWeight={500} fontSize={16} marginTop={12}>
                Abstain Voter
              </Text>
              <ButtonPrimary
                onClick={async () => {
                  await crank(DelegateIdx.ABSTAIN)
                }}
              >
                Crank
              </ButtonPrimary>
            </div>
            <div>
              <Text fontWeight={500} fontSize={16} marginTop={12}>
                Against Voter
              </Text>
              <ButtonPrimary
                onClick={async () => {
                  await crank(DelegateIdx.AGAINST)
                }}
              >
                Crank
              </ButtonPrimary>
            </div>
          </InformationWrapper>
        </StakeCollapseCard>

        <StakeCollapseCard title={t('Governance')} gap="12px">
          <Text fontSize={14}>
            {t('Create and view proposals, delegate votes, and participate in protocol governance')}
          </Text>
          <InformationWrapper>
            <Text fontWeight={500} fontSize={16} marginTop={12}>
              {t('User Details')}
            </Text>
            <ButtonPrimary
              padding="6px"
              borderRadius="8px"
              width="120px"
              marginTop="8px"
              fontSize={14}
              disabled={disablePropose}
              onClick={() => {
                navigate('/add-proposal')
              }}
            >
              Propose
            </ButtonPrimary>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{t('Token Balance')}</Text>
            <Text>{ubeBalance ? `${ubeBalance?.toFixed(0, { groupSeparator: ',' })} UBE` : '-'} </Text>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{t('Voting Power')}</Text>
            <Text>{totalVotingPower ? totalVotingPower?.toFixed(0, { groupSeparator: ',' }) : '-'}</Text>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{t('Token Delegate')}</Text>
            <div style={{ display: 'flex' }}>
              {tokenDelegate ? (
                <>
                  <ButtonEmpty
                    padding="0 8px"
                    borderRadius="8px"
                    width="fit-content"
                    onClick={() => {
                      setShowChangeDelegateModal(true)
                    }}
                    style={{ lineHeight: '15px' }}
                  >
                    {t('Change')}
                  </ButtonEmpty>
                  <Text>{shortenAddress(tokenDelegate)}</Text>
                </>
              ) : (
                '-'
              )}
            </div>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{t('Quorum')}</Text>
            <Text>{quorumVotes ? `${quorumVotes?.toFixed(0, { groupSeparator: ',' })} UBE` : '-'}</Text>
          </InformationWrapper>
          <InformationWrapper fontWeight={400}>
            <Text>{t('Proposal Threshold')}</Text>
            <Text>{proposalThreshold ? `${proposalThreshold?.toFixed(0, { groupSeparator: ',' })} UBE` : '-'}</Text>
          </InformationWrapper>

          {stakeBalance?.greaterThan('0') && (
            <>
              <Text fontWeight={500} fontSize={16} marginTop={12}>
                {t('Your governance selection')}
              </Text>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <StyledButtonRadio active={userDelegateIdx === 1} onClick={() => changeDelegateIdx(1)}>
                  {t('For')}
                </StyledButtonRadio>
                <StyledButtonRadio active={userDelegateIdx === 0} onClick={() => changeDelegateIdx(0)}>
                  {t('Abstain')}
                </StyledButtonRadio>
                <StyledButtonRadio active={userDelegateIdx === 2} onClick={() => changeDelegateIdx(2)}>
                  {t('Against')}
                </StyledButtonRadio>
              </div>
            </>
          )}
          <Text fontWeight={500} fontSize={16} marginTop={12}>
            {t('Governance Proposals')}
            <Proposals
              onClickProposal={(url: any, isNewContract: boolean) => {
                setSelectedProposal(url)
                setIsSelectedProposalNew(isNewContract)
                setShowViewProposalModal(true)
              }}
            />
          </Text>
        </StakeCollapseCard>
        {userRewardRate && JSBI.greaterThan(userRewardRate, JSBI.BigInt(0)) && (
          <StakeCollapseCard title={t('Staking Statistics')} gap="16px">
            <InformationWrapper>
              <Text>{t('Total UBE Staked')}</Text>
              <Text>{Number(totalSupply?.toSignificant(4)).toLocaleString('en-US')}</Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{t('Your UBE Stake Pool Share')}</Text>
              <Text>{stakeBalance?.toSignificant(4)}</Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{t('Your Weekly Rewards')}</Text>
              <Text>
                {userWeeklyRewards ? userWeeklyRewards.toFixed(4, { groupSeparator: ',' }) : '--'}
                {'  '}
              </Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{t('Annual Stake APR')}</Text>
              <Text>{apy?.multiply('100').toFixed(2, { groupSeparator: ',' }) ?? '--'}% </Text>
            </InformationWrapper>
            <ExternalLink
              style={{ textDecoration: 'underline', textAlign: 'left' }}
              target="_blank"
              href="https://explorer.celo.org/address/0x71e26d0E519D14591b9dE9a0fE9513A398101490/transactions"
            >
              <Text fontSize={14} fontWeight={600}>
                {t('View UBE Contract')}
              </Text>
            </ExternalLink>
            <ExternalLink
              style={{ textDecoration: 'underline', textAlign: 'left' }}
              target="_blank"
              href="https://info.ubeswap.org/token/0x71e26d0E519D14591b9dE9a0fE9513A398101490"
            >
              <Text fontSize={14} fontWeight={600}>
                {t('View UBE Chart')}
              </Text>
            </ExternalLink>
          </StakeCollapseCard>
        )}
      </TopSection>
      <ChangeDelegateModal isOpen={showChangeDelegateModal} onDismiss={() => setShowChangeDelegateModal(false)} />
      <ViewProposalModal
        isOpen={showViewProposalModal}
        proposalId={selectedProposal}
        isNewContract={isSelectedProposalNew}
        onDismiss={() => setShowViewProposalModal(false)}
      />
    </>
  )
}
