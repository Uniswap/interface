import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { TransactionSummary } from 'components/AccountDetailsV2'
import WalletModal from 'components/WalletModal'
import NewBadge from 'components/WalletModal/NewBadge'
import { ConnectionType, getConnection } from 'connection'
import { isCoinbaseWallet, isMetaMaskWallet } from 'connection/utils'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { useMemo } from 'react'
import { ChevronRight, Moon, Sun } from 'react-feather'
import { useLocation, useNavigate } from 'react-router-dom'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'
import { isIOS } from 'utils/userAgent'

import { useAllTransactions } from '../../state/transactions/hooks'
import AuthenticatedHeader from './AuthenticatedHeader'
import { APP_STORE_LINK } from './DownloadButton'
import { MenuState } from './index'

export const connectionErrorAtom = atom<string | undefined>(undefined)

const Divider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-top: 16px;
  margin-bottom: 16px;
`

const ToggleMenuItem = styled.button`
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  flex: 1;
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 400;
  width: 100%;
  padding: 8px 0;
  color: ${({ theme }) => theme.textSecondary};
  :hover {
    color: ${({ theme }) => theme.textPrimary};
    transition: ${({
      theme: {
        transition: { duration, timing },
      },
    }) => `${duration.fast} all ${timing.in}`};
  }
`

const FlexContainer = styled.div`
  display: flex;
`

const LatestPendingTxnBox = styled(FlexContainer)`
  display: flex;
  border-radius: 12px;
  background-color: ${({ theme }) => theme.backgroundModule};
  align-items: center;
  gap: 8px;
`

const PendingBadge = styled.span`
  background-color: ${({ theme }) => theme.accentActionSoft};
  color: ${({ theme }) => theme.accentAction};
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
  width: 100%;
  height: 100%;
`

const DefaultText = styled.span`
  font-size: 14px;
  font-weight: 400;
`

const CenterVertically = styled.div`
  margin-top: auto;
  margin-bottom: auto;
`

const IS_INJECTED_IOS_BROWSER = isIOS && (isCoinbaseWallet || isMetaMaskWallet)

const DefaultMenu = ({ setMenu }: { setMenu: (state: MenuState) => void }) => {
  const [darkMode, toggleDarkMode] = useDarkModeManager()

  const { account, connector } = useWeb3React()
  const isAuthenticated = !!account
  const isUniwallet = getConnection(connector).type === ConnectionType.UNIWALLET

  const activeLocale = useActiveLocale()
  const ISO = activeLocale.split('-')[0].toUpperCase()
  const allTransactions = useAllTransactions()

  const pendingTransactions = useMemo(
    () => Object.values(allTransactions).filter((tx) => !tx.receipt),
    [allTransactions]
  )
  const latestPendingTransaction =
    pendingTransactions.length > 0
      ? pendingTransactions.sort((tx1, tx2) => tx2.addedTime - tx1.addedTime)[0]
      : undefined

  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isWalletPage = pathname.includes('/wallet')

  return (
    <DefaultMenuWrap>
      {isAuthenticated ? <AuthenticatedHeader /> : <WalletModal />}
      {!useAtomValue(connectionErrorAtom) && (
        <>
          <Divider />
          {isAuthenticated && (
            <>
              <ToggleMenuItem data-testid="wallet-transactions" onClick={() => setMenu(MenuState.TRANSACTIONS)}>
                <DefaultText>
                  <Trans>Transactions</Trans>{' '}
                  {pendingTransactions.length > 0 && (
                    <PendingBadge>
                      {pendingTransactions.length} <Trans>Pending</Trans>
                    </PendingBadge>
                  )}
                </DefaultText>
                <IconWrap>
                  <ChevronRight size={16} strokeWidth={3} />
                </IconWrap>
              </ToggleMenuItem>
              {!!latestPendingTransaction && (
                <LatestPendingTxnBox>
                  <TransactionSummary
                    key={latestPendingTransaction.hash}
                    transactionDetails={latestPendingTransaction}
                    isLastTransactionInList={true}
                  />
                </LatestPendingTxnBox>
              )}
            </>
          )}
          <ToggleMenuItem data-testid="wallet-select-language" onClick={() => setMenu(MenuState.LANGUAGE)}>
            <DefaultText>
              <Trans>Language</Trans>
            </DefaultText>
            <FlexContainer>
              <CenterVertically>
                <DefaultText>{ISO}</DefaultText>
              </CenterVertically>
              <IconWrap>
                <ChevronRight size={16} strokeWidth={3} />
              </IconWrap>
            </FlexContainer>
          </ToggleMenuItem>
          {!isWalletPage && (
            <ToggleMenuItem data-testid="wallet-select-theme" onClick={toggleDarkMode}>
              <DefaultText>{darkMode ? <Trans> Light theme</Trans> : <Trans>Dark theme</Trans>}</DefaultText>
              <IconWrap>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</IconWrap>
            </ToggleMenuItem>
          )}
          {Boolean((isAuthenticated && !isUniwallet) || IS_INJECTED_IOS_BROWSER) && (
            <>
              <Divider />
              <ToggleMenuItem onClick={() => (isIOS ? window.open(APP_STORE_LINK) : navigate('/wallet'))}>
                <DefaultText>
                  <Trans>Download Uniswap Wallet for iOS</Trans>
                </DefaultText>
                <NewBadge />
              </ToggleMenuItem>
            </>
          )}
        </>
      )}
    </DefaultMenuWrap>
  )
}

export default DefaultMenu
