import { useContractKit, useGetConnectedSigner } from '@celo-tools/use-contractkit'
import { TokenAmount } from '@ubeswap/sdk'
import { ButtonEmpty, ButtonLight, ButtonPrimary, ButtonRadio } from 'components/Button'
import { GreyCard, YellowCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { CardNoise, CardSection, DataCard } from 'components/earn/styled'
import Loader from 'components/Loader'
import { AutoRow, RowBetween } from 'components/Row'
import StakeInputField from 'components/Stake/StakeInputField'
import { useDoTransaction } from 'components/swap/routing'
import { VotableStakingRewards__factory } from 'generated/factories/VotableStakingRewards__factory'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useVotableStakingContract } from 'hooks/useContract'
import { BodyWrapper } from 'pages/AppBody'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WrappedTokenInfo } from 'state/lists/hooks'
import { useSingleCallResult } from 'state/multicall/hooks'
import { tryParseAmount } from 'state/swap/hooks'
import { useCurrencyBalance } from 'state/wallet/hooks'
import styled, { useTheme } from 'styled-components'
import { ExternalLink, TYPE } from 'theme'

import { BIG_INT_SECONDS_IN_WEEK, BIG_INT_SECONDS_IN_YEAR } from '../../constants'

enum DelegateIdx {
  ABSTAIN,
  FOR,
  AGAINST,
}

const StyledButtonRadio = styled(ButtonRadio)({
  padding: '8px',
  borderRadius: '4px',
})

const VOTABLE_STAKING_REWARDS_ADDRESS = '0xCe74d14163deb82af57f253108F7E5699e62116d'

const TopSection = styled(AutoColumn)({
  maxWidth: '480px',
  width: '100%',
})

const Wrapper = styled.div({
  margin: '0px 24px',
})

const DescriptionWrapper = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
})

const ube = new WrappedTokenInfo(
  {
    address: '0x00be915b9dcf56a3cbe739d9b9c202ca692409ec',
    name: 'Ubeswap Governance Token',
    symbol: 'UBE',
    chainId: 42220,
    decimals: 18,
    logoURI: 'https://raw.githubusercontent.com/ubeswap/default-token-list/master/assets/asset_UBE.png',
  },
  []
)

const CommunityWrapper = styled(AutoColumn)<{ showBackground: boolean; bgColor: any }>`
  border-radius: 12px;
  width: 100%;
  overflow: hidden;
  position: relative;
  padding: 1.25rem;
  display: grid;
  grid-gap: 24px;
  margin-bottom: 1rem;
  background: ${({ bgColor }) => `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%, #212429 100%) `};
  color: ${({ theme, showBackground }) => (showBackground ? theme.white : theme.text1)} !important;
  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
`

export const Stake: React.FC = () => {
  const { t } = useTranslation()
  const theme = useTheme()

  const { address, connect } = useContractKit()
  const getConnectedSigner = useGetConnectedSigner()
  const [amount, setAmount] = useState('')
  const tokenAmount = tryParseAmount(amount === '' ? '0' : amount, ube)
  const [approvalState, approve] = useApproveCallback(tokenAmount, VOTABLE_STAKING_REWARDS_ADDRESS)
  const [staking, setStaking] = useState(true)
  const ubeBalance = useCurrencyBalance(address ?? undefined, ube)
  const contract = useVotableStakingContract(VOTABLE_STAKING_REWARDS_ADDRESS)
  const stakeBalance = new TokenAmount(
    ube,
    useSingleCallResult(contract, 'balanceOf', [address ?? undefined]).result?.[0] ?? 0
  )

  // 0 - Abstain
  // 1 - For
  // 2 - Against
  const userDelegateIdx = useSingleCallResult(contract, 'userDelegateIdx', [address ?? undefined]).result?.[0]
  const earned = new TokenAmount(ube, useSingleCallResult(contract, 'earned', [address ?? undefined]).result?.[0] ?? 0)
  const totalSupply = new TokenAmount(ube, useSingleCallResult(contract, 'totalSupply', []).result?.[0] ?? 0)
  const rewardRate = new TokenAmount(ube, useSingleCallResult(contract, 'rewardRate', []).result?.[0] ?? 0)

  const apy = totalSupply.greaterThan('0') ? rewardRate.multiply(BIG_INT_SECONDS_IN_YEAR).divide(totalSupply) : null
  const userRewardRate = totalSupply.greaterThan('0') ? stakeBalance.multiply(rewardRate).divide(totalSupply) : null
  const doTransaction = useDoTransaction()
  const onStakeClick = useCallback(async () => {
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, await getConnectedSigner())
    if (!tokenAmount) {
      return
    }
    return await doTransaction(c, 'stake', {
      args: [tokenAmount.raw.toString()],
      summary: `Stake ${amount} UBE`,
    })
  }, [doTransaction, amount, getConnectedSigner, tokenAmount])
  const onUnstakeClick = useCallback(async () => {
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, await getConnectedSigner())
    if (!tokenAmount) {
      return
    }
    return await doTransaction(c, 'withdraw', {
      args: [tokenAmount.raw.toString()],
      summary: `Unstake ${amount} UBE`,
    })
  }, [doTransaction, amount, getConnectedSigner, tokenAmount])
  const onClaimClick = useCallback(async () => {
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, await getConnectedSigner())
    return await doTransaction(c, 'getReward', {
      args: [],
      summary: `Claim UBE rewards`,
    })
  }, [doTransaction, getConnectedSigner])
  const changeDelegateIdx = useCallback(
    async (delegateIdx: number) => {
      if (delegateIdx === userDelegateIdx) {
        return
      }
      const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, await getConnectedSigner())
      return await doTransaction(c, 'changeDelegateIdx', {
        args: [delegateIdx],
        summary: `Change auto-governance selection to ${DelegateIdx[delegateIdx]}`,
      })
    },
    [doTransaction, getConnectedSigner, userDelegateIdx]
  )

  let button = <ButtonLight onClick={() => connect().catch(console.warn)}>{t('connectWallet')}</ButtonLight>
  if (address) {
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
              'Approve UBE'
            )}
          </ButtonPrimary>
        )
      } else {
        button = (
          <ButtonPrimary onClick={onStakeClick} disabled={isNaN(Number(amount)) || Number(amount) <= 0}>
            {t('stake')}
          </ButtonPrimary>
        )
      }
    } else {
      button = (
        <ButtonPrimary onClick={onUnstakeClick} disabled={isNaN(Number(amount)) || Number(amount) <= 0}>
          {t('unstake')}
        </ButtonPrimary>
      )
    }
  }

  return (
    <>
      <TopSection gap="md">
        <DataCard style={{ marginBottom: '2px' }}>
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>UBE Staking</TYPE.white>
              </RowBetween>
              <RowBetween>
                <TYPE.white fontSize={14}>
                  Stake UBE to automatically participate in governance and earn UBE rewards. You can check all
                  governance proposals&nbsp;
                  <ExternalLink
                    style={{ color: 'white', textDecoration: 'underline' }}
                    target="_blank"
                    href="https://romulus.page/romulus/0xa7581d8E26007f4D2374507736327f5b46Dd6bA8"
                  >
                    here
                  </ExternalLink>
                </TYPE.white>
              </RowBetween>
            </AutoColumn>
          </CardSection>
          <CardNoise />
        </DataCard>
        <div style={{ textAlign: 'center' }}>
          {/* <h2>Your UBE stake: {stakeBalance ? stakeBalance.toFixed(2, { groupSeparator: ',' }) : '--'} UBE</h2> */}
          {userRewardRate?.greaterThan('0') ? (
            <>
              <YellowCard style={{ marginBottom: '16px' }}>
                <DescriptionWrapper>
                  <h4 style={{ margin: '12px 0' }}>Your weekly rewards</h4>
                  <h4 style={{ margin: '12px 0' }}>
                    {userRewardRate
                      ? userRewardRate.multiply(BIG_INT_SECONDS_IN_WEEK).toFixed(2, { groupSeparator: ',' })
                      : '--'}
                    {'  '}
                  </h4>
                </DescriptionWrapper>
                <DescriptionWrapper>
                  <h4 style={{ margin: '12px 0' }}>Annual stake APR</h4>
                  <h4 style={{ margin: '12px 0' }}>
                    {apy?.multiply('100').toFixed(2, { groupSeparator: ',' }) ?? '--'}%{' '}
                  </h4>
                </DescriptionWrapper>
                <DescriptionWrapper>
                  <h4 style={{ margin: '12px 0' }}>Unclaimed Rewards</h4>
                  <div style={{ display: 'flex' }}>
                    <h4 style={{ margin: '12px 0' }}>
                      {userRewardRate ? earned.toFixed(4, { groupSeparator: ',' }) : '--'}
                    </h4>
                    <ButtonEmpty padding="8px" borderRadius="8px" width="fit-content" onClick={onClaimClick}>
                      {t('claim')}
                    </ButtonEmpty>
                  </div>
                </DescriptionWrapper>
              </YellowCard>
              <CommunityWrapper showBackground={true} bgColor={theme.primary1}>
                <h3 style={{ margin: 'unset' }}>Community UBE Stake</h3>
                <DescriptionWrapper>
                  <h4 style={{ margin: 'unset' }}>Total UBE Staked</h4>
                  <h4 style={{ margin: 'unset' }}>{Number(totalSupply?.toSignificant(4)).toLocaleString('en-US')}</h4>
                </DescriptionWrapper>
                <DescriptionWrapper>
                  <h4 style={{ margin: 'unset' }}>Your UBE Stake Pool Share</h4>
                  <h4 style={{ margin: 'unset' }}>{stakeBalance?.toSignificant(4)}</h4>
                </DescriptionWrapper>
                <ExternalLink
                  style={{ color: 'white', textDecoration: 'underline', textAlign: 'left' }}
                  target="_blank"
                  href="https://explorer.celo.org/address/0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC/transactions"
                >
                  View UBE Contract
                </ExternalLink>
                <ExternalLink
                  style={{ color: 'white', textDecoration: 'underline', textAlign: 'left' }}
                  target="_blank"
                  href="https://info.ubeswap.org/token/0x00be915b9dcf56a3cbe739d9b9c202ca692409ec"
                >
                  View UBE Chart
                </ExternalLink>
              </CommunityWrapper>
            </>
          ) : (
            <h3>
              Weekly rewards:{' '}
              {rewardRate ? rewardRate.multiply(BIG_INT_SECONDS_IN_WEEK).toFixed(0, { groupSeparator: ',' }) : '--'} UBE
              / week ({apy?.multiply('100').toFixed(2, { groupSeparator: ',' }) ?? '--'}% APR)
            </h3>
          )}
          {stakeBalance.greaterThan('0') && (
            <GreyCard>
              <h3 style={{ margin: '0px 0px 12px 0px' }}>
                Your{' '}
                <ExternalLink href={'https://romulus.page/romulus/0xa7581d8E26007f4D2374507736327f5b46Dd6bA8'}>
                  governance
                </ExternalLink>{' '}
                selection:
              </h3>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <StyledButtonRadio active={userDelegateIdx === 1} onClick={() => changeDelegateIdx(1)}>
                  For
                </StyledButtonRadio>
                <StyledButtonRadio active={userDelegateIdx === 0} onClick={() => changeDelegateIdx(0)}>
                  Abstain
                </StyledButtonRadio>
                <StyledButtonRadio active={userDelegateIdx === 2} onClick={() => changeDelegateIdx(2)}>
                  Against
                </StyledButtonRadio>
              </div>
            </GreyCard>
          )}
        </div>
      </TopSection>
      <BodyWrapper style={{ marginTop: '16px' }}>
        <CurrencyLogo
          currency={ube}
          size={'42px'}
          style={{ position: 'absolute', top: '30px', right: 'calc(50% + 120px)' }}
        />
        <h2 style={{ textAlign: 'center', margin: '15px 0px' }}>Your UBE stake</h2>
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: '100px' }}>
            <StyledButtonRadio active={staking} onClick={() => setStaking(true)}>
              Stake
            </StyledButtonRadio>
          </div>
          <div style={{ width: '100px' }}>
            <StyledButtonRadio active={!staking} onClick={() => setStaking(false)}>
              Unstake
            </StyledButtonRadio>
          </div>
        </div>

        <Wrapper>
          <div style={{ margin: '32px 0px' }}>
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
          <div style={{ marginBottom: '16px' }}>{button}</div>
        </Wrapper>
      </BodyWrapper>
    </>
  )
}
