import { t } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { ButtonLight } from 'components/Button'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import Row from 'components/Row'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { PortfolioBalancesQuery, usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'

import { useToggleWalletDrawer } from '..'
import { PortfolioArrow } from '../AuthenticatedHeader'
import PortfolioRow from './PortfolioRow'

export default function Tokens({ account }: { account: string }) {
  const { data } = usePortfolioBalancesQuery({ variables: { ownerAddress: account } })
  return (
    <>
      {data?.portfolios?.[0].tokenBalances?.map(
        (tokenBalance) =>
          tokenBalance.token && <TokenRow key={tokenBalance.id} {...tokenBalance} token={tokenBalance.token} />
      )}
    </>
  )
}

const TokenBalanceText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`

type TokenBalance = NonNullable<
  NonNullable<NonNullable<PortfolioBalancesQuery['portfolios']>[number]>['tokenBalances']
>[number]

type PortfolioToken = NonNullable<TokenBalance['token']>

function TokenRow({ token, quantity, denominatedValue }: TokenBalance & { token: PortfolioToken }) {
  const [showSwap, setShowSwap] = useState(false)
  const percentChange = token.market?.pricePercentChange?.value ?? 0

  return (
    <PortfolioRow
      setIsHover={setShowSwap}
      left={<QueryTokenLogo token={token} size="40px" />}
      title={<ThemedText.SubHeader fontWeight={500}>{token?.name}</ThemedText.SubHeader>}
      descriptor={
        <TokenBalanceText>
          {formatNumber(quantity, NumberType.TokenNonTx)} {token?.symbol}
        </TokenBalanceText>
      }
      right={
        showSwap ? (
          <MiniSwapButton token={token} />
        ) : (
          denominatedValue && (
            <>
              <ThemedText.SubHeader fontWeight={500}>
                {formatNumber(denominatedValue?.value, NumberType.PortfolioBalance)}
              </ThemedText.SubHeader>
              <Row justify="flex-end">
                <PortfolioArrow change={percentChange} size={20} strokeWidth={1.75} />
                <ThemedText.BodySecondary>{formatDelta(percentChange)}</ThemedText.BodySecondary>
              </Row>
            </>
          )
        )
      }
    />
  )
}

function MiniSwapButton({ token }: { token: PortfolioToken }) {
  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleWalletDrawer()

  const navigateToSwap = useCallback(async () => {
    navigate(getTokenDetailsURL(token))
    toggleWalletDrawer()
  }, [navigate, token, toggleWalletDrawer])

  return (
    <ButtonLight onClick={navigateToSwap} width="fit-content" padding="8px" $borderRadius="12px">
      <ThemedText.Link>{t`Swap`}</ThemedText.Link>
    </ButtonLight>
  )
}
