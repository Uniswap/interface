import { Trans } from '@lingui/macro'
import { CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useWeb3React } from '@web3-react/core'
import { getConnection } from 'connection/utils'
import { getChainInfoOrDefault } from 'constants/chainInfo'
import { SupportedChainId } from 'constants/chains'
import { useActiveLocale } from 'hooks/useActiveLocale'
import useCopyClipboard from 'hooks/useCopyClipboard'
import useStablecoinPrice from 'hooks/useStablecoinPrice'
import useNativeCurrency from 'lib/hooks/useNativeCurrency'
import { useCallback, useMemo } from 'react'
import { ChevronRight, Copy, ExternalLink, Moon, Power, Sun } from 'react-feather'
import { Text } from 'rebass'
import { useToggleWalletModal } from 'state/application/hooks'
import { useCurrencyBalanceString } from 'state/connection/hooks'
import { useAppDispatch } from 'state/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import { updateSelectedWallet } from 'state/user/reducer'
import styled from 'styled-components/macro'
import { colors } from 'theme/colors'
import { opacify } from 'theme/utils'

import useENS from '../../hooks/useENS'
import { shortenAddress } from '../../nft/utils/address'
import { useUserUnclaimedAmount } from '../../state/claim/hooks'
import { useAllTransactions } from '../../state/transactions/hooks'
import { ButtonPrimary } from '../Button'
import StatusIcon from '../Identicon/StatusIcon'
import IconButton, { IconHoverText } from './IconButton'
import { MenuState } from './index'

const UNIbutton = styled(ButtonPrimary)`
  background: linear-gradient(to right, #9139b0 0%, #4261d6 100%);
  border-radius: 12px;
  padding-top: 10px;
  padding-bottom: 10px;
  margin-top: 12px;
  color: white;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  text-align: center;
`

const ConnectButton = styled.button`
  border: none;
  outline: none;
  border-radius: 12px;
  height: 44px;
  width: 288px;
  background-color: ${({ theme }) => theme.accentAction};
  color: white;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
`

const IconContainer = styled.div`
  display: inline-block;
  float: right;
  & > div {
    margin-right: 8px;
  }
  & > div:last-child {
    margin-right: 0px;
    ${IconHoverText}:last-child {
      left: 0px;
    }
  }
`

const Divider = styled.div`
  border: 0.5px solid ${({ theme }) => theme.backgroundOutline};
  margin-top: 16px;
  margin-bottom: 16px;
`

const ToggleMenuItem = styled.button`
  background-color: transparent;
  margin: 0;
  border: none;
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  padding: 8px 0px;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 400;
  width: 100%;
  margin-bottom: 8px;
  color: ${({ theme }) => theme.textTertiary};
  :hover {
    cursor: pointer;
    text-decoration: none;
  }
`

const USDText = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.textTertiary};
  margin-top: 8px;
`

const AuthenticatedHeader = () => {
  const { account, chainId, connector } = useWeb3React()
  const [isCopied, setCopied] = useCopyClipboard()
  const copy = useCallback(() => {
    setCopied(account || '')
  }, [account, setCopied])
  const dispatch = useAppDispatch()
  const balanceString = useCurrencyBalanceString(account ?? '')
  const {
    nativeCurrency: { symbol: nativeCurrencySymbol },
    explorer,
  } = getChainInfoOrDefault(chainId ? chainId : SupportedChainId.MAINNET)

  const { address: parsedAddress } = useENS(account)
  const unclaimedAmount: CurrencyAmount<Token> | undefined = useUserUnclaimedAmount(parsedAddress)
  const connectionType = getConnection(connector).type
  const nativeCurrency = useNativeCurrency()
  const nativeCurrencyPrice = useStablecoinPrice(nativeCurrency ?? undefined) || 0

  const amountUSD = useMemo(() => {
    const price = parseFloat(nativeCurrencyPrice.toFixed(5))
    const balance = parseFloat(balanceString || '0')
    return price * balance
  }, [balanceString, nativeCurrencyPrice])

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'inline-block', marginTop: 4 }}>
          <div style={{ display: 'flex' }}>
            <StatusIcon connectionType={connectionType} size={24} />
            <Text fontSize={16} fontWeight={600} marginTop="2.5px">
              {account && shortenAddress(account, 2, 4)}
            </Text>
          </div>
        </div>
        <IconContainer>
          <IconButton onClick={copy} Icon={Copy} text={isCopied ? <Trans>Copied!</Trans> : <Trans>Copy</Trans>} />
          <IconButton
            onClick={() => window.open(`${explorer}address/${account}`, '_blank')}
            Icon={ExternalLink}
            text={<Trans>Explore</Trans>}
          />
          <IconButton
            onClick={() => {
              if (connector && connector.deactivate) {
                connector.deactivate()
              }
              connector.resetState()
              dispatch(updateSelectedWallet({ wallet: undefined }))
            }}
            Icon={Power}
            text={<Trans>Disconnect</Trans>}
          />
        </IconContainer>
      </div>
      <Column>
        <div style={{ padding: '16px 0' }}>
          <Text fontSize={36} fontWeight={400}>
            {balanceString} {nativeCurrencySymbol}
          </Text>
          <USDText>${amountUSD.toFixed(2)} USD</USDText>
        </div>
        {unclaimedAmount !== undefined && unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-') !== '0' && (
          <UNIbutton style={{ border: 'none' }}>
            <Trans>Claim</Trans> {unclaimedAmount?.toFixed(0, { groupSeparator: ',' } ?? '-')} <Trans>reward</Trans>
          </UNIbutton>
        )}
      </Column>
    </>
  )
}

const PendingBadge = styled.span`
  background-color: ${({ theme }) => theme.accentActionSoft};
  color: ${({ theme }) => theme.deprecated_primary3};
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 4px;
`

const IconWrap = styled.span`
  display: inline-block;
  margin-top: auto;
  margin-bottom: auto;
  margin-left: 4px;
  height: 16px;
`

const DefaultMenuWrap = styled.div`
  padding: 0 16px;
  width: 100%;
  height: 100%;
`

const DefaultText = styled.span`
  font-size: 14px;
  font-weight: 400;
`

const WalletDropdown = ({ setMenu }: { setMenu: (state: MenuState) => void }) => {
  const { account } = useWeb3React()
  const isAuthenticated = !!account
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  const activeLocale = useActiveLocale()
  const ISO = activeLocale.split('-')[0].toUpperCase()
  const allTransactions = useAllTransactions()
  const toggleWalletModal = useToggleWalletModal()

  const pendingTransactions = useMemo(
    () => Object.values(allTransactions).filter((tx) => !tx.receipt),
    [allTransactions]
  )

  return (
    <DefaultMenuWrap>
      {isAuthenticated ? (
        <AuthenticatedHeader />
      ) : (
        <ConnectButton onClick={toggleWalletModal}>Connect wallet</ConnectButton>
      )}
      <Divider />
      {isAuthenticated && (
        <ToggleMenuItem onClick={() => setMenu(MenuState.TRANSACTIONS)}>
          <DefaultText>
            <Trans>Transactions</Trans>{' '}
            {pendingTransactions.length > -1 && (
              <PendingBadge>
                {pendingTransactions.length} <Trans>Pending</Trans>
              </PendingBadge>
            )}
          </DefaultText>
          <IconWrap>
            <ChevronRight size={16} strokeWidth={3} />
          </IconWrap>
        </ToggleMenuItem>
      )}
      <ToggleMenuItem onClick={() => setMenu(MenuState.LANGUAGE)}>
        <DefaultText>
          <Trans>Language</Trans>
        </DefaultText>
        <span style={{ display: 'flex' }}>
          <span style={{ marginTop: 'auto', marginBottom: 'auto' }}>
            <DefaultText>{ISO}</DefaultText>
          </span>
          <IconWrap>
            <ChevronRight size={16} strokeWidth={3} />
          </IconWrap>
        </span>
      </ToggleMenuItem>
      <ToggleMenuItem onClick={toggleDarkMode}>
        <DefaultText>{darkMode ? <Trans> Light theme</Trans> : <Trans>Dark theme</Trans>}</DefaultText>
        <IconWrap>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</IconWrap>
      </ToggleMenuItem>
    </DefaultMenuWrap>
  )
}

export default WalletDropdown
