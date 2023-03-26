import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { KROM } from 'constants/tokens'
import JSBI from 'jsbi'
import { useCallback, useState } from 'react'
import { Link, RouteComponentProps } from 'react-router-dom'
import { useSingleCallResult } from 'state/multicall/hooks'
import styled from 'styled-components/macro'
import Web3 from 'web3-utils'

import { ButtonPrimary } from '../../components/Button'
import { AutoColumn } from '../../components/Column'
import DoubleCurrencyLogo from '../../components/DoubleLogo'
import ClaimRewardModal from '../../components/earn/ClaimRewardModal'
import StakingModal from '../../components/earn/StakingModal'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../../components/earn/styled'
import UnstakingModal from '../../components/earn/UnstakingModal'
import { RowBetween, RowFixed } from '../../components/Row'
import { BIG_INT_SECONDS_IN_WEEK } from '../../constants/misc'
import { useCurrency } from '../../hooks/Tokens'
import { useColor } from '../../hooks/useColor'
import { useNewStakingContract } from '../../hooks/useContract'
import usePrevious from '../../hooks/usePrevious'
import { useTotalSupply } from '../../hooks/useTotalSupply'
import useUSDCPrice from '../../hooks/useUSDCPrice'
import { useV2Pair } from '../../hooks/useV2Pairs'
import { useActiveWeb3React } from '../../hooks/web3'
import { useWalletModalToggle } from '../../state/application/hooks'
import { useStakingInfo } from '../../state/stake/hooks'
import { useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { currencyId } from '../../utils/currencyId'

const TitleRow = styled(RowBetween)`
  color: ${({ theme }) => theme.text2};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex-wrap: wrap;
    gap: 12px;
    width: 100%;
  `};
`
const ResponsiveButtonPrimary = styled(ButtonPrimary)`
  border-radius: 20px;
  padding: 6px 8px;
  width: fit-content;
  margin-left: 8px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    flex: 1 1 auto;
    width: 100%;
  `};
`

const ButtonRow = styled(RowFixed)`
  & > *:not(:last-child) {
    margin-left: 8px;
  }

  ${({ theme }) => theme.mediaWidth.upToSmall`
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    flex-direction: row-reverse;
  `};
`

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
  border-radius: 20px;
  width: 100%;
  position: relative;
`

const StyledDataCard = styled(DataCard)<{ bgColor?: any; showBackground?: any }>`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #1e1a31 0%, #3d51a5 100%);
  z-index: 2;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
  background: ${({ theme, bgColor, showBackground }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${bgColor} 0%,  ${showBackground ? theme.black : theme.bg5} 100%) `};
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

export default function Manage({
  match: {
    params: { currencyIdA, currencyIdB },
  },
}: RouteComponentProps<{ currencyIdA: string; currencyIdB: string }>) {
  const { account, chainId } = useActiveWeb3React()
  const stake = useNewStakingContract()
  const kromToken = chainId ? KROM[chainId] : undefined

  let result = useSingleCallResult(stake, 'getDepositedAmount', [account?.toString()])
  let stakedBalance = result.result ? Web3.fromWei(result.result.toString()) : ''
  stakedBalance = Number(stakedBalance).toFixed(4)

  result = useSingleCallResult(stake, 'getEarnedSKrom', [account?.toString()])
  //let earnedSKrom = result.result ? Web3.fromWei(result.result.toString()) : ''
  //earnedSKrom = Number(earnedSKrom).toFixed(4)
  const earnedSKrom = 123

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
  const USDPrice = useUSDCPrice(WETH)
  const valueOfTotalStakedAmountInUSDC =
    valueOfTotalStakedAmountInWETH && USDPrice?.quote(valueOfTotalStakedAmountInWETH)

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
          <Trans>Staking - make it bigger, maybe positioned at the centre</Trans>
        </TYPE.mediumHeader>
        <DoubleCurrencyLogo currency0={currencyA ?? undefined} currency1={currencyB ?? undefined} size={24} />
      </RowBetween>

      <DataRow style={{ gap: '24px' }}>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>
              <Trans>Staked Balance:</Trans>
            </TYPE.body>
            <TYPE.body fontSize={[14, 18, 24]} fontWeight={400}>
              {stakedBalance
                ? `${stakedBalance} KROM`
                : `${valueOfTotalStakedAmountInWETH?.toSignificant(4, { groupSeparator: ',' }) ?? '-'} ETH`}
            </TYPE.body>
          </AutoColumn>
        </PoolData>
        <PoolData>
          <AutoColumn gap="sm">
            <TYPE.body style={{ margin: 0 }}>
              <Trans>Total Value Staked</Trans>
            </TYPE.body>
            <TYPE.body fontSize={[14, 18, 24]} fontWeight={400}>
              888888 KROM
            </TYPE.body>
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
                <TYPE.white fontWeight={600}>
                  <Trans>Step 1. Get UNI-V2 Liquidity tokens</Trans>
                </TYPE.white>
              </RowBetween>
              <RowBetween style={{ marginBottom: '1rem' }}>
                <TYPE.white fontSize={[10, 12, 14]}>
                  <Trans>
                    UNI-V2 LP tokens are required. Once you&apos;ve added liquidity to the {currencyA?.symbol}-
                    {currencyB?.symbol} pool you can stake your liquidity tokens on this page.
                  </Trans>
                </TYPE.white>
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
                  <TYPE.white fontWeight={600}>
                    <Trans>APY - add explanational tooltip</Trans>
                  </TYPE.white>
                </RowBetween>
                <RowBetween style={{ alignItems: 'baseline' }}>
                  <TYPE.white fontSize={[24, 28, 36]} fontWeight={600}>
                    100%
                  </TYPE.white>
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
                  <TYPE.black>
                    <Trans>Earned sKrom</Trans>
                  </TYPE.black>
                </div>
                {/* {earnedSKrom && 0 < +earnedSKrom && (
                  <ButtonEmpty
                    padding="8px"
                    $borderRadius="8px"
                    width="fit-content"
                    onClick={() => setShowClaimRewardModal(true)}
                  >
                    <Trans>Claim - maybe should be deleted</Trans>
                  </ButtonEmpty> 
                )} */}
              </RowBetween>
              <RowBetween style={{ alignItems: 'baseline' }}>
                <TYPE.largeHeader fontSize={[24, 28, 36]} fontWeight={600}>
                  {earnedSKrom}
                </TYPE.largeHeader>
                <TYPE.black fontSize={[12, 14, 16]} fontWeight={400}>
                  <span role="img" aria-label="wizard-icon" style={{ marginRight: '8px ' }}>
                    ⚡
                  </span>

                  {stakingInfo?.active ? (
                    <Trans>
                      {stakingInfo.rewardRate?.multiply(BIG_INT_SECONDS_IN_WEEK)?.toFixed(0, { groupSeparator: ',' })}{' '}
                      sKrom / week
                    </Trans>
                  ) : (
                    <Trans>0 sKrom / week</Trans>
                  )}
                </TYPE.black>
              </RowBetween>
            </AutoColumn>
          </StyledBottomCard>
        </BottomSection>
        <AutoColumn gap="lg">
          <AutoColumn gap="lg" style={{ width: '100%' }}>
            <TitleRow style={{ marginTop: '1rem', alignContent: 'space-between' }} padding={'10'}>
              <ButtonRow>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to={`/stake/${kromToken?.address}`}>
                  + <Trans>Stake KROM</Trans>
                </ResponsiveButtonPrimary>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to={`/unstake/${kromToken?.address}/remove`}>
                  - <Trans>Unstake KROM</Trans>
                </ResponsiveButtonPrimary>
                <ResponsiveButtonPrimary id="join-pool-button" as={Link} to={`/unstake/${kromToken?.address}/remove`}>
                  - <Trans>Claim KROM</Trans>
                </ResponsiveButtonPrimary>
              </ButtonRow>
            </TitleRow>
          </AutoColumn>
        </AutoColumn>

        {showAddLiquidityButton && (
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
          <TYPE.main>
            <Trans>{userLiquidityUnstaked.toSignificant(6)} UNI-V2 LP tokens available</Trans>
          </TYPE.main>
        )}
      </PositionInfo>
    </PageWrapper>
  )
}
