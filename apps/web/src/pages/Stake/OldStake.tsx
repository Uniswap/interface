import { ChainId, CurrencyAmount, Token } from '@ubeswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { ApprovalState, useApproveCallback } from 'hooks/useApproveCallback'
import { useContract } from 'hooks/useContract'
import { t } from 'i18n'
import { useSingleCallResult } from 'lib/hooks/multicall'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { BodyWrapper } from 'pages/AppBody'
import React, { useCallback, useState } from 'react'
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
import { useDoTransaction } from './hooks/useDoTransaction'

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

const VOTABLE_STAKING_REWARDS_ADDRESS = '0xCe74d14163deb82af57f253108F7E5699e62116d'
const OLD_UBE = new Token(ChainId.CELO, '0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC', 18, 'old-UBE', 'Ubeswap (Old)')

export const OldStake: React.FC = () => {
  const { account, chainId, provider } = useWeb3React()
  const ube = chainId ? OLD_UBE : undefined

  const signer = provider?.getSigner()
  const [, toggleAccountDrawer] = useAccountDrawer()
  const [amount, setAmount] = useState('')
  const tokenAmount = tryParseCurrencyAmount(amount === '' ? '0' : amount, ube)
  const [approvalState, approve] = useApproveCallback(tokenAmount, VOTABLE_STAKING_REWARDS_ADDRESS)
  const [staking, setStaking] = useState(true)
  const ubeBalance = useTokenBalance(account ?? undefined, ube)
  const contract = useContract<VotableStakingRewards>(VOTABLE_STAKING_REWARDS_ADDRESS, VOTABLE_STAKING_ABI, true)
  const doTransaction = useDoTransaction()

  const _stakeBalance = useSingleCallResult(contract, 'balanceOf', [account ?? undefined]).result?.[0] ?? 0
  const stakeBalance = ube ? CurrencyAmount.fromRawAmount(ube, _stakeBalance) : undefined

  const _earned = useSingleCallResult(contract, 'earned', [account ?? undefined]).result?.[0] ?? 0
  const earned = ube ? CurrencyAmount.fromRawAmount(ube, _earned) : undefined

  const _totalSupply = useSingleCallResult(contract, 'totalSupply', []).result?.[0] ?? 0
  const totalSupply = ube ? CurrencyAmount.fromRawAmount(ube, _totalSupply) : undefined

  const _rewardRate = useSingleCallResult(contract, 'rewardRate', []).result?.[0] ?? 0
  const rewardRate = ube ? CurrencyAmount.fromRawAmount(ube, _rewardRate) : undefined

  const userRewardRate =
    rewardRate && stakeBalance && totalSupply && totalSupply?.greaterThan('0')
      ? stakeBalance.asFraction.multiply(rewardRate.asFraction).divide(totalSupply.asFraction)
      : undefined

  const onStakeClick = useCallback(async () => {
    if (!signer || !tokenAmount) {
      return
    }
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
    return await doTransaction(c, 'stake', {
      args: [tokenAmount.quotient.toString()],
      summary: `Stake ${amount} old-UBE`,
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
      summary: `Unstake ${amount} old-UBE`,
    })
  }, [doTransaction, amount, signer, tokenAmount])
  const onClaimClick = useCallback(async () => {
    if (!signer) {
      return
    }
    const c = VotableStakingRewards__factory.connect(VOTABLE_STAKING_REWARDS_ADDRESS, signer)
    return await doTransaction(c, 'getReward', {
      args: [],
      summary: `Claim old-UBE rewards`,
    })
  }, [doTransaction, signer])

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
              `${t('Approve')} old-UBE`
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
          <h2 style={{ textAlign: 'center', margin: '15px 0px 15px 6px' }}>Your Old Stake</h2>
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
            {userRewardRate?.greaterThan('0') && (
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

        {userRewardRate?.greaterThan('0') && (
          <StakeCollapseCard title={t('Staking Statistics')} gap="16px">
            <InformationWrapper>
              <Text>{t('Total old-UBE Staked')}</Text>
              <Text>{Number(totalSupply?.toSignificant(4)).toLocaleString('en-US')}</Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{t('Your old-UBE Stake Pool Share')}</Text>
              <Text>{stakeBalance?.toSignificant(4)}</Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{t('Your Weekly Rewards')}</Text>
              <Text>0</Text>
            </InformationWrapper>
            <InformationWrapper>
              <Text>{t('Annual Stake APR')}</Text>
              <Text>0% </Text>
            </InformationWrapper>
            <ExternalLink
              style={{ textDecoration: 'underline', textAlign: 'left' }}
              target="_blank"
              href="https://explorer.celo.org/address/0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC/transactions"
            >
              <Text fontSize={14} fontWeight={600}>
                {t('View old-UBE Contract')}
              </Text>
            </ExternalLink>
            <ExternalLink
              style={{ textDecoration: 'underline', textAlign: 'left' }}
              target="_blank"
              href="https://info.ubeswap.org/token/0x00Be915B9dCf56a3CBE739D9B9c202ca692409EC"
            >
              <Text fontSize={14} fontWeight={600}>
                {t('View old-UBE Chart')}
              </Text>
            </ExternalLink>
          </StakeCollapseCard>
        )}
      </TopSection>
    </>
  )
}
