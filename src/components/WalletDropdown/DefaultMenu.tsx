import { useWeb3React } from '@web3-react/core'
import Column from 'components/Column'
import WalletModal from 'components/WalletModal'
import { atom } from 'jotai'
import { useAtomValue } from 'jotai/utils'
import { useCallback, useState } from 'react'
import styled from 'styled-components/macro'

import AuthenticatedHeader from './AuthenticatedHeader'
import SettingsMenu from './SettingsMenu'

export const connectionErrorAtom = atom<string | undefined>(undefined)

const DefaultMenuWrap = styled(Column)`
  width: 100%;
  height: 100%;
`

enum MenuState {
  DEFAULT,
  SETTINGS,
}

// const IS_INJECTED_IOS_BROWSER = isIOS && (isCoinbaseWallet || isMetaMaskWallet)

function DefaultMenu() {
  const { account } = useWeb3React()
  const isAuthenticated = !!account

  // const isUniwallet = getConnection(connector).type === ConnectionType.UNIWALLET

  /* TODO(cartcrom): WEB-2920 Move pending Tx history from below into mini portfolio */

  // const allTransactions = useAllTransactions()
  // const pendingTransactions = useMemo(
  //   () => Object.values(allTransactions).filter((tx) => !tx.receipt),
  //   [allTransactions]
  // )
  // const latestPendingTransaction =
  //   pendingTransactions.length > 0
  //     ? pendingTransactions.sort((tx1, tx2) => tx2.addedTime - tx1.addedTime)[0]
  //     : undefined

  const [menu, setMenu] = useState<MenuState>(MenuState.DEFAULT)
  const openSettings = useCallback(() => setMenu(MenuState.SETTINGS), [])
  const closeSettings = useCallback(() => setMenu(MenuState.DEFAULT), [])

  return (
    <DefaultMenuWrap>
      {menu === MenuState.DEFAULT &&
        (isAuthenticated ? (
          <AuthenticatedHeader account={account} openSettings={openSettings} />
        ) : (
          <WalletModal openSettings={openSettings} />
        ))}
      {menu === MenuState.SETTINGS && <SettingsMenu onClose={closeSettings} />}
      {!useAtomValue(connectionErrorAtom) && (
        <>
          {/* TODO(cartcrom): move this advertisment elsewhere if design picks new spot for it */}
          {/* {Boolean((isAuthenticated && !isUniwallet) || IS_INJECTED_IOS_BROWSER) && (
            <>
              <Divider />
              <ToggleMenuItem onClick={() => (isIOS ? window.open(APP_STORE_LINK) : navigate('/wallet'))}>
                <ThemedText.BodySmall>
                  <Trans>Download Uniswap Wallet for iOS</Trans>
                </ThemedText.BodySmall>
                <NewBadge />
              </ToggleMenuItem>
            </>
          )} */}
        </>
      )}
    </DefaultMenuWrap>
  )
}

export default DefaultMenu
