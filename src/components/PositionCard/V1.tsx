import { Token, TokenAmount, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import { Text } from 'rebass'

import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'

import { useActiveWeb3React } from '../../hooks'
import { ButtonSecondary } from '../Button'
import { AutoColumn } from '../Column'
import DoubleCurrencyLogo from '../DoubleLogo'
import { RowBetween, RowFixed } from '../Row'
import { FixedHeightRow, HoverCard } from './index'

interface PositionCardProps extends RouteComponentProps {
  token: Token
  V1LiquidityBalance: TokenAmount
}

function V1PositionCard({ token, V1LiquidityBalance }: PositionCardProps) {
  const theme = useTheme()

  const { chainId } = useActiveWeb3React()
  const { mixpanelHandler } = useMixpanel()

  return (
    <HoverCard>
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <RowFixed>
            <DoubleCurrencyLogo currency0={token} margin={true} size={20} />
            <Text fontWeight={500} fontSize={20} style={{ marginLeft: '' }}>
              {`${chainId && token.equals(WETH[chainId]) ? 'WETH' : token.symbol}/ETH`}
            </Text>
            <Text
              fontSize={12}
              fontWeight={500}
              ml="0.5rem"
              px="0.75rem"
              py="0.25rem"
              style={{ borderRadius: '1rem' }}
              backgroundColor={theme.yellow1}
              color={'black'}
            >
              <Trans>V1</Trans>
            </Text>
          </RowFixed>
        </FixedHeightRow>

        <AutoColumn gap="8px">
          <RowBetween marginTop="10px">
            <ButtonSecondary
              width="68%"
              as={Link}
              onClick={() => {
                mixpanelHandler(MIXPANEL_TYPE.MIGRATE_LIQUIDITY_INITIATED)
              }}
              to={`/migrate/v1/${token.address}`}
            >
              <Trans>Migrate</Trans>
            </ButtonSecondary>

            <ButtonSecondary
              style={{ backgroundColor: 'transparent' }}
              width="28%"
              as={Link}
              to={`/remove/v1/${V1LiquidityBalance.currency.address}`}
            >
              <Trans>Remove</Trans>
            </ButtonSecondary>
          </RowBetween>
        </AutoColumn>
      </AutoColumn>
    </HoverCard>
  )
}

export default withRouter(V1PositionCard)
