import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { MouseoverTooltip } from 'components/Tooltip'
import { KROM } from 'constants/tokens'
import { useNewStakingContract } from 'hooks/useContract'
import JSBI from 'jsbi'
import { useState } from 'react'
import { HelpCircle } from 'react-feather'
import { Text } from 'rebass'
import { useSingleCallResult } from 'state/multicall/hooks'
import styled from 'styled-components/macro'

import { useTotalSupply } from '../../hooks/useTotalSupply'
import { useActiveWeb3React } from '../../hooks/web3'
import { useTokenBalance } from '../../state/wallet/hooks'
import { TYPE } from '../../theme'
import { unwrappedToken } from '../../utils/unwrappedToken'
import { GreyCard, LightCard } from '../Card'
import { AutoColumn } from '../Column'
import DoubleCurrencyLogo from '../DoubleLogo'
import { CardBGImage, CardNoise, CardSection, DataCard } from '../earn/styled'
import { RowBetween, RowFixed } from '../Row'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`

const VoteCard = styled(DataCard)`
  background: radial-gradient(76.02% 75.41% at 1.84% 0%, #27ae60 0%, #000000 100%);
  overflow: hidden;
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

export default function StakePositionCard({ fundingBalance, minBalance, gasPrice }: FundingCardProps) {
  const showMore = true
  const { chainId } = useActiveWeb3React()
  const kromToken = chainId ? KROM[chainId] : undefined

  const stake = useNewStakingContract()

  const result = useSingleCallResult(stake, 'getEarnedSKrom', ['0xc150a57b053fe5dcD83104F69585a282Ea048AC3'])
  const earnedBalance = result.result ? result.result.toString() : ''

  return (
    <VoteCard>
      <CardBGImage />
      <CardNoise />
      <CardSection>
        <AutoColumn gap="md">
          <FixedHeightRow>
            <RowFixed gap="2px" style={{ marginRight: '10px' }}></RowFixed>
          </FixedHeightRow>

          {showMore && (
            <AutoColumn gap="8px">
              <FixedHeightRow>
                <RowFixed>
                  <Text fontSize={16} fontWeight={400}>
                    <TYPE.white>
                      <Trans>Staked Balance:</Trans>
                    </TYPE.white>
                  </Text>
                </RowFixed>
                {earnedBalance != null ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      <TYPE.white>{{ earnedBalance }}</TYPE.white>
                    </Text>
                  </RowFixed>
                ) : (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      <TYPE.white>{{ earnedBalance }}</TYPE.white>
                    </Text>
                  </RowFixed>
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <RowFixed>
                  <Text fontSize={16} fontWeight={400}>
                    <TYPE.white>
                      <Trans>Earned Balance:</Trans>
                    </TYPE.white>
                  </Text>
                </RowFixed>
                {minBalance ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                      <TYPE.white>
                        {minBalance?.toSignificant(6)} {minBalance?.currency.symbol}
                      </TYPE.white>
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <RowFixed>
                  <Text fontSize={16} fontWeight={400}>
                    <TYPE.white>
                      <Trans>APY:</Trans>
                    </TYPE.white>
                  </Text>
                  <MouseoverTooltip
                    text={
                      <Trans>
                        APY is calculated as a participation percentage in relation to the overall staked balance
                        pool.It is updated every 2 weeks.
                      </Trans>
                    }
                  >
                    <HelpCircle size="20" color={'white'} style={{ marginLeft: '8px' }} />
                  </MouseoverTooltip>
                </RowFixed>
                <RowFixed>
                  <Text fontSize={16} fontWeight={400} marginLeft={'6px'}>
                    <TYPE.white>
                      <p>10 KROM</p>
                    </TYPE.white>
                  </Text>
                </RowFixed>
              </FixedHeightRow>
            </AutoColumn>
          )}
        </AutoColumn>
      </CardSection>
    </VoteCard>
  )
}
