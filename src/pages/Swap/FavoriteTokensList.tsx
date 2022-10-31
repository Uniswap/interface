import { CNav, CNavItem, CNavLink, CTabContent, CTabPane, CTable, CTableBody, CTableCaption, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react'
import { ChevronDown, ChevronUp, MinusCircle } from 'react-feather'
import React, { useEffect, useMemo } from 'react'
import { StyledInternalLink, TYPE } from 'theme'
import { useAddPairToFavorites, useUserFavoritesManager } from 'state/user/hooks'
import { useConvertTokenAmountToUsdString, useKiba } from 'pages/Vote/VotePage';
import { useCurrencyBalance, useCurrencyBalances } from 'state/wallet/hooks'

import { AutoColumn } from 'components/Column'
import { ButtonError } from 'components/Button'
import { DarkCard } from 'components/Card'
import Loader from 'components/Loader';
import { SwapTokenForTokenModal } from 'components/ChartSidebar/SwapTokenForTokenModal'
import { abbreviateNumber } from 'components/BurntKiba'
import { toChecksum } from 'state/logs/utils'
import { useActiveWeb3React } from 'hooks/web3'
import { useCurrency } from 'hooks/Tokens'
import { useDexscreenerToken } from 'components/swap/ChartPage'
import { useIsDarkMode } from 'state/user/hooks'
import useLast from 'hooks/useLast'
import useTheme from 'hooks/useTheme'
import { useUSDCValue } from 'hooks/useUSDCPrice'

type Tab = {
    label: string
    active: boolean
    content: JSX.Element
}
type TabsListProps = {
    tabs: Tab[]
    onActiveChanged: (newActive: Tab) => void
}

const FavoriteTokenRow = (
    props: {
        account?: string | null,
        token: any,
        removeFromFavorites: (token: any) => void,
        setTokenModal: (token: any) => void
    }
) => {
    const { token, removeFromFavorites, account, setTokenModal } = props
    const currency = useCurrency(toChecksum(token.tokenAddress))
    const currencyBalance = useCurrencyBalance(account ?? undefined, currency ?? undefined)
    const tokenBalanceUsd = useUSDCValue(currencyBalance)
    const pair = useDexscreenerToken(token.tokenAddress)
    const usdcAndEthFormatted = useConvertTokenAmountToUsdString(
        React.useMemo(() => currency as any, [currency]),
        React.useMemo(() => parseFloat(currencyBalance?.toFixed(2) as string), [currencyBalance]),
        React.useMemo(() => ({
            token0: {
                id: pair?.quoteToken?.address || ''
            },
            token1: {
                id: token.tokenAddress
            }
        }), [pair, token]),
        []
    )

    const tokenModal = {
        ...token,
        screenerToken: pair
    }

    const openTokenModal = () => setTokenModal(tokenModal)

    useEffect(() => {
        if (pair?.priceUsd) {
            usdcAndEthFormatted.refetch()
        }
    }, [pair?.priceUsd])

    return (
        <CTableRow align="center" key={token.pairAddress}>
            <CTableDataCell>{token.tokenName}</CTableDataCell>
            <CTableDataCell>{token.tokenSymbol}</CTableDataCell>
            <CTableDataCell>${pair?.priceUsd ?? 'Not available'} / ${abbreviateNumber(pair?.fdv) ?? 'Not available'}</CTableDataCell>
            <CTableDataCell>
                <TYPE.main>{currencyBalance ? Number(currencyBalance?.toFixed(2)).toLocaleString() + ' ' + token.tokenSymbol + ' / ' : <Loader />}

                    {tokenBalanceUsd && <span style={{ marginLeft: 5 }}> ${Number(tokenBalanceUsd.toFixed(2)).toLocaleString()} USD </span>}

                    {!tokenBalanceUsd && currencyBalance && currencyBalance?.toFixed(0) != '0' && usdcAndEthFormatted && <span style={{ marginLeft: 5 }}>${usdcAndEthFormatted.value[0]} USD</span>}
                </TYPE.main>
            </CTableDataCell>
            <CTableDataCell>
                <StyledInternalLink to={`/charts/${token.network}/${token.pairAddress}`}>View Chart</StyledInternalLink>
            </CTableDataCell>
            <CTableDataCell>
                <div style={{display:'flex',gap: 15,justifyContent:'space-between', alignItems:'start'}}>
                <TYPE.link onClick={openTokenModal}>Swap {token?.tokenSymbol}</TYPE.link>
                <ButtonError style={{ width: 150, padding: 3 }} onClick={() => removeFromFavorites(token.pairAddress)}>
                    Remove  <MinusCircle />
                </ButtonError>
                </div>
            </CTableDataCell>
        </CTableRow>
    )
}

export const TabsList = (props: TabsListProps) => {
    const { tabs, onActiveChanged } = props
    const theme = useTheme()
    return (
        <React.Fragment>
            <CNav variant="tabs" role="tablist">
                {tabs?.map(tab => (
                    <CNavItem key={tab.label}>
                        <CNavLink style={{ color: tab.active == false ? theme.text1 : '' }} href={'javascript:void(0);'}
                            active={tab.active}
                            onClick={() => onActiveChanged(tab)}>
                            {tab.label}
                        </CNavLink>
                    </CNavItem>
                ))}
            </CNav>
            <CTabContent>
                {tabs?.filter(a => a.active).map(tab => (
                    <CTabPane key={`tab-pane-${tab.label}`} role="tabpanel" visible={tab.active}>
                        {tab.content}
                    </CTabPane>
                ))}
            </CTabContent>
        </React.Fragment>
    )
}

export const FavoriteTokensList = () => {
    const [favoriteTokens] = useUserFavoritesManager()
    const { removeFromFavorites } = useAddPairToFavorites()
    const isDarkMode = useIsDarkMode()
    const favTokens = useMemo(
        () => favoriteTokens || []
        , [favoriteTokens]
    )
    const { account } = useActiveWeb3React()

    const theme = useTheme()

    const [tokenModal, setTokenModal] = React.useState<any>()
    const dismissToken = React.useCallback(() => setTokenModal(undefined), [])

    return (
        <DarkCard>
            <SwapTokenForTokenModal item={tokenModal} isOpen={Boolean(tokenModal)} onDismiss={dismissToken} />

            <AutoColumn gap="md">
                <AutoColumn>
                    <CTable caption="top" responsive style={{ color: theme.text1 }} hover={!isDarkMode}>
                        <CTableCaption style={{ color: theme.text1 }}>Favorited Tokens</CTableCaption>

                        <CTableHead>
                            <CTableRow>
                                <CTableHeaderCell scope="col">Name</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Symbol</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Price / Market Cap</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Current Balance</CTableHeaderCell>
                                <CTableHeaderCell scope="col">Actions</CTableHeaderCell>

                                <CTableHeaderCell scope="col"></CTableHeaderCell>
                            </CTableRow>
                        </CTableHead>
                        <CTableBody>
                            {favTokens?.length == 0 && <CTableRow>
                                <CTableDataCell colSpan={5}>Favorite tokens by viewing their chart and clicking the favorite icon to see them here </CTableDataCell>
                            </CTableRow>}
                            {favTokens.map((token) => (
                                <FavoriteTokenRow setTokenModal={setTokenModal}
                                    removeFromFavorites={removeFromFavorites}
                                    token={token}
                                    account={account}
                                    key={`token_row_${token.tokenAddress}`} />
                            ))}
                        </CTableBody>
                    </CTable>
                </AutoColumn>
            </AutoColumn>
        </DarkCard>
    )
}