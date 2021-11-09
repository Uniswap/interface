import { Trans } from '@lingui/macro'
import { Currency, CurrencyAmount, Percent, Token } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import Badge, { BadgeVariant } from 'components/Badge'
import { MouseoverTooltip } from 'components/Tooltip'
import { KROM } from 'constants/tokens'
import { formatUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { transparentize } from 'polished'
import { useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, HelpCircle } from 'react-feather'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled from 'styled-components/macro'

import { BIG_INT_ZERO } from '../../constants/misc'
import { useColor } from '../../hooks/useColor'
import { useTotalSupply } from '../../hooks/useTotalSupply'
import { useActiveWeb3React } from '../../hooks/web3'
import { useTokenBalance } from '../../state/wallet/hooks'
import { ExternalLink, TYPE } from '../../theme'
import { currencyId } from '../../utils/currencyId'
import { unwrappedToken } from '../../utils/unwrappedToken'
import { ButtonEmpty, ButtonPrimary, ButtonSecondary } from '../Button'
import { GreyCard, LightCard } from '../Card'
import { AutoColumn } from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import DoubleCurrencyLogo from '../DoubleLogo'
import { CardNoise } from '../earn/styled'
import { AutoRow, RowBetween, RowFixed } from '../Row'
import { Dots } from '../swap/styleds'

export const FixedHeightRow = styled(RowBetween)`
  height: 24px;
`

const BadgeText = styled.div`
  font-weight: 500;
  font-size: 14px;
`

const StyledPositionCard = styled(LightCard)<{ bgColor: any }>`
  border: none;
  background: ${({ theme, bgColor }) =>
    `radial-gradient(91.85% 100% at 1.84% 0%, ${transparentize(0.8, bgColor)} 0%, ${theme.bg3} 100%) `};
  position: relative;
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
                <Text fontWeight={500} fontSize={16}>
                  <Trans>Your position</Trans>
                </Text>
              </RowFixed>
            </FixedHeightRow>
            <FixedHeightRow onClick={() => setShowMore(!showMore)}>
              <RowFixed>
                <DoubleCurrencyLogo currency0={currency0} currency1={currency1} margin={true} size={20} />
                <Text fontWeight={500} fontSize={20}>
                  {currency0.symbol}/{currency1.symbol}
                </Text>
              </RowFixed>
              <RowFixed>
                <Text fontWeight={500} fontSize={20}>
                  {userPoolBalance ? userPoolBalance.toSignificant(4) : '-'}
                </Text>
              </RowFixed>
            </FixedHeightRow>
            <AutoColumn gap="4px">
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={500}>
                  <Trans>Your pool share:</Trans>
                </Text>
                <Text fontSize={16} fontWeight={500}>
                  {poolTokenPercentage ? poolTokenPercentage.toFixed(6) + '%' : '-'}
                </Text>
              </FixedHeightRow>
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={500}>
                  {currency0.symbol}:
                </Text>
                {token0Deposited ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                      {token0Deposited?.toSignificant(6)}
                    </Text>
                  </RowFixed>
                ) : (
                  '-'
                )}
              </FixedHeightRow>
              <FixedHeightRow>
                <Text fontSize={16} fontWeight={500}>
                  {currency1.symbol}:
                </Text>
                {token1Deposited ? (
                  <RowFixed>
                    <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
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

export default function FullPositionCard({ fundingBalance, minBalance, gasPrice }: FundingCardProps) {
  const showMore = true
  const backgroundColor = useColor(fundingBalance?.currency)

  const { chainId } = useActiveWeb3React()
  const kromToken = chainId ? KROM[chainId] : undefined

  const isUnderfunded = fundingBalance ? minBalance?.greaterThan(fundingBalance?.quotient) : true

  return (
    <StyledPositionCard bgColor={backgroundColor}>
      <CardNoise />
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <RowFixed gap="2px" style={{ marginRight: '10px' }}></RowFixed>
        </FixedHeightRow>

        {showMore && (
          <AutoColumn gap="8px">
            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={16} fontWeight={500}>
                  <Trans>Status:</Trans>
                </Text>
              </RowFixed>

              {isUnderfunded ? (
                <MouseoverTooltip
                  text={<Trans>Your account is underfunded. Please fund it up to the minimum balance.</Trans>}
                >
                  <Badge variant={BadgeVariant.NEGATIVE}>
                    <AlertCircle width={14} height={14} />
                    &nbsp;
                    <BadgeText>
                      <Trans>Underfunded</Trans>
                    </BadgeText>
                  </Badge>
                </MouseoverTooltip>
              ) : (
                <MouseoverTooltip
                  text={<Trans>Your account is activelly monitoring and processing limit orders.</Trans>}
                >
                  <Badge variant={BadgeVariant.POSITIVE}>
                    <AlertCircle width={14} height={14} />
                    &nbsp;
                    <BadgeText>
                      <Trans>Active</Trans>
                    </BadgeText>
                  </Badge>
                </MouseoverTooltip>
              )}
            </FixedHeightRow>
            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={16} fontWeight={500}>
                  <Trans>Balance:</Trans>
                </Text>
              </RowFixed>
              {fundingBalance ? (
                <RowFixed>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {fundingBalance?.toSignificant(6)} {fundingBalance?.currency.symbol}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>
            <FixedHeightRow>
              <RowFixed>
                <Text fontSize={16} fontWeight={500}>
                  <Trans>Minimum Balance:</Trans>
                </Text>
              </RowFixed>
              {minBalance ? (
                <RowFixed>
                  <MouseoverTooltip text={<Trans>Bla bla bla</Trans>}>
                    <HelpCircle size="20" color={'white'} style={{ marginLeft: '8px' }} />
                  </MouseoverTooltip>
                  <Text fontSize={16} fontWeight={500} marginLeft={'6px'}>
                    {minBalance?.toSignificant(6)} {minBalance?.currency.symbol}
                  </Text>
                </RowFixed>
              ) : (
                '-'
              )}
            </FixedHeightRow>

            <ButtonSecondary padding="8px" $borderRadius="8px">
              <ExternalLink
                style={{ width: '100%', textAlign: 'center' }}
                href={`https://app.uniswap.org/#/swap?inputCurrency=ETH&outputCurrency=${kromToken?.address}`}
              >
                <Trans>
                  Get more KROM tokens here<span style={{ fontSize: '11px' }}>↗</span>
                </Trans>
              </ExternalLink>
            </ButtonSecondary>
          </AutoColumn>
        )}
      </AutoColumn>
    </StyledPositionCard>
  )
}
