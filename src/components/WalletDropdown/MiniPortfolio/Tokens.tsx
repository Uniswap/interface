import { t } from '@lingui/macro'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import { ButtonLight } from 'components/Button'
import QueryTokenLogo from 'components/Logo/QueryTokenLogo'
import { AutoRow } from 'components/Row'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { PortfolioBalancesQuery, usePortfolioBalancesQuery } from 'graphql/data/__generated__/types-and-hooks'
import { CHAIN_NAME_TO_CHAIN_ID } from 'graphql/data/util'
import { PercentChange } from 'nft/components/collection/CollectionStats'
import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'
import { switchChain } from 'utils/switchChain'

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

const TokenBalanceText = styled(ThemedText.Caption)`
  ${EllipsisStyle}
  color: ${({ theme }) => theme.textSecondary};
`

type TokenBalance = NonNullable<
  NonNullable<NonNullable<PortfolioBalancesQuery['portfolios']>[number]>['tokenBalances']
>[number]

type PortfolioToken = NonNullable<TokenBalance['token']>

function TokenRow({ token, quantity, denominatedValue }: TokenBalance & { token: PortfolioToken }) {
  const [showSwap, setShowSwap] = useState(false)

  return (
    <PortfolioRow
      setIsHover={setShowSwap}
      left={<QueryTokenLogo token={token} size="36px" />}
      title={<ThemedText.SubHeaderSmall color="textPrimary">{token?.name}</ThemedText.SubHeaderSmall>}
      descriptor={
        <TokenBalanceText>
          {formatNumber(quantity, NumberType.TokenNonTx)} {token?.symbol}
        </TokenBalanceText>
      }
      right={
        showSwap ? (
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
        )
      }
    />
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
