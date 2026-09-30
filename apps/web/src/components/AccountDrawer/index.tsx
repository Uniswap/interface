import { isMobileWeb } from '@universe/environment'
import { Flex } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useAtom } from 'jotai'
import { useEffect, useMemo } from 'react'
import { RemoveScroll } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { DefaultMenu } from '~/components/AccountDrawer/DefaultMenu'
import { useAccountDrawer } from '~/components/AccountDrawer/MiniPortfolio/hooks'
import { AdaptiveDropdown } from '~/components/Dropdowns/AdaptiveDropdown'
import { Web3StatusRef } from '~/components/Web3Status/web3StatusRef'
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
      // Closed, this container is empty but still 368px wide at z-index sidebar, so on narrow viewports it
      // spans the page and swallows taps on whatever sits under the top strip (e.g. breadcrumb links).
      pointerEvents={accountDrawer.isOpen ? 'auto' : 'none'}
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

export function AccountDrawer(): JSX.Element {
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
