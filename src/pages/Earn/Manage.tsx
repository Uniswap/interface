import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import JSBI from 'jsbi'
import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import styled from 'styled-components/macro'
import { CountUp } from 'use-count-up'

import { ButtonEmpty, ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import ClaimRewardModal from '../../components/earn/ClaimRewardModal'
import StakingModal from '../../components/earn/StakingModal'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import UnstakingModal from '../../components/earn/UnstakingModal'
import { RowBetween } from '../../components/Row'
import { BIG_INT_SECONDS_IN_WEEK, BIG_INT_ZERO } from '../../constants/misc'
import { useCurrency } from '../../hooks/Tokens'
import { useColor } from '../../hooks/useColor'
import usePrevious from '../../hooks/usePrevious'
import useStablecoinPrice from '../../hooks/useStablecoinPrice'
import { useTotalSupply } from '../../hooks/useTotalSupply'
import { useV2Pair } from '../../hooks/useV2Pairs'
import { useToggleWalletModal } from '../../state/application/hooks'
import { useTokenBalance } from '../../state/connection/hooks'
import { useStakingInfo } from '../../state/stake/hooks'
import { ThemedText } from '../../theme'
import { currencyId } from '../../utils/currencyId'

const PageWrapper = styled(AutoColumn)`
  padding: 68px 8px 0px;
  max-width: 640px;
  width: 100%;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.md}px`}) {
    padding: 48px 8px 0px;
  }

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    padding-top: 20px;
  }
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
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: ${({ theme, bgColor, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%,  ${
      showBackground ? theme.deprecated_black : theme.deprecated_bg5
    } 100%) `};
`

const StyledBottomCard = styled(DataCard)<{ dim: any }>`
  background: ${({ theme }) => theme.deprecated_bg3};
  opacity: ${({ dim }) => (dim ? 0.4 : 1)};
  margin-top: -40px;
  padding: 0 1.25rem 1rem 1.25rem;
  padding-top: 32px;
  z-index: 1;
`

const PoolData = styled(DataCard)`
  background: none;
  border: 1px solid ${({ theme }) => theme.deprecated_bg4};
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

  ${({ theme }) => theme.deprecated_mediaWidth.deprecated_upToSmall`
    flex-direction: column;
    gap: 12px;
  `};
`

export default function Manage() {
  const { currencyIdA, currencyIdB } = useParams<{ currencyIdA: string; currencyIdB: string }>()
  const { account } = useWeb3React()

  // get currencies and pair
  const [currencyA, currencyB] = [useCurrency(currencyIdA), useCurrency(currencyIdB)]
  const tokenA = (currencyA ?? undefined)?.wrapped
  const tokenB = (currencyB ?? undefined)?.wrapped

  const [, stakingTokenPair] = useV2Pair(tokenA, tokenB)
  const stakingInfo = useStakingInfo(stakingTokenPair)?.[0]

  // detect existing unstaked LP position to show add button if none found
  const userLiquidityUnstaked = useTokenBalance(account ?? undefined, stakingInfo?.stakedAmount?.currency)
  const showAddLiquidityButton = Boolean(stakingInfo?.stakedAmount?.equalTo('0') && userLiquidityUnstaked?.equalTo('0'))

  // toggle for staking modal and unstaking modal
  const [showStakingModal, setShowStakingModal] = useState(false)
  const [showUnstakingModal, setShowUnstakingModal] = useState(false)
  const [showClaimRewardModal, setShowClaimRewardModal] = useState(false)

  // fade cards if nothing staked or nothing earned yet
  const disableTop = !stakingInfo?.stakedAmount || stakingInfo.stakedAmount.equalTo(JSBI.BigInt(0))

  const token = currencyA?.isNative ? tokenB : tokenA
  const WETH = currencyA?.isNative ? tokenA : tokenB
  const backgroundColor = useColor(token)

  // get WETH value of staked LP tokens
  const totalSupplyOfStakingToken = useTotalSupply(stakingInfo?.stakedAmount?.currency)
  let valueOfTotalStakedAmountInWETH: CurrencyAmount<Token> | undefined
  if (totalSupplyOfStakingToken && stakingTokenPair && stakingInfo && WETH) {
    // take the total amount of LP tokens staked, multiply by ETH value of all LP tokens, divide by all LP tokens
    valueOfTotalStakedAmountInWETH = CurrencyAmount.fromRawAmount(
      WETH,
      JSBI.divide(
        JSBI.multiply(
          JSBI.multiply(stakingInfo.totalStakedAmount.quotient, stakingTokenPair.reserveOf(WETH).quotient),
          JSBI.BigInt(2) // this is b/c the value of LP shares are ~double the value of the WETH they entitle owner to
        ),
        totalSupplyOfStakingToken.quotient
      )
    )
  }

  const countUpAmount = stakingInfo?.earnedAmount?.toFixed(6) ?? '0'
  const countUpAmountPrevious = usePrevious(countUpAmount) ?? '0'

  // get the USD value of staked WETH
  const USDPrice = useStablecoinPrice(WETH)
  const valueOfTotalStakedAmountInUSDC =
    valueOfTotalStakedAmountInWETH && USDPrice?.quote(valueOfTotalStakedAmountInWETH)

  const toggleWalletModal = useToggleWalletModal()

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
        <ThemedText.DeprecatedMediumHeader style={{ margin: 0 }}>
          <Trans>
            {currencyA?.symbol}-{currencyB?.symbol} Liquidity Mining
          </Trans>
        </ThemedText.DeprecatedMediumHeader>
        <DoubleCurrencyLogo currency0={currencyA ?? undefined} currency1={currencyB ?? undefined} size={24} />
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <ThemedText.DeprecatedBody style={{ margin: 0 }}>
              <Trans>Total deposits</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody fontSize={24} fontWeight={500}>
              {valueOfTotalStakedAmountInUSDC
                ? `$${valueOfTotalStakedAmountInUSDC.toFixed(0, { groupSeparator: ',' })}`
                : `${valueOfTotalStakedAmountInWETH?.toSignificant(4, { groupSeparator: ',' }) ?? '-'} ETH`}
            </ThemedText.DeprecatedBody>
          </AutoColumn>
        </PoolData>
        <PoolData>
          <AutoColumn gap="sm">
            <ThemedText.DeprecatedBody style={{ margin: 0 }}>
              <Trans>Pool Rate</Trans>
            </ThemedText.DeprecatedBody>
            <ThemedText.DeprecatedBody fontSize={24} fontWeight={500}>
              {stakingInfo?.active ? (
                <Trans>
                  {stakingInfo.totalRewardRate?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' })}{' '}
                  UNI / week
                </Trans>
              ) : (
                <Trans>0 UNI / week</Trans>
              )}
            </ThemedText.DeprecatedBody>
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
                  <Trans>Step 1. Get UNI-V2 Liquidity tokens</Trans>
                </ThemedText.DeprecatedWhite>
              </RowBetween>
              <RowBetween style={{ marginBottom: '1rem' }}>
                <ThemedText.DeprecatedWhite fontSize={14}>
                  <Trans>
                    UNI-V2 LP tokens are required. Once you&apos;ve added liquidity to the {currencyA?.symbol}-
                    {currencyB?.symbol} pool you can stake your liquidity tokens on this page.
                  </Trans>
                </ThemedText.DeprecatedWhite>
              </RowBetween>
              <ButtonPrimary
                padding="8px"
                $borderRadius="8px"
                width={'fit-content'}
                as={Link}
                to={`/add/${currencyA && currencyId(currencyA)}/${currencyB && currencyId(currencyB)}`}
              >
                <Trans>
                  Add {currencyA?.symbol}-{currencyB?.symbol} liquidity
                </Trans>
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
              <CardBGImage desaturate />
              <CardNoise />
              <AutoColumn gap="md">
                <RowBetween>
                  <ThemedText.DeprecatedWhite fontWeight={600}>
                    <Trans>Your liquidity deposits</Trans>
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <ThemedText.DeprecatedWhite fontSize={36} fontWeight={600}>
                    {stakingInfo?.stakedAmount?.toSignificant(6) ?? '-'}
                  </ThemedText.DeprecatedWhite>
                  <ThemedText.DeprecatedWhite>
                    <Trans>
                      UNI-V2 {currencyA?.symbol}-{currencyB?.symbol}
                    </Trans>
                  </ThemedText.DeprecatedWhite>
                </RowBetween>
              </AutoColumn>
            </CardSection>
          </StyledDataCard>
          <StyledBottomCard dim={stakingInfo?.stakedAmount?.equalTo(JSBI.BigInt(0))}>
            <CardBGImage desaturate />
            <CardNoise />
            <AutoColumn gap="sm">
              <RowBetween>
                <div>
                  <ThemedText.DeprecatedBlack>
                    <Trans>Your unclaimed UNI</Trans>
                  </ThemedText.DeprecatedBlack>
                </div>
                {stakingInfo?.earnedAmount && JSBI.notEqual(BIG_INT_ZERO, stakingInfo?.earnedAmount?.quotient) && (
                  <ButtonEmpty
                    padding="8px"
                    $borderRadius="8px"
                    width="fit-content"
                    onClick={() => setShowClaimRewardModal(true)}
                  >
                    <Trans>Claim</Trans>
                  </ButtonEmpty>
                )}
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <ThemedText.DeprecatedLargeHeader fontSize={36} fontWeight={600}>
                  <CountUp
                    key={countUpAmount}
                    isCounting
                    decimalPlaces={4}
                    start={parseFloat(countUpAmountPrevious)}
                    end={parseFloat(countUpAmount)}
                    thousandsSeparator={','}
                    duration={1}
                  />
                </ThemedText.DeprecatedLargeHeader>
                <ThemedText.DeprecatedBlack fontSize={16} fontWeight={500}>
                  <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                    ⚡
                  </span>

                  {stakingInfo?.active ? (
                    <Trans>
                      {stakingInfo.rewardRate?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' })}{' '}
                      UNI / week
                    </Trans>
                  ) : (
                    <Trans>0 UNI / week</Trans>
                  )}
                </ThemedText.DeprecatedBlack>
              </RowBetween>
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>
        <ThemedText.DeprecatedMain style={{ textAlign: 'center' }} fontSize={14}>
          <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px' }}>
            ⭐️
          </span>
          <Trans>When you withdraw, the contract will automagically claim UNI on your behalf!</Trans>
        </ThemedText.DeprecatedMain>

        {!showAddLiquidityButton && (
          <DataRow style={{ marginBottom: '1rem' }}>
            {stakingInfo && stakingInfo.active && (
              <ButtonPrimary padding="8px" $borderRadius="8px" width="160px" onClick={handleDepositClick}>
                {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) ? (
                  <Trans>Deposit</Trans>
                ) : (
                  <Trans>Deposit UNI-V2 LP Tokens</Trans>
                )}
              </ButtonPrimary>
            )}

            {stakingInfo?.stakedAmount?.greaterThan(JSBI.BigInt(0)) && (
              <>
                <ButtonPrimary
                  padding="8px"
                  $borderRadius="8px"
                  width="160px"
                  onClick={() => setShowUnstakingModal(true)}
                >
                  <Trans>Withdraw</Trans>
                </ButtonPrimary>
              </>
            )}
          </DataRow>
        )}
        {!userLiquidityUnstaked ? null : userLiquidityUnstaked.equalTo('0') ? null : !stakingInfo?.active ? null : (
          <ThemedText.DeprecatedMain>
            <Trans>{userLiquidityUnstaked.toSignificant(6)} UNI-V2 LP tokens available</Trans>
          </ThemedText.DeprecatedMain>
        )}
      </PositionInfo>
    </PageWrapper>
  )
}
