import { useWeb3React } from '@web3-react/core'
import StakedAmountsHelper from 'components-old/earn/StakedAmountsHelper'
import { CUSD_CELO } from 'constants/tokens'
import { t } from 'i18n'
import JSBI from 'jsbi'
import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { CountUp } from 'use-count-up'
import { usePairStakingInfo } from './data/useStakingInfo'

import { Token } from '@ubeswap/sdk-core'
import { ButtonEmpty, ButtonPrimary } from 'components-old/Button'
import { AutoColumn } from 'components-old/Column'
import DoubleCurrencyLogo from 'components-old/DoubleLogo'
import { RowBetween, RowFixed } from 'components-old/Row'
import ClaimRewardModal from 'components-old/earn/ClaimRewardModal'
import StakingModal from 'components-old/earn/StakingModal'
import UnstakingModal from 'components-old/earn/UnstakingModal'
import { CardBGImage, CardNoise, CardSection, DataCard } from 'components-old/earn/styled'
import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { useCurrency } from 'hooks/Tokens'
import { useColor } from 'hooks/useColor'
import usePrevious from 'hooks/usePrevious'
import { useTokenBalance } from 'lib/hooks/useCurrencyBalance'
import { ExternalLink as ExternalLinkIcon } from 'react-feather'
import { useParams } from 'react-router-dom'
import { ThemedText } from 'theme/components'
import { currencyId } from 'utils/currencyId'
import { usePair } from './data/Reserves'
import { usePairMultiStakingInfo } from './data/stakeHooks'
import { useCustomStakingInfo } from './data/useCustomStakingInfo'
import { useStakingPoolValue } from './data/useStakingPoolValue'

const BIG_INT_SECONDS_IN_WEEK = JSBI.BigInt(60 * 60 * 24 * 7)

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

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToLarge`
    flex-direction: column;
    gap: 12px;
  `};
`

export default function Manage() {
  const {
    currencyIdA = '',
    currencyIdB = '',
    stakingAddress = '',
  } = useParams<{
    currencyIdA: string
    currencyIdB: string
    stakingAddress: string
  }>()
  if (!currencyIdA || !currencyIdB || !stakingAddress) {
    console.log('Missing params on Manage')
  }

  const { account } = useWeb3React()

  // get currencies and pair
  const [tokenA, tokenB] = [
    (useCurrency(currencyIdA) as Token) ?? undefined,
    (useCurrency(currencyIdB) as Token) ?? undefined,
  ]

  const [, stakingTokenPair] = usePair(tokenA, tokenB)
  const singleStakingInfo = usePairStakingInfo(stakingTokenPair)
  const multiStakingInfo = usePairMultiStakingInfo(singleStakingInfo, stakingAddress)
  const externalSingleStakingInfo = usePairStakingInfo(stakingTokenPair, stakingAddress)
  const customStakingInfo = useCustomStakingInfo(stakingAddress)
  // Check external before we check single staking
  const stakingInfo = (multiStakingInfo || externalSingleStakingInfo || singleStakingInfo) ?? customStakingInfo

  // detect existing unstaked LP position to show add button if none found
  const userLiquidityUnstaked = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.currency)
  const showAddLiquidityButton = Boolean(stakingInfo?.stakedAmount?.equalTo('0') && userLiquidityUnstaked?.equalTo('0'))

  // toggle for staking modal and unstaking modal
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)

  // fade cards if nothing staked or nothing earned yet
  const disableTop = !stakingInfo?.stakedAmount || stakingInfo.stakedAmount.equalTo(JSBI.BigInt(0))

  const token = tokenA?.equals(CUSD_CELO) ? tokenB : tokenA
  const backgroundColor = useColor(token ?? undefined)

  // get CUSD value of staked LP tokens
  const {
    valueCUSD: valueOfTotalStakedAmountInCUSD,
    userValueCUSD,
    userAmountTokenA,
    userAmountTokenB,
  } = useStakingPoolValue(stakingInfo, stakingTokenPair)

  stakingInfo?.rewardRates?.sort((a, b) =>
    a.multiply(BIG_INT_SECONDS_IN_WEEK).lessThan(b.multiply(BIG_INT_SECONDS_IN_WEEK)) ? 1 : -1
  )
  const countUpAmounts =
    stakingInfo?.earnedAmounts
      ?.sort((a, b) => (a.lessThan(b) ? 1 : -1))
      .map((earnedAmount) => earnedAmount.toFixed(6) ?? '0') || []

  const countUpAmountsPrevious = usePrevious(countUpAmounts) ?? countUpAmounts

  const [, toggleAccountDrawer] = useAccountDrawer()

  const handleDepositClick = useCallback(() => {
    if (account) {
      setShowStakingModal(true)
    } else {
      toggleAccountDrawer()
    }
  }, [account, toggleAccountDrawer])

  return (
    <PageWrapper gap="lg" justify="center">
      <RowBetween style={{ gap: '24px' }}>
        <ThemedText.DeprecatedMediumHeader style={{ margin: 0 }}>
          {tokenA?.symbol}-{tokenB?.symbol} {t('liquidity mining')}
        </ThemedText.DeprecatedMediumHeader>
        <DoubleCurrencyLogo currency0={tokenA} currency1={tokenB} size={24} />
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <ThemedText.DeprecatedBody style={{ margin: 0 }}>{t('Total deposits')}</ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody fontSize={24} fontWeight={500}>
              {valueOfTotalStakedAmountInCUSD
                ? `$${
                    valueOfTotalStakedAmountInCUSD.lessThan('1')
                      ? valueOfTotalStakedAmountInCUSD.toFixed(2, {
                          groupSeparator: ',',
                        })
                      : valueOfTotalStakedAmountInCUSD.toFixed(0, {
                          groupSeparator: ',',
                        })
                  }`
                : '-'}
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </PoolData>
        <PoolData>
          <AutoColumn gap="sm">
            {stakingInfo?.active && (
              <>
                <ThemedText.DeprecatedBody style={{ margin: 0 }}>{t('Pool Rate')}</ThemedText.DeprecatedBody>
                {stakingInfo?.totalRewardRates
                  ?.filter((rewardRate) => !rewardRate.equalTo('0'))
                  ?.map((rewardRate) => {
                    return (
                      <ThemedText.DeprecatedBody fontSize={24} fontWeight={500} key={rewardRate.currency.symbol}>
                        {rewardRate?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' }) ?? '-'}
                        {` ${rewardRate.currency.symbol} / week`}
                      </ThemedText.DeprecatedBody>
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
                <ThemedText.DeprecatedWhite fontWeight={600}>
                  Step 1. Get UBE-LP Liquidity tokens
                </ThemedText.DeprecatedWhite>
              </RowBetween>
              <RowBetween style={{ marginBottom: '1rem' }}>
                <ThemedText.DeprecatedWhite fontSize={14}>
                  {`UBE-LP tokens are required. Once you've added liquidity to the ${tokenA?.symbol}-${tokenB?.symbol} pool you can stake your liquidity tokens on this page.`}
                </ThemedText.DeprecatedWhite>
              </RowBetween>
              <ButtonPrimary
                padding="8px"
                borderRadius="8px"
                width="fit-content"
                as={Link}
                to={`/add/v2/${tokenA && currencyId(tokenA)}/${tokenB && currencyId(tokenB)}`}
              >
                {`Add ${tokenA?.symbol}-${tokenB?.symbol} liquidity`}
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
            dummyPair={stakingTokenPair}
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
                  <ThemedText.DeprecatedWhite fontWeight={600}>
                    {t('Your liquidity deposits')}
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <ThemedText.DeprecatedWhite fontSize={36} fontWeight={600}>
                    {stakingInfo?.stakedAmount?.toSignificant(6) ?? '-'}
                  </ThemedText.DeprecatedWhite>
                  <RowFixed>
                    <ThemedText.DeprecatedWhite>
                      UBE-LP {tokenA?.symbol}-{tokenB?.symbol}
                    </ThemedText.DeprecatedWhite>
                    {stakingInfo && stakingInfo.stakingToken && (
                      <PairLinkIcon
                        href={`https://info.ubeswap.org/pair/${stakingInfo.stakingToken.address.toLowerCase()}`}
                      />
                    )}
                  </RowFixed>
                </RowBetween>
                {stakingInfo?.stakedAmount && stakingInfo.stakedAmount.greaterThan('0') && (
                  <RowBetween>
                    <RowFixed>
                      <ThemedText.DeprecatedWhite>
                        {t('Current value')}:{' '}
                        {userValueCUSD
                          ? `$${userValueCUSD.toFixed(2, {
                              separator: ',',
                            })}`
                          : '--'}
                      </ThemedText.DeprecatedWhite>
                      <StakedAmountsHelper userAmountTokenA={userAmountTokenA} userAmountTokenB={userAmountTokenB} />
                    </RowFixed>
                  </RowBetween>
                )}
              </AutoColumn>
            </CardSection>
          </StyledDataCard>
          <StyledBottomCard dim={stakingInfo?.stakedAmount?.equalTo(JSBI.BigInt(0))}>
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <ThemedText.DeprecatedBlack>{t('Your unclaimed rewards')}</ThemedText.DeprecatedBlack>
                </div>
                {stakingInfo?.earnedAmounts?.some((earnedAmount) =>
                  JSBI.notEqual(JSBI.BigInt(0), earnedAmount?.quotient)
                ) && (
                  <ButtonEmpty
                    padding="8px"
                    borderRadius="8px"
                    width="fit-content"
                    onClick={() => setShowClaimRewardModal(true)}
                  >
                    {t('Claim')}
                  </ButtonEmpty>
                )}
              </RowBetween>
              {stakingInfo?.rewardRates
                // show if rewards are more than zero or unclaimed are greater than zero
                ?.filter((rewardRate, idx) => rewardRate.greaterThan('0') || countUpAmounts[idx])
                ?.map((rewardRate, idx) => (
                  <RowBetween style={{ alignItems: 'baseline' }} key={rewardRate.currency.symbol}>
                    <ThemedText.DeprecatedLargeHeader fontSize={36} fontWeight={600}>
                      {countUpAmounts[idx] ? (
                        <CountUp
                          key={countUpAmounts[idx]}
                          isCounting
                          decimalPlaces={parseFloat(countUpAmounts[idx]) < 0.0001 ? 6 : 4}
                          start={parseFloat(countUpAmountsPrevious[idx] || countUpAmounts[idx])}
                          end={parseFloat(countUpAmounts[idx])}
                          thousandsSeparator=","
                          duration={1}
                        />
                      ) : (
                        '0'
                      )}
                    </ThemedText.DeprecatedLargeHeader>
                    <ThemedText.DeprecatedBlack fontSize={16} fontWeight={500}>
                      <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                        ⚡
                      </span>
                      {stakingInfo?.active
                        ? rewardRate.multiply(BIG_INT_SECONDS_IN_WEEK)?.toSignificant(4, { groupSeparator: ',' }) ?? '-'
                        : '0'}
                      {` ${rewardRate.currency.symbol} / ${t('week')}`}
                    </ThemedText.DeprecatedBlack>
                  </RowBetween>
                ))}
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>
        <ThemedText.DeprecatedMain style={{ textAlign: 'center' }} fontSize={14}>
          <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
            ⭐️
          </span>
          {t('When you withdraw, the contract will automagically claim UBE on your behalf!')}
        </ThemedText.DeprecatedMain>

        {!showAddLiquidityButton && (
          <DataRow style={{ marginBottom: '1rem' }}>
            {stakingInfo && stakingInfo.active && (
              <ButtonPrimary padding="8px" borderRadius="8px" width="160px" onClick={handleDepositClick}>
                {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0))
                  ? t('Deposit')
                  : `${t('Deposit')} UBE-LP Tokens`}
              </ButtonPrimary>
            )}

            {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) && (
              <>
                <ButtonPrimary
                  padding="8px"
                  borderRadius="8px"
                  width="160px"
                  onClick={() => setShowUnstakingModal(true)}
                >
                  {t('Withdraw')}
                </ButtonPrimary>
              </>
            )}
            {stakingInfo && !stakingInfo.active && (
              <ThemedText.DeprecatedMain style={{ textAlign: 'center' }} fontSize={14}>
                Staking Rewards inactive for this pair.
              </ThemedText.DeprecatedMain>
            )}
          </DataRow>
        )}
        {!userLiquidityUnstaked ? null : userLiquidityUnstaked.equalTo('0') ? null : !stakingInfo?.active ? null : (
          <ThemedText.DeprecatedMain>
            {userLiquidityUnstaked.toSignificant(6)} UBE LP tokens available
          </ThemedText.DeprecatedMain>
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
