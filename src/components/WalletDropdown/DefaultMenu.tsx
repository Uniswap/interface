import { Trans } from '@lingui/macro'
import { useWeb3React } from '@web3-react/core'
import { ButtonPrimary } from 'components/Button'
import { useActiveLocale } from 'hooks/useActiveLocale'
import { useMemo } from 'react'
import { ChevronRight, Moon, Sun } from 'react-feather'
import { useToggleWalletModal } from 'state/application/hooks'
import { useDarkModeManager } from 'state/user/hooks'
import styled from 'styled-components/macro'

import { useAllTransactions } from '../../state/transactions/hooks'
import AuthenticatedHeader from './AuthenticatedHeader'
import { MenuState } from './index'

const ConnectButton = styled(ButtonPrimary)`
  border-radius: 12px;
  height: 44px;
  width: 288px;
  font-weight: 600;
  font-size: 16px;
  margin-left: auto;
  margin-right: auto;

  @media only screen and (max-width: ${({ theme }) => `${theme.breakpoint.sm}px`}) {
    width: 100%;
  }
`

const Divider = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.backgroundOutline};
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
  border-radius: 12px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 400;
  width: 100%;
  padding: 12px 8px;
  color: ${({ theme }) => theme.textSecondary};
  :hover {
    color: ${({ theme }) => theme.textPrimary};
    background-color: ${({ theme }) => theme.backgroundModule};
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
  width: 100%;
  height: 100%;
  padding: 0 8px;
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
        <ConnectButton data-testid="wallet-connect-wallet" onClick={toggleWalletModal}>
          Connect wallet
        </ConnectButton>
      )}
      <Divider />
      {isAuthenticated && (
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
      <ToggleMenuItem data-testid="wallet-select-theme" onClick={toggleDarkMode}>
        <DefaultText>{darkMode ? <Trans> Light theme</Trans> : <Trans>Dark theme</Trans>}</DefaultText>
        <IconWrap>{darkMode ? <Sun size={16} /> : <Moon size={16} />}</IconWrap>
      </ToggleMenuItem>
    </DefaultMenuWrap>
  )
}

export default WalletDropdown
