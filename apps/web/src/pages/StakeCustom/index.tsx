import { CurrencyAmount, Fraction } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useToken } from 'hooks/Tokens'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useContract } from 'hooks/useContract'
import { t } from 'i18n'
import JSBI from 'jsbi'
import { NEVER_RELOAD, useSingleCallResult } from 'lib/hooks/multicall'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { BodyWrapper } from 'pages/AppBody'
import React, { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Text } from 'rebass'
import { useTokenBalance } from 'state/connection/hooks'
import styled from 'styled-components'
import { ExternalLink } from 'theme/components'
import { VotableStakingRewards, VotableStakingRewards__factory } from 'uniswap/src/abis/types'
import VOTABLE_STAKING_ABI from 'uniswap/src/abis/votable-staking-rewards.json'
import { ButtonEmpty, ButtonLight, ButtonPrimary, ButtonRadio } from '../../components-old/Button'
import { AutoColumn } from '../../components-old/Column'
import CurrencyLogo from '../../components-old/CurrencyLogo'
import Loader from '../../components-old/Loader'
import { AutoRow } from '../../components-old/Row'
import { InformationWrapper } from '../../components-old/Stake/Proposals/ProposalCard'
import StakeCollapseCard from '../../components-old/Stake/StakeCollapseCard'
import StakeInputField from '../../components-old/Stake/StakeInputField'
import { useDoTransaction } from '../Stake/hooks/useDoTransaction'

const BIG_INT_SECONDS_IN_WEEK = JSBI.BigInt(60 * 60 * 24 * 7)
const BIG_INT_SECONDS_IN_YEAR = new Fraction(JSBI.BigInt(60 * 60 * 24 * 365))

const StyledButtonRadio = styled(ButtonRadio)({
  padding: '8px',
  borderRadius: '4px',
})

const TopSection = styled(AutoColumn)({
  maxWidth: '480px',
  width: '100%',
})

const Wrapper = styled.div({
  margin: '0px 24px',
})

export const StakeCustom: React.FC = () => {
  const { account, chainId, provider } = useWeb3React()
  const { contractAddress } = useParams<{ contractAddress: string }>()

  const contract = useContract<VotableStakingRewards>(contractAddress, VOTABLE_STAKING_ABI, true)
  const tokenAddress = useSingleCallResult(contract, 'stakingToken', undefined, NEVER_RELOAD).result?.[0] as string
  const token = useToken(tokenAddress, chainId)

  const signer = provider?.getSigner()
  const [, toggleAccountDrawer] = useAccountDrawer()
  const [amount, setAmount] = useState('')
  const tokenAmount = tryParseCurrencyAmount(amount === '' ? '0' : amount, token)
  const [approvalState, approve] = useApproveCallback(tokenAmount, contractAddress)
  const [staking, setStaking] = useState(true)
  const tokenBalance = useTokenBalance(account ?? undefined, token)
  const doTransaction = useDoTransaction()

  const _stakeBalance = useSingleCallResult(contract, 'balanceOf', [account ?? undefined]).result?.[0] ?? 0
  const stakeBalance = token ? CurrencyAmount.fromRawAmount(token, _stakeBalance) : undefined

  const _earned = useSingleCallResult(contract, 'earned', [account ?? undefined]).result?.[0] ?? 0
  const earned = token ? CurrencyAmount.fromRawAmount(token, _earned) : undefined

  const _totalSupply = useSingleCallResult(contract, 'totalSupply', []).result?.[0] ?? 0
  const totalSupply = token ? CurrencyAmount.fromRawAmount(token, _totalSupply) : undefined

  const _rewardRate = useSingleCallResult(contract, 'rewardRate', []).result?.[0] ?? 0
  const rewardRate = token ? CurrencyAmount.fromRawAmount(token, _rewardRate) : undefined

  const apy =
    rewardRate && totalSupply && totalSupply.greaterThan('0')
      ? rewardRate.asFraction.multiply(BIG_INT_SECONDS_IN_YEAR).divide(totalSupply.asFraction)
      : undefined
  const userRewardRate =
    rewardRate && stakeBalance && totalSupply && totalSupply?.greaterThan('0')
      ? JSBI.divide(JSBI.multiply(stakeBalance.quotient, rewardRate.quotient), totalSupply.quotient)
      : undefined
  const userWeeklyRewards =
    userRewardRate && token
      ? CurrencyAmount.fromRawAmount(token, JSBI.multiply(userRewardRate, BIG_INT_SECONDS_IN_WEEK))
      : undefined

  const onStakeClick = useCallback(async () => {
    if (!signer || !tokenAmount || !contractAddress) {
      return
    }
    const c = VotableStakingRewards__factory.connect(contractAddress, signer)
    return await doTransaction(c, 'stake', {
      args: [tokenAmount.quotient.toString()],
      summary: `Stake ${amount} `,
    })
  }, [doTransaction, amount, signer, tokenAmount, contractAddress])
  const onUnstakeClick = useCallback(async () => {
    if (!signer || !contractAddress) {
      return
    }
    const c = VotableStakingRewards__factory.connect(contractAddress, signer)
    if (!tokenAmount) {
      return
    }
    return await doTransaction(c, 'withdraw', {
      args: [tokenAmount.quotient.toString()],
      summary: `Unstake ${amount} ${token?.symbol}`,
    })
  }, [doTransaction, amount, signer, tokenAmount, token, contractAddress])
  const onClaimClick = useCallback(async () => {
    if (!signer || !contractAddress) {
      return
    }
    const c = VotableStakingRewards__factory.connect(contractAddress, signer)
    return await doTransaction(c, 'getReward', {
      args: [],
      summary: `Claim ${token?.symbol} rewards`,
    })
  }, [doTransaction, signer, token, contractAddress])

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
              `${t('Approve')} ${token?.symbol}`
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
            currency={token}
            size="42px"
            style={{ position: 'absolute', top: '30px', right: 'calc(50% + 112px)' }}
          />
          <h2 style={{ textAlign: 'center', margin: '15px 0px 15px 6px' }}>{token?.symbol} Stake</h2>
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
                    tokenBalance && setAmount(tokenBalance.toSignificant(18))
                  } else {
                    stakeBalance && setAmount(stakeBalance.toSignificant(18))
                  }
                }}
                currency={token}
                stakeBalance={stakeBalance}
                walletBalance={tokenBalance}
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
            {userWeeklyRewards ? userWeeklyRewards.toFixed(0, { groupSeparator: ',' }) : '--'} {token?.symbol} / week (
            {apy?.multiply('100').toFixed(2, { groupSeparator: ',' }) ?? '--'}% APR)
          </Text>
        )}

        {userRewardRate && JSBI.greaterThan(userRewardRate, JSBI.BigInt(0)) && (
          <StakeCollapseCard title={t('Staking Statistics')} gap="16px">
            <InformationWrapper>
              <Text>Total {token?.symbol} Staked</Text>
              <Text>{Number(totalSupply?.toSignificant(4)).toLocaleString('en-US')}</Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>Your {token?.symbol} Stake Pool Share</Text>
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
              href={`https://explorer.celo.org/address/${tokenAddress}/transactions`}
            >
              <Text fontSize={14} fontWeight={600}>
                View {token?.symbol} Contract
              </Text>
            </ExternalLink>
            <ExternalLink
              style={{ textDecoration: 'underline', textAlign: 'left' }}
              target="_blank"
              href={`https://info.ubeswap.org/token/${tokenAddress}`}
            >
              <Text fontSize={14} fontWeight={600}>
                View {token?.symbol} Chart
              </Text>
            </ExternalLink>
          </StakeCollapseCard>
        )}
      </TopSection>
    </>
  )
}

export default StakeCustom
