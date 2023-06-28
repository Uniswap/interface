import { Token } from '@pollum-io/sdk-core'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
import Row from 'components/Row'
import { formatDelta } from 'components/Tokens/TokenDetails/PriceChart'
import { Chain } from 'graphql/data/__generated__/types-and-hooks'
import { getTokenDetailsURL } from 'graphql/data/util'
import { useNewTopTokens } from 'graphql/tokens/NewTopTokens'
import { TokenData, useFetchedTokenData } from 'graphql/tokens/TokenData'
import { useAtomValue } from 'jotai/utils'
import { useNativeCurrencyBalances, useTokenBalances } from 'lib/hooks/useCurrencyBalance'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { EmptyWalletModule } from 'nft/components/profile/view/EmptyWalletContent'
import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components/macro'
import { EllipsisStyle, ThemedText } from 'theme'

import { useToggleAccountDrawer } from '../..'
import { PortfolioArrow } from '../../AuthenticatedHeader'
import { hideSmallBalancesAtom } from '../../SmallBalanceToggle'
import { ExpandoRow } from '../ExpandoRow'
import { PortfolioLogo } from '../PortfolioLogo'
import PortfolioRow, { PortfolioSkeleton, PortfolioTabWrapper } from '../PortfolioRow'

const HIDE_SMALL_USD_BALANCES_THRESHOLD = 1

function meetsThresholdPegasys(tokenBalance: number, hideSmallBalances: boolean) {
  return !hideSmallBalances || (tokenBalance ?? 0) > HIDE_SMALL_USD_BALANCES_THRESHOLD
}
interface TokenDataOwner {
  token: TokenData
  chainId: number
  decimals: number
  balancePrice: number
  balanceCurrency: number
}

export default function Tokens({ account }: { account: string }) {
  const toggleWalletDrawer = useToggleAccountDrawer()
  const hideSmallBalances = useAtomValue(hideSmallBalancesAtom)
  const [showHiddenTokens, setShowHiddenTokens] = useState(false)

  const { tokens } = useNewTopTokens()
  const nativeBalances = useNativeCurrencyBalances([account])
  const chainId = 570 //useWeb3React()

  const tokensAddress = tokens?.map((token) => token.id) || []
  const ERC20Tokens: Token[] = []
  if (tokens && tokens?.length > 0)
    tokens?.map((token) =>
      ERC20Tokens.push({
        address: token.id,
        chainId,
        symbol: token.symbol,
        name: token.name,
        decimals: Number(token.decimals),
      } as Token)
    )

  const nativeBalancesEntries = Object.entries(nativeBalances)
  if (nativeBalancesEntries && nativeBalancesEntries.length > 0) {
    nativeBalancesEntries?.map((token) =>
      ERC20Tokens.push({
        address: 'NATIVE',
        chainId,
        symbol: token[1]?.currency.symbol,
        name: token[1]?.currency.name,
        decimals: Number(token[1]?.currency.decimals),
      } as Token)
    )
  }
  const tokenBalances = useTokenBalances(account, ERC20Tokens)
  const tokenBalanceEntries = Object.entries(tokenBalances)

  const { loading: tokenDataLoading, data: tokenData } = useFetchedTokenData(tokensAddress)

  const tokenDataMap = useMemo(() => {
    return tokenData ? Object.fromEntries(tokenData.map((token) => [token.address, token])) : {}
  }, [tokenData])

  const portifolio: TokenDataOwner[] = useMemo(() => {
    const newPortifolio = []

    for (const [tokenAddress, balance] of tokenBalanceEntries) {
      const tokenData = tokenDataMap[tokenAddress]
      if (tokenData && balance) {
        newPortifolio.push({
          token: tokenData,
          decimals: balance.currency.decimals,
          chainId: balance.currency.chainId,
          balancePrice: parseFloat(balance?.toExact()) * tokenData.priceUSD,
          balanceCurrency: parseFloat(balance?.toExact()),
        })
      }
    }

    if (nativeBalances) {
      for (const [tokenAddress, balance] of nativeBalancesEntries) {
        if (tokenAddress && balance) {
          const tokenData = tokenDataMap['0x4200000000000000000000000000000000000006']
          const nativeData = {
            ...tokenData,
            name: balance.currency.name,
            address: 'NATIVE',
            symbol: balance.currency.symbol,
          } as TokenData

          newPortifolio.push({
            token: nativeData,
            decimals: balance.currency.decimals,
            chainId: balance.currency.chainId,
            balancePrice: parseFloat(balance?.toExact()) * nativeData.priceUSD,
            balanceCurrency: parseFloat(balance?.toExact()),
          })
        }
      }
    }
    return newPortifolio
  }, [nativeBalances, nativeBalancesEntries, tokenBalanceEntries, tokenDataMap])

  const visibleTokens = useMemo(() => {
    return !hideSmallBalances
      ? portifolio
      : portifolio.filter((token) => meetsThresholdPegasys(token.balancePrice, hideSmallBalances))
  }, [hideSmallBalances, portifolio])

  const hiddenTokens = useMemo(() => {
    return !hideSmallBalances
      ? []
      : portifolio.filter((token) => !meetsThresholdPegasys(token.balancePrice, hideSmallBalances))
  }, [hideSmallBalances, portifolio])

  if (tokenDataLoading) {
    return <PortfolioSkeleton />
  }

  if (portifolio?.length === 0) {
    // TODO: consider launching moonpay here instead of just closing the drawer
    return <EmptyWalletModule type="token" onNavigateClick={toggleWalletDrawer} />
  }

  const toggleHiddenTokens = () => setShowHiddenTokens((showHiddenTokens) => !showHiddenTokens)

  return (
    <PortfolioTabWrapper>
      {visibleTokens.map(
        (tokenBalance) =>
          tokenBalance.token &&
          meetsThresholdPegasys(tokenBalance.balancePrice, hideSmallBalances) && (
            <TokenRow key={tokenBalance.token.address} {...tokenBalance} />
          )
      )}
      <ExpandoRow isExpanded={showHiddenTokens} toggle={toggleHiddenTokens} numItems={hiddenTokens.length}>
        {hiddenTokens.map(
          (tokenBalance) => tokenBalance.token && <TokenRow key={tokenBalance.token.address} {...tokenBalance} />
        )}
      </ExpandoRow>
    </PortfolioTabWrapper>
  )
}

const TokenBalanceText = styled(ThemedText.BodySecondary)`
  ${EllipsisStyle}
`

function TokenRow(portifolio: NonNullable<TokenDataOwner>) {
  const percentChange = portifolio.token.priceUSDChange ?? 0
  const native = useNativeCurrency()
  const navigate = useNavigate()
  const toggleWalletDrawer = useToggleAccountDrawer()
  const navigateToTokenDetails = useCallback(async () => {
    navigate(getTokenDetailsURL({ address: portifolio.token.address.toLowerCase(), chain: 'ROLLUX' as Chain }))
    toggleWalletDrawer()
  }, [navigate, portifolio.token.address, toggleWalletDrawer])

  const currency = useMemo(() => {
    if (portifolio.token.address === 'NATIVE') {
      return native
    } else {
      return new Token(
        portifolio.chainId,
        portifolio.token.address,
        portifolio.decimals ?? 18,
        portifolio.token.name,
        portifolio.token.symbol
      )
    }
  }, [
    native,
    portifolio.chainId,
    portifolio.decimals,
    portifolio.token.address,
    portifolio.token.name,
    portifolio.token.symbol,
  ])

  return (
    <PortfolioRow
      left={<PortfolioLogo chainId={currency.chainId} currencies={[currency]} size="40px" />}
      title={<ThemedText.SubHeader fontWeight={500}>{portifolio.token.name}</ThemedText.SubHeader>}
      descriptor={
        <TokenBalanceText>
          {formatNumber(portifolio.balanceCurrency, NumberType.TokenNonTx)} {portifolio.token.symbol}
        </TokenBalanceText>
      }
      onClick={navigateToTokenDetails}
      right={
        portifolio.balancePrice && (
          <>
            <ThemedText.SubHeader fontWeight={500}>
              {formatNumber(portifolio.balancePrice, NumberType.PortfolioBalance)}
            </ThemedText.SubHeader>
            <Row justify="flex-end">
              <PortfolioArrow change={percentChange} size={20} strokeWidth={1.75} />
              <ThemedText.BodySecondary>{formatDelta(percentChange)}</ThemedText.BodySecondary>
            </Row>
          </>
        )
      }
    />
  )
}
