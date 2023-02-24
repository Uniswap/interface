import { t } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import Row, { AutoRow } from 'components/Row'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
// import { DeltaArrow, formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { PortfolioBalancesQuery, usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'
import { PercentChange } from 'nft/components/collection/CollectionStats'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'
import { switchChain } from 'utils/switchChain'

import { PortfolioArrow } from '../AuthenticatedHeader'

const Wrapper = styled.div`
  border-radius: 12px;
  margin-right: -8px;
  margin-left: -8px;
  width: calc(100% + 16px);
`

export default function Tokens({ account }: { account: string }) {
  const { data } = usePortfolioBalancesQuery({ variables: { ownerAddress: account } })
  return (
    <Wrapper>
      {data?.portfolios?.[0].tokenBalances?.map(
        (tokenBalance) =>
          tokenBalance.token && <PortfolioRow key={tokenBalance.id} {...tokenBalance} token={tokenBalance.token} />
      )}
    </Wrapper>
  )
}

const RowWrapper = styled(Row)`
  gap: 8px;
  height: 56px;
  padding: 8px 8px;

  transition: ${({ theme }) => `${theme.transition.duration.medium} ${theme.transition.timing.ease} background-color`};

  &:hover {
    background: ${({ theme }) => theme.hoverDefault};
  }
`
const TokenBalanceText = styled(ThemedText.Caption)`
  ${EllipsisStyle}
  color: ${({ theme }) => theme.textSecondary};
`

type TokenBalance = NonNullable<
  NonNullable<NonNullable<PortfolioBalancesQuery['portfolios']>[number]>['tokenBalances']
>[number]

type PortfolioToken = NonNullable<TokenBalance['token']>

function PortfolioRow({ token, quantity, denominatedValue }: TokenBalance & { token: PortfolioToken }) {
  const [showSwap, setShowSwap] = useState(false)
  const swapOnHover = { onMouseEnter: () => setShowSwap(true), onMouseLeave: () => setShowSwap(false) }

  return (
    <RowWrapper {...swapOnHover}>
      <QueryTokenLogo token={token} size="36px" />
      <AutoColumn grow>
        <ThemedText.SubHeaderSmall color="textPrimary">{token?.name}</ThemedText.SubHeaderSmall>
        <TokenBalanceText>
          {formatNumber(quantity, NumberType.TokenNonTx)} {token?.symbol}
        </TokenBalanceText>
      </AutoColumn>
      <AutoColumn justify="end">
        {showSwap ? (
          <MiniSwapButton token={token} />
        ) : (
          <>
            <ThemedText.SubHeaderSmall color="textPrimary">
              {formatNumber(denominatedValue?.value, NumberType.PortfolioBalance)}
            </ThemedText.SubHeaderSmall>
            {!!token?.market?.pricePercentChange?.value && (
              <AutoRow justify="flex-end">
                <PortfolioArrow change={token.market.pricePercentChange.value} size={16} strokeWidth={1.5} />
                <ThemedText.Caption>
                  <PercentChange isNegative={token.market.pricePercentChange.value < 0}>
                    {formatDelta(token.market.pricePercentChange.value)}
                  </PercentChange>
                </ThemedText.Caption>
              </AutoRow>
            )}
          </>
        )}
      </AutoColumn>
    </RowWrapper>
  )
}

function MiniSwapButton({ token }: { token: PortfolioToken }) {
  const { chainId: walletChainId, connector } = useWeb3React()
  const tokenChainId = CHAIN_NAME_TO_CHAIN_ID[token.chain]
  const navigate = useNavigate()

  const navigateToSwap = useCallback(async () => {
    if (CHAIN_NAME_TO_CHAIN_ID[token.chain] !== walletChainId) await switchChain(connector, tokenChainId)
    navigate(`/swap?inputCurrency=${token?.address ?? 'ETH'}`)
  }, [connector, navigate, token?.address, token.chain, tokenChainId, walletChainId])

  return (
    <ButtonLight onClick={navigateToSwap} width="fit-content" padding="8px" $borderRadius="12px">
      <ThemedText.Link>{t`Swap`}</ThemedText.Link>
    </ButtonLight>
  )
}
