import { Token } from '@pollum-io/sdk-core'
import { formatNumber, NumberType } from '@uniswap/conedison/format'
// import { formatNumber, NumberType } from '@uniswap/conedison/format'
import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import { LoadingBubble } from 'components/Tokens/loading'
import { useGetConnection } from 'connection'
import { useNewTopTokens } from 'graphql/tokens/NewTopTokens'
import { useFetchedTokenData } from 'graphql/tokens/TokenData'
import { useNativeCurrencyBalances, useTokenBalances } from 'lib/hooks/useCurrencyBalance'
import { useCallback, useEffect, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, Copy, IconProps, Power, Settings } from 'react-feather'
import { useAppDispatch } from 'state/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled, { useTheme } from 'styled-components/macro'
import { CopyHelper, ThemedText } from 'theme'

import { shortenAddress } from '../../nft/utils/address'
import StatusIcon from '../Identicon/StatusIcon'
import IconButton, { IconHoverText } from './IconButton'
import MiniPortfolio from './MiniPortfolio'
import { portfolioFadeInAnimation } from './MiniPortfolio/PortfolioRow'

const AuthenticatedHeaderWrapper = styled.div`
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  flex: 1;
`

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  & > a,
  & > button {
    margin-right: 8px;
  }

  & > button:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`

const StatusWrapper = styled.div`
  display: inline-block;
  width: 70%;
  padding-right: 4px;
  display: inline-flex;
`

const AccountNamesWrapper = styled.div`
  overflow: hidden;
  white-space: nowrap;
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
`

const HeaderWrapper = styled.div`
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`

const CopyText = styled(CopyHelper).attrs({
  InitialIcon: Copy,
  CopiedIcon: Copy,
  gap: 4,
  iconSize: 14,
  iconPosition: 'right',
})``

const FadeInColumn = styled(Column)`
  ${portfolioFadeInAnimation}
`

const PortfolioDrawerContainer = styled(Column)`
  flex: 1;
`

export function PortfolioArrow({ change, ...rest }: { change: number } & IconProps) {
  const theme = useTheme()
  return change < 0 ? (
    <ArrowDownRight color={theme.accentCritical} size={20} {...rest} />
  ) : (
    <ArrowUpRight color={theme.accentSuccess} size={20} {...rest} />
  )
}

export default function AuthenticatedHeader({ account, openSettings }: { account: string; openSettings: () => void }) {
  const { connector, ENSName } = useWeb3React()
  const dispatch = useAppDispatch()
  const [totalBalance, setTotalBalance] = useState(0)
  const getConnection = useGetConnection()
  const connection = getConnection(connector)
  const disconnect = useCallback(() => {
    if (connector && connector.deactivate) {
      connector.deactivate()
    }
    connector.resetState()
    dispatch(updateSelectedWallet({ wallet: undefined }))
  }, [connector, dispatch])

  const { tokens } = useNewTopTokens()
  const nativeBalances = useNativeCurrencyBalances([account])
  const { chainId } = useWeb3React()

  const tokensAddress = tokens?.map((token) => token.id) || []
  const ERC20Tokens: Token[] = []

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

  if (tokens && tokens?.length > 0) {
    tokens?.map((token) =>
      ERC20Tokens.push({
        address: token.id,
        chainId,
        symbol: token.symbol,
        name: token.name,
        decimals: Number(token.decimals),
      } as Token)
    )
  }

  const tokenBalances = useTokenBalances(account, ERC20Tokens)
  const tokenBalanceEntries = Object.entries(tokenBalances)

  const { loading: tokenDataLoading, data: tokenData } = useFetchedTokenData(tokensAddress)

  useEffect(() => {
    const tokenDataMap = tokenData ? Object.fromEntries(tokenData.map((token) => [token.address, token])) : {}

    const newTotalBalance = tokenBalanceEntries.reduce((total, [tokenAddress, balance]) => {
      const tokenData = tokenDataMap[tokenAddress]
      if (tokenData && balance) {
        const balanceFloat = parseFloat(balance?.toExact())
        if (!isNaN(balanceFloat)) {
          return total + balanceFloat * tokenData.priceUSD
        }
      }
      return total
    }, 0)

    let nativePrice = 0
    if (nativeBalances && nativeBalancesEntries) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      nativePrice = nativeBalancesEntries.reduce((total, [address, balance]) => {
        const tokenData = tokenDataMap['0x4200000000000000000000000000000000000006']
        if (tokenData && balance) {
          const balanceFloat = parseFloat(balance?.toExact())
          if (!isNaN(balanceFloat)) {
            return total + balanceFloat * tokenData.priceUSD
          }
        }
        return total
      }, 0)
    }

    setTotalBalance(newTotalBalance + nativePrice)
  }, [nativeBalances, nativeBalancesEntries, tokenBalanceEntries, tokenData])

  return (
    <AuthenticatedHeaderWrapper>
      <HeaderWrapper>
        <StatusWrapper>
          {connection && <StatusIcon connection={connection} size={40} />}
          {account && (
            <AccountNamesWrapper>
              <ThemedText.SubHeader color="textPrimary" fontWeight={500}>
                <CopyText toCopy={ENSName ?? account}>{ENSName ?? shortenAddress(account, 4, 4)}</CopyText>
              </ThemedText.SubHeader>
              {/* Displays smaller view of account if ENS name was rendered above */}
              {ENSName && (
                <ThemedText.BodySmall color="textTertiary">
                  <CopyText toCopy={account}>{shortenAddress(account, 4, 4)}</CopyText>
                </ThemedText.BodySmall>
              )}
            </AccountNamesWrapper>
          )}
        </StatusWrapper>
        <IconContainer>
          <IconButton data-testid="wallet-settings" onClick={openSettings} Icon={Settings} />
          <IconButton data-testid="wallet-disconnect" onClick={disconnect} Icon={Power} />
        </IconContainer>
      </HeaderWrapper>
      <PortfolioDrawerContainer>
        {!tokenDataLoading ? (
          <FadeInColumn gap="xs">
            <ThemedText.HeadlineLarge fontWeight={500}>
              {formatNumber(totalBalance, NumberType.PortfolioBalance)}
            </ThemedText.HeadlineLarge>
          </FadeInColumn>
        ) : (
          <Column gap="xs">
            <LoadingBubble height="44px" width="170px" />
            <LoadingBubble height="16px" width="100px" margin="4px 0 20px 0" />
          </Column>
        )}

        <MiniPortfolio account={account} />
      </PortfolioDrawerContainer>
    </AuthenticatedHeaderWrapper>
  )
}
