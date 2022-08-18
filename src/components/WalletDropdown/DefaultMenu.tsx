import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { ChevronRight, Moon, Sun } from 'react-feather'
import { useToggleWalletModal } from 'state/application/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'

import { useAllTransactions } from '../../state/transactions/hooks'
import AuthenticatedHeader from './AuthenticatedHeader'
import { MenuState } from './index'

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

const Divider = styled.div`
  border: 1px solid ${({ theme }) => theme.backgroundOutline};
  margin-top: 16px;
  margin-bottom: 16px;
`

const ToggleMenuItem = styled.button`
  background-color: transparent;
  margin: 0;
  border: none;
  cursor: pointer;
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
  color: ${({ theme }) => theme.textSecondary};
  :hover {
    text-decoration: none;
  }
`

const FlexContainer = styled.div`
  display: flex;
`

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

const CenterVertically = styled.div`
  margin-top: auto;
  margin-bottom: auto;
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
      )}
      <ToggleMenuItem onClick={() => setMenu(MenuState.LANGUAGE)}>
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
      <ToggleMenuItem onClick={toggleDarkMode}>
        <DefaultText>{darkMode ? <Trans> Light theme</Trans> : <Trans>Dark theme</Trans>}</DefaultText>
        <IconWrap>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</IconWrap>
      </ToggleMenuItem>
    </DefaultMenuWrap>
  )
}

export default WalletDropdown
