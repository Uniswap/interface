import { Trans } from '@lingui/macro'
import { ButtonGroup } from '@material-ui/core'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { MouseoverTooltip } from 'components/Tooltip'
import { KROM } from 'constants/tokens'
import { useNewStakingContract } from 'hooks/useContract'
import useUSDCPrice from 'hooks/useUSDCPrice'
import JSBI from 'jsbi'
import { darken } from 'polished'
import { useEffect, useState } from 'react'
import { HelpCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import { useSingleCallResult } from 'state/multicall/hooks'
import styled from 'styled-components/macro'
import Web3 from 'web3-utils'

import { useTotalSupply } from '../../hooks/useTotalSupply'
import { useV3Positions } from '../../hooks/useV3Positions'
import { useActiveWeb3React } from '../../hooks/web3'
import { useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { unwrappedToken } from '../../utils/unwrappedToken'
import { BaseButton } from '../Button'
import { GreyCard, LightCard } from '../Card'
import { AutoColumn } from '../Column'
import DoubleCurrencyLogo from '../DoubleLogo'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import { RowBetween, RowFixed } from '../Row'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
`
const AccountStatusWrapper = styled(AutoColumn)`
  width: 100%;
  max-width: 100%;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    width: 100%;
  `};
`

const AccountStatusCard = styled(AutoColumn)`
  background-color: ${({ theme }) => theme.bg1};
  box-shadow: 0 0 12px 6px ${({ theme }) => theme.shadow2};
  border-radius: 20px;
  overflow: hidden;
  padding: 24px;
`

const StyledHelperCircle = styled(HelpCircle)`
  size: 24px;
  color: ${({ theme }) => theme.text1};
  margin-left: 8px;
`

const StyledButtonSecondary = styled(BaseButton)`
  color: ${({ theme }) => theme.text1};
  background-color: ${({ theme }) => theme.bg1};
  border: 2px solid ${({ theme }) => theme.shadow3};

  :hover {
    background-color: ${({ theme }) => darken(0.05, theme.primary1)};
    color: ${({ theme }) => theme.white};
  }
`

interface PositionCardProps {
  pair: Pair
  showUnwrapped?: boolean
  border?: string
  stakedBalance?: CurrencyAmount<Token> // optional balance to indicate that liquidity is deposited in mining pool
}

interface FundingCardProps {
  fundingBalance?: CurrencyAmount<Token>
  minBalance?: CurrencyAmount<Token>
  gasPrice?: CurrencyAmount<Currency>
}

export function MinimalPositionCard({ pair, showUnwrapped = false, border }: PositionCardProps) {
  const { account } = useActiveWeb3React()

  const currency0 = showUnwrapped ? pair.token0 : unwrappedToken(pair.token0)
  const currency1 = showUnwrapped ? pair.token1 : unwrappedToken(pair.token1)

  const [showMore, setShowMore] = useState(false)

  const userPoolBalance = useTokenBalance(account ?? undefined, pair.liquidityToken)
  const totalPoolTokens = useTotalSupply(pair.liquidityToken)

  const poolTokenPercentage =
    !!userPoolBalance &&
    !!totalPoolTokens &&
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? new Percent(userPoolBalance.quotient, totalPoolTokens.quotient)
      : undefined

  const [token0Deposited, token1Deposited] =
    !!pair &&
    !!totalPoolTokens &&
    !!userPoolBalance &&
    // this condition is a short-circuit in the case where useTokenBalance updates sooner than useTotalSupply
    JSBI.greaterThanOrEqual(totalPoolTokens.quotient, userPoolBalance.quotient)
      ? [
          pair.getLiquidityValue(pair.token0, totalPoolTokens, userPoolBalance, false),
          pair.getLiquidityValue(pair.token1, totalPoolTokens, userPoolBalance, false),
        ]
      : [undefined, undefined]

  return (
    <>
      {userPoolBalance && JSBI.greaterThan(userPoolBalance.quotient, JSBI.BigInt(0)) ? (
        <GreyCard border={border}>
          <AutoColumn gap="12px">
            <FixedHeightRow>
              <RowFixed>
                <Text fontWeight={400} fontSize={16}>
                  <Trans>Your position</Trans>
                </Text>
              </RowFixed>
            </FixedHeightRow>
            <FixedHeightRow onClick={() => setShowMore(!showMore)}>
              <RowFixed>
                <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={true} size={20} />
                <Text fontWeight={400} fontSize={16}>
                  {currency0.symbol}/{currency1.symbol}
                </Text>
              </RowFixed>
              <RowFixed>
                <Text fontWeight={400} fontSize={16}>
                  {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                </Text>
              </RowFixed>
            </FixedHeightRow>
            <AutoColumn gap="4px">
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={400}>
                  <Trans>Your pool share:</Trans>
                </Text>
                <Text fontSize={16} fontWeight={400}>
                  {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
                </Text>
              </FixedHeightRow>
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={400}>
                  {currency0.symbol}:
                </Text>
                {token0Deposited ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      {token0Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={400}>
                  {currency1.symbol}:
                </Text>
                {token1Deposited ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      {token1Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
            </AutoColumn>
          </AutoColumn>
        </GreyCard>
      ) : (
        <LightCard>
          <TYPE.subHeader style={{ textAlign: 'center' }}>
            <span role="img" aria-label="wizard-icon">
              ⭐️
            </span>{' '}
            <Trans>
              By adding liquidity you&apos;ll earn 0.3% of all trades on this pair proportional to your share of the
              pool. Fees are added to the pool, accrue in real time and can be claimed by withdrawing your liquidity.
            </Trans>{' '}
          </TYPE.subHeader>
        </LightCard>
      )}
    </>
  )
}

export default function FullPositionCard({ fundingBalance }: FundingCardProps) {
  const [depositedFiatBalance, setDepositedFiatBalance] = useState<string>('')
  const [minFiatBalance, setMinFiatBalance] = useState<string>('')

  const { account, chainId } = useActiveWeb3React()
  const { minBalance } = useV3Positions(account)

  const isUnderfunded = fundingBalance ? !minBalance?.lessThan(fundingBalance?.quotient) : true
  const depositedAmount = fundingBalance?.toSignificant(2)

  const kromToken = chainId ? KROM[chainId] : undefined
  const usdcPrice = useUSDCPrice(kromToken ?? undefined)?.toSignificant(4)
  const minBalanceNumber = minBalance?.toSignificant(4) || 0

  useEffect(() => {
    if (!usdcPrice) return
    setDepositedFiatBalance((Number(depositedAmount) * Number(usdcPrice)).toFixed(2))
    setMinFiatBalance((Number(minBalanceNumber) * Number(usdcPrice)).toFixed(2))
  }, [depositedAmount, minBalanceNumber, usdcPrice])

  return (
    <AccountStatusWrapper gap="10px">
      <AccountStatusCard>
        <AutoColumn gap="20px">
          <AutoColumn gap="5px">
            <FixedHeightRow>
              <RowFixed>
                <TYPE.darkGray>
                  <Trans>Account Status:</Trans>
                </TYPE.darkGray>
              </RowFixed>
              <RowFixed>
                <MouseoverTooltip
                  text={
                    <Trans>
                      Please deposit $KROM to process your limit order.
                      <br />
                      <br />
                      Recommendation is to deposit at least twice the minimum balance.
                    </Trans>
                  }
                >
                  <StyledHelperCircle />
                </MouseoverTooltip>
              </RowFixed>
            </FixedHeightRow>
            <RowFixed>
              {isUnderfunded ? (
                <AutoColumn>
                  <RowFixed gap="1rem">
                    <TYPE.error error>
                      <Trans>KROM deposit required</Trans>
                    </TYPE.error>
                  </RowFixed>
                </AutoColumn>
              ) : (
                <RowFixed>
                  <TYPE.success>
                    <Trans>Active</Trans>
                  </TYPE.success>
                </RowFixed>
              )}
            </RowFixed>
          </AutoColumn>
          <AutoColumn>
            <FixedHeightRow>
              <RowFixed>
                <TYPE.darkGray>
                  <Trans>Deposited Balance:</Trans>
                </TYPE.darkGray>
              </RowFixed>
              <RowFixed>
                <MouseoverTooltip
                  text={
                    <Trans>
                      Your account is actively processing trades.
                      <br />
                      <br />
                      Recommendation is to deposit at least twice the minimum balance.
                    </Trans>
                  }
                >
                  <StyledHelperCircle />
                </MouseoverTooltip>
              </RowFixed>
            </FixedHeightRow>
            <FixedHeightRow>
              {fundingBalance ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500}>
                    <TYPE.body>
                      {fundingBalance?.toSignificant(6)} {fundingBalance?.currency.symbol}
                    </TYPE.body>
                  </Text>
                  {depositedFiatBalance && (
                    <Text fontSize={16} fontWeight={500} marginLeft="8px">
                      <TYPE.small>{`($${depositedFiatBalance})`}</TYPE.small>
                    </Text>
                  )}
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
          </AutoColumn>
          <AutoColumn>
            <FixedHeightRow>
              <RowFixed>
                <TYPE.darkGray>
                  <Trans>Minimum Balance:</Trans>
                </TYPE.darkGray>
              </RowFixed>
              <RowFixed>
                <MouseoverTooltip
                  text={
                    <Trans>
                      You will need to maintain a minimum KROM balance to cover for the service fees.
                      <br />
                      <br />
                      Recommendation is to deposit at least twice the minimum balance.
                    </Trans>
                  }
                >
                  <StyledHelperCircle />
                </MouseoverTooltip>
              </RowFixed>
            </FixedHeightRow>
            <FixedHeightRow>
              {fundingBalance ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500}>
                    <TYPE.body>
                      {minBalance?.toSignificant(6)} {minBalance?.currency.symbol}
                    </TYPE.body>
                  </Text>
                  {minFiatBalance && (
                    <Text fontSize={16} fontWeight={500} marginLeft="8px">
                      <TYPE.small>{`($${minFiatBalance})`}</TYPE.small>
                    </Text>
                  )}
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
          </AutoColumn>
        </AutoColumn>
      </AccountStatusCard>
      <ButtonGroup>
        <StyledButtonSecondary as={Link} to={`/balance/deposit/${kromToken?.address}`}>
          <Text fontSize={16} fontWeight={600}>
            <Trans>Deposit KROM</Trans>
          </Text>
        </StyledButtonSecondary>
        <StyledButtonSecondary as={Link} to={`/balance/withdraw/${kromToken?.address}`}>
          <Text fontSize={16} fontWeight={600}>
            <Trans>Withdraw KROM</Trans>
          </Text>
        </StyledButtonSecondary>
      </ButtonGroup>
    </AccountStatusWrapper>
  )
}

export function StakePositionCard({ fundingBalance, minBalance, gasPrice }: FundingCardProps) {
  const stakeManager = useNewStakingContract()
  const showMore = true

  const { account } = useActiveWeb3React()

  let result = useSingleCallResult(stakeManager, 'getEarnedSKrom', [account?.toString()])
  const earnedBalance = result.result ? Web3.fromWei(result.result.toString()) : ''

  result = useSingleCallResult(stakeManager, 'getDepositedAmount', [account?.toString()])
  const stakedBalance = result.result ? Web3.fromWei(result.result.toString()) : ''

  result = useSingleCallResult(stakeManager, 'supplyInWarmup', [])
  const totalValueLocked = result.result ? Web3.fromWei(result.result.toString()) : ''

  return (
    <VoteCard>
      <CardBGImage />
      <CardNoise />
      <CardSection>
        <AutoColumn gap="md">
          <FixedHeightRow>
            <RowFixed gap="2px" style={{ marginRight: '10px' }} />
          </FixedHeightRow>

          {showMore && (
            <AutoColumn gap="8px">
              <FixedHeightRow>
                <RowFixed>
                  <TYPE.body>
                    <Trans>Staked Balance:</Trans>
                  </TYPE.body>
                </RowFixed>
                {stakedBalance != null ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      <TYPE.body>{stakedBalance} KROM</TYPE.body>
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <RowFixed>
                  <TYPE.body>
                    <Trans>Earned Balance:</Trans>
                  </TYPE.body>
                </RowFixed>
                {earnedBalance ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      <TYPE.body>{earnedBalance} KROM </TYPE.body>
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <RowFixed>
                  <TYPE.body>
                    <Trans>APY:</Trans>
                  </TYPE.body>
                  <MouseoverTooltip
                    text={
                      <Trans>
                        APY is calculated as participating percentage in the total value staked. The APY percentage is
                        therefore applied on total amount collected in the Fee Treasury.
                      </Trans>
                    }
                  >
                    <StyledHelperCircle />
                  </MouseoverTooltip>
                </RowFixed>
                {fundingBalance ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      <TYPE.body>
                        {fundingBalance?.toSignificant(6)} {fundingBalance?.currency.symbol}
                      </TYPE.body>
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <RowFixed>
                  <TYPE.body>
                    <Trans>Total Value Locked:</Trans>
                  </TYPE.body>
                </RowFixed>
                {totalValueLocked != null ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      <TYPE.body>{totalValueLocked} KROM</TYPE.body>
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
            </AutoColumn>
          )}
        </AutoColumn>
      </CardSection>
    </VoteCard>
  )
}

function setCollectMigrationHash(hash: any) {
  throw new Error('Function not implemented.')
}

function setCollecting(arg0: boolean) {
  throw new Error('Function not implemented.')
}