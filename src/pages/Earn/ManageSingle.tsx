import { useCelo } from '@celo/react-celo'
import { JSBI } from '@ubeswap/sdk'
import CurrencyLogo from 'components/CurrencyLogo'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, RouteComponentProps } from 'react-router-dom'
import styled from 'styled-components'
import { CountUp } from 'use-count-up'

import { ButtonEmpty, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import ClaimRewardModal from '../../components/earn/ClaimRewardModal'
import StakingModal from '../../components/earn/StakingModal'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import UnstakingModal from '../../components/earn/UnstakingModal'
import { RowBetween, RowFixed } from '../../components/Row'
import { BIG_INT_SECONDS_IN_WEEK, BIG_INT_ZERO } from '../../constants'
import { useCurrency } from '../../hooks/Tokens'
import { useColor } from '../../hooks/useColor'
import usePrevious from '../../hooks/usePrevious'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useCurrencyBalance } from '../../state/wallet/hooks'
import { ExternalLinkIcon, TYPE } from '../../theme'
import { useCustomStakingInfo } from './useCustomStakingInfo'

const PageWrapper = styled(AutoColumn)`
  max-width: 640px;
  width: 100%;
`

const PositionInfo = styled(AutoColumn)<{ dim: any }>`
  position: relative;
  max-width: 640px;
  width: 100%;
  opacity: ${({ dim }) => (dim ? 0.6 : 1)};
`

const BottomSection = styled(AutoColumn)`
  border-radius: 12px;
  width: 100%;
  position: relative;
`

const StyledDataCard = styled(DataCard)<{ bgColor?: any; showBackground?: any }>`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #1e1a31 0%, #3d51a5 100%);
  z-index: 2;
  background: ${({ theme, bgColor, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%,  ${showBackground ? theme.black : theme.bg5} 100%) `};
  ${({ showBackground }) =>
    showBackground &&
    `  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);`}
`

const StyledBottomCard = styled(DataCard)<{ dim: any }>`
  background: ${({ theme }) => theme.bg3};
  opacity: ${({ dim }) => (dim ? 0.4 : 1)};
  margin-top: -40px;
  padding: 0 1.25rem 1rem 1.25rem;
  padding-top: 32px;
  z-index: 1;
`

const PoolData = styled(DataCard)`
  background: none;
  border: 1px solid ${({ theme }) => theme.bg4};
  padding: 1rem;
  z-index: 1;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`

const DataRow = styled(RowBetween)`
  justify-content: center;
  gap: 12px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`

export default function ManageSingle({
  match: {
    params: { currencyId, stakingAddress },
  },
}: RouteComponentProps<{ currencyId: string; stakingAddress: string }>) {
  const { t } = useTranslation()
  const { address: account } = useCelo()

  const token = useCurrency(currencyId) ?? undefined

  const customStakingInfo = useCustomStakingInfo(stakingAddress)
  const stakingInfo = { ...customStakingInfo, tokens: undefined }
  const userLiquidityUnstaked = useCurrencyBalance(account || undefined, token)
  const showAddLiquidityButton = Boolean(stakingInfo.stakedAmount?.equalTo('0') && userLiquidityUnstaked?.equalTo('0'))

  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)

  const disableTop = !stakingInfo.stakedAmount || stakingInfo.stakedAmount.equalTo(JSBI.BigInt(0))

  const backgroundColor = useColor(token ?? undefined)

  stakingInfo?.rewardRates?.sort((a, b) =>
    a.multiply(BIG_INT_SECONDS_IN_WEEK).lessThan(b.multiply(BIG_INT_SECONDS_IN_WEEK)) ? 1 : -1
  )
  const countUpAmounts =
    stakingInfo?.earnedAmounts
      ?.sort((a, b) => (a.lessThan(b) ? 1 : -1))
      .map((earnedAmount) => earnedAmount.toFixed(6) ?? '0') || []

  const countUpAmountsPrevious = usePrevious(countUpAmounts) ?? countUpAmounts

  const toggleWalletModal = useWalletModalToggle()

  const handleDepositClick = useCallback(() => {
    if (account) {
      setShowStakingModal(true)
    } else {
      toggleWalletModal()
    }
  }, [account, toggleWalletModal])

  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <TYPE.mediumHeader style={{ margin: 0 }}>
          {token?.symbol} {t('liquidityMining')}
        </TYPE.mediumHeader>
        <CurrencyLogo currency={token ?? undefined} />
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>{t('totalDeposits')}</TYPE.body>
            <TYPE.body fontSize={24} fontWeight={500}>
              {stakingInfo.valueOfTotalStakedAmountInCUSD
                ? Number(stakingInfo.valueOfTotalStakedAmountInCUSD).toLocaleString(undefined, {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  })
                : stakingInfo.totalStakedAmount
                ? `${Number(stakingInfo.totalStakedAmount?.toFixed(0)).toLocaleString(undefined, {
                    style: 'decimal',
                    maximumFractionDigits: 0,
                  })} ${token?.symbol}`
                : '-'}
            </TYPE.body>
          </AutoColumn>
        </PoolData>
        <PoolData>
          <AutoColumn gap="sm">
            {stakingInfo.totalRewardRates && (
              <>
                <TYPE.body style={{ margin: 0 }}>{t('poolRate')}</TYPE.body>
                {stakingInfo.totalRewardRates
                  ?.filter((rewardRate) => rewardRate)
                  ?.map((rewardRate) => {
                    return (
                      <TYPE.body fontSize={24} fontWeight={500} key={rewardRate?.token.symbol}>
                        {rewardRate?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' }) ?? '-'}
                        {` ${rewardRate?.token.symbol} / week`}
                      </TYPE.body>
                    )
                  })}
              </>
            )}
          </AutoColumn>
        </PoolData>
      </DataRow>

      {showAddLiquidityButton && (
        <VoteCard>
          <CardBGImage />
          <CardNoise />
          <CardSection>
            <AutoColumn gap="md">
              <RowBetween>
                <TYPE.white fontWeight={600}>Step 1. Get {`${token?.symbol}`} tokens</TYPE.white>
              </RowBetween>
              <RowBetween style={{ marginBottom: '1rem' }}>
                <TYPE.white fontSize={14}>
                  {`${token?.symbol} tokens are required. Once you've swap cusd into ${token?.symbol} tokens you can stake ${token?.symbol} tokens on this page.`}
                </TYPE.white>
              </RowBetween>
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                width={'fit-content'}
                as={Link}
                to={`/swap/${token && currencyId}`}
              >
                {`Add ${token?.symbol} tokens`}
              </ButtonPrimary>
            </AutoColumn>
          </CardSection>
          <CardBGImage />
          <CardNoise />
        </VoteCard>
      )}

      {stakingInfo && (
        <>
          <StakingModal
            isOpen={showStakingModal}
            onDismiss={() => setShowStakingModal(false)}
            stakingInfo={stakingInfo}
            userLiquidityUnstaked={userLiquidityUnstaked}
          />
          <UnstakingModal
            isOpen={showUnstakingModal}
            onDismiss={() => setShowUnstakingModal(false)}
            stakingInfo={stakingInfo}
          />
          <ClaimRewardModal
            isOpen={showClaimRewardModal}
            onDismiss={() => setShowClaimRewardModal(false)}
            stakingInfo={stakingInfo}
          />
        </>
      )}

      <PositionInfo gap="lg" justify="center" dim={showAddLiquidityButton}>
        <BottomSection gap="lg" justify="center">
          <StyledDataCard disabled={disableTop} bgColor={backgroundColor} showBackground={!showAddLiquidityButton}>
            <CardSection>
              <CardNoise />
              <AutoColumn gap="md">
                <RowBetween>
                  <TYPE.white fontWeight={600}>{t('yourLiquidityDeposits')}</TYPE.white>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <TYPE.white fontSize={36} fontWeight={600}>
                    {stakingInfo.stakedAmount?.toSignificant(6) ?? '-'}
                  </TYPE.white>
                  <RowFixed>
                    <TYPE.white>{token?.symbol}</TYPE.white>
                    {stakingInfo && (
                      <PairLinkIcon
                        href={`https://info.ubeswap.org/token/${stakingInfo?.stakingToken?.address.toLowerCase()}`}
                      />
                    )}
                  </RowFixed>
                </RowBetween>
                {stakingInfo.stakedAmount && stakingInfo.stakedAmount.greaterThan('0') && (
                  <RowBetween>
                    <RowFixed>
                      <TYPE.white>
                        {t('currentValue')}:{' '}
                        {stakingInfo.userValueCUSD
                          ? Number(stakingInfo.userValueCUSD).toLocaleString(undefined, {
                              style: 'currency',
                              currency: 'USD',
                              maximumFractionDigits: 0,
                            })
                          : '--'}
                      </TYPE.white>
                    </RowFixed>
                  </RowBetween>
                )}
              </AutoColumn>
            </CardSection>
          </StyledDataCard>
          <StyledBottomCard dim={stakingInfo.stakedAmount?.equalTo(JSBI.BigInt(0))}>
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <TYPE.black>{t('yourUnclaimedRewards')}</TYPE.black>
                </div>
                {stakingInfo?.earnedAmounts?.some((earnedAmount) => JSBI.notEqual(BIG_INT_ZERO, earnedAmount?.raw)) && (
                  <ButtonEmpty
                    padding="8px"
                    borderRadius="8px"
                    width="fit-content"
                    onClick={() => setShowClaimRewardModal(true)}
                  >
                    {t('claim')}
                  </ButtonEmpty>
                )}
              </RowBetween>
              {stakingInfo?.rewardRates
                // show if rewards are more than zero or unclaimed are greater than zero
                ?.filter((rewardRate, idx) => rewardRate.greaterThan('0') || countUpAmounts[idx])
                ?.map((rewardRate, idx) => (
                  <RowBetween style={{ alignItems: 'baseline' }} key={rewardRate.token.symbol}>
                    <TYPE.largeHeader fontSize={36} fontWeight={600}>
                      {countUpAmounts[idx] ? (
                        <CountUp
                          key={countUpAmounts[idx]}
                          isCounting
                          decimalPlaces={parseFloat(countUpAmounts[idx]) < 0.0001 ? 6 : 4}
                          start={parseFloat(countUpAmountsPrevious[idx] || countUpAmounts[idx])}
                          end={parseFloat(countUpAmounts[idx])}
                          thousandsSeparator={','}
                          duration={1}
                        />
                      ) : (
                        '0'
                      )}
                    </TYPE.largeHeader>
                    <TYPE.black fontSize={16} fontWeight={500}>
                      <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                        ⚡
                      </span>
                      {stakingInfo.active
                        ? rewardRate.multiply(BIG_INT_SECONDS_IN_WEEK)?.toSignificant(4, { groupSeparator: ',' }) ?? '-'
                        : '0'}
                      {` ${rewardRate.token.symbol} / ${t('week')}`}
                    </TYPE.black>
                  </RowBetween>
                ))}
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>
        <TYPE.main style={{ textAlign: 'center' }} fontSize={14}>
          <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
            ⭐️
          </span>
          {t('withdrawTip')}
        </TYPE.main>

        {!showAddLiquidityButton && (
          <DataRow style={{ marginBottom: '1rem' }}>
            {stakingInfo.active && (
              <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleDepositClick}>
                {stakingInfo.stakedAmount?.greaterThan(JSBI.BigInt(0))
                  ? t('deposit')
                  : `${t('deposit')} ${token?.symbol} Tokens`}
              </ButtonPrimary>
            )}

            {stakingInfo.stakedAmount?.greaterThan(JSBI.BigInt(0)) && (
              <>
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  width="160px"
                  onClick={() => setShowUnstakingModal(true)}
                >
                  {t('withdraw')}
                </ButtonPrimary>
              </>
            )}
            {!stakingInfo.active && (
              <TYPE.main style={{ textAlign: 'center' }} fontSize={14}>
                Staking Rewards inactive for this pair.
              </TYPE.main>
            )}
          </DataRow>
        )}
        {!userLiquidityUnstaked ? null : userLiquidityUnstaked.equalTo('0') ? null : !stakingInfo.active ? null : (
          <TYPE.main>
            {userLiquidityUnstaked.toSignificant(6)} {`${token?.symbol}`} tokens available
          </TYPE.main>
        )}
      </PositionInfo>
    </PageWrapper>
  )
}

const PairLinkIcon = styled(ExternalLinkIcon)`
  svg {
    stroke: ${(props) => props.theme.primary1};
  }
`
