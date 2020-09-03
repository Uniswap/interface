import React, { useContext } from 'react'
import { Link, RouteComponentProps, withRouter } from 'react-router-dom'
import { Token, TokenAmount, WONE } from '@swoop-exchange/sdk'
import { Text } from 'rebass'
import { AutoColumn } from '../Column'
import { ButtonSecondary } from '../Button'
import { RowBetween, RowFixed } from '../Row'
import { FixedHeightRow, HoverCard } from './index'
import DoubleCurrencyLogo from '../DoubleLogo'
import { ThemeContext } from 'styled-components'

import { useActiveHmyReact } from '../../hooks'

interface PositionCardProps extends RouteComponentProps<{}> {
  token: Token
  V1LiquidityBalance: TokenAmount
}

function V1PositionCard({ token, V1LiquidityBalance }: PositionCardProps) {
  const theme = useContext(ThemeContext)

  const { chainId } = useActiveHmyReact();
  // @ts-ignore
  var wone: any = WONE[chainId];

  return (
    <HoverCard>
      <AutoColumn gap="12px">
        <FixedHeightRow>
          <RowFixed>
            <DoubleCurrencyLogo currency0={token} margin={true} size={20} />
            <Text fontWeight={500} fontSize={20} style={{ marginLeft: '' }}>
              {`${chainId && token.equals(wone) ? 'WONE' : token.symbol}/ONE`}
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
              V1
            </Text>
          </RowFixed>
        </FixedHeightRow>

        <AutoColumn gap="8px">
          <RowBetween marginTop="10px">
            <ButtonSecondary width="68%" as={Link} to={`/migrate/v1/${V1LiquidityBalance.token.address}`}>
              Migrate
            </ButtonSecondary>

            <ButtonSecondary
              style={{ backgroundColor: 'transparent' }}
              width="28%"
              as={Link}
              to={`/remove/v1/${V1LiquidityBalance.token.address}`}
            >
              Remove
            </ButtonSecondary>
          </RowBetween>
        </AutoColumn>
      </AutoColumn>
    </HoverCard>
  )
}

export default withRouter(V1PositionCard)
