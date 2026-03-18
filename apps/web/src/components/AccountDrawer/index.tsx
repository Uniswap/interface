import { useAtom } from 'jotai'
import { useEffect, useMemo } from 'react'
import { Flex, RemoveScroll } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { isMobileWeb } from 'utilities/src/platform'
import { DefaultMenu } from '~/components/AccountDrawer/DefaultMenu'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { AdaptiveDropdown } from '~/components/Dropdowns/AdaptiveDropdown'
import { Web3StatusRef } from '~/components/Web3Status'
import { WebNotificationToastWrapper } from '~/features/notifications/WebNotificationToastWrapper'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'

export const MODAL_WIDTH = '368px'

function Drawer({ children }: { children: JSX.Element | JSX.Element[] }): JSX.Element {
  const accountDrawer = useAccountDrawer()
  const headerHeight = useAppHeaderHeight()
  const [web3StatusRef] = useAtom(Web3StatusRef)

  const ignoredNodes = useMemo(() => (web3StatusRef ? [web3StatusRef] : []), [web3StatusRef])

  return (
    <Flex
      testID={TestID.AccountDrawerContainer}
      $platform-web={{
        position: 'fixed',
      }}
      height="auto"
      width={MODAL_WIDTH}
      right="$spacing12"
      top={headerHeight}
      zIndex={zIndexes.sidebar}
    >
      <AdaptiveDropdown
        dropdownTestId={TestID.AccountDrawer}
        isOpen={accountDrawer.isOpen}
        toggleOpen={(open: boolean) => (open ? accountDrawer.open() : accountDrawer.close())}
        adaptToSheet
        ignoredNodes={ignoredNodes}
        ignoreDialogClicks
        dropdownStyle={{
          borderRadius: '$rounded20',
          borderWidth: '$spacing1',
          p: 0,
          width: '100%',
          maxHeight: `calc(100vh - ${headerHeight + 16}px)`,
        }}
        adaptWhen="md"
      >
        {children}
      </AdaptiveDropdown>
    </Flex>
  )
}

function AccountDrawer(): JSX.Element {
  const accountDrawer = useAccountDrawer()

  // close on escape keypress
  useEffect(() => {
    const escapeKeyDownHandler = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && accountDrawer.isOpen) {
        event.preventDefault()
        accountDrawer.close()
      }
    }

    document.addEventListener('keydown', escapeKeyDownHandler)

    return () => {
      document.removeEventListener('keydown', escapeKeyDownHandler)
    }
  }, [accountDrawer])

  return (
    <RemoveScroll enabled={accountDrawer.isOpen && isMobileWeb}>
      <Drawer>
        <WebNotificationToastWrapper />
        <DefaultMenu />
      </Drawer>
    </RemoveScroll>
  )
}

export default AccountDrawer
