import { isMobileWeb } from '@universe/environment'
import { Flex, zIndexes } from '@universe/mycelium'
import { TestID } from '@universe/test'
import { useAtom } from 'jotai'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { RemoveScroll } from 'ui/src'
import { useDismissLayer } from 'utilities/src/react/useDismissLayer'
import { AdaptiveDropdown } from '~/components/Dropdowns/AdaptiveDropdown'
import { DefaultMenu } from '~/features/wallet/components/AccountDrawer/DefaultMenu'
import { WebNotificationToastWrapper } from '~/features/wallet/components/AccountDrawer/WebNotificationToastWrapper'
import { Web3StatusRef } from '~/features/wallet/components/Web3Status/web3StatusRef'
import { useAppHeaderHeight } from '~/hooks/useAppHeaderHeight'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'

export const MODAL_WIDTH = '368px'

function Drawer({ children }: { children: JSX.Element | JSX.Element[] }): JSX.Element {
  const { t } = useTranslation()
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
        title={t('common.wallet.label')}
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

  // Escape closes the drawer only while it is the top open layer (a dialog or menu above it keeps the key).
  useDismissLayer({ isOpen: accountDrawer.isOpen, onClose: accountDrawer.close })

  return (
    <RemoveScroll enabled={accountDrawer.isOpen && isMobileWeb}>
      <Drawer>
        <WebNotificationToastWrapper />
        <DefaultMenu />
      </Drawer>
    </RemoveScroll>
  )
}
