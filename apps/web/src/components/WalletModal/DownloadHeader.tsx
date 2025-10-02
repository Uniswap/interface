import { downloadAppModalPageAtom, Page } from 'components/NavBar/DownloadApp/Modal'
import { DownloadWalletRow } from 'components/WalletModal/DownloadWalletRow'
import { useRecentConnectorId } from 'components/Web3Provider/constants'
import { useOrderedWallets } from 'features/wallet/connection/hooks/useOrderedWalletConnectors'
import { useModalState } from 'hooks/useModalState'
import { useAtom } from 'jotai'
import { Flex } from 'ui/src'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useEvent } from 'utilities/src/react/hooks'

interface DownloadHeaderProps {
  showOnMobile?: boolean
  showOnDesktop?: boolean
}

export function DownloadHeader({ showOnMobile = true, showOnDesktop = true }: DownloadHeaderProps): JSX.Element | null {
  const wallets = useOrderedWallets({ showSecondaryConnectors: false })
  const { openModal: openGetTheAppModal } = useModalState(ModalName.GetTheApp)
  const [, setPage] = useAtom(downloadAppModalPageAtom)
  const recentConnectorId = useRecentConnectorId()

  const shouldShow =
    !wallets.some((wallet) => wallet.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS) &&
    recentConnectorId !== CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID

  const handleOpenGetTheAppModal = useEvent(() => {
    openGetTheAppModal()
    setPage(Page.GetApp)
  })

  if (!shouldShow) {
    return null
  }

  return (
    <>
      {showOnMobile && (
        <Flex display="flex" $md={{ display: 'none' }}>
          <DownloadWalletRow
            onPress={handleOpenGetTheAppModal}
            width="100%"
            borderTopLeftRadius="$rounded16"
            borderTopRightRadius="$rounded16"
            iconSize={16}
            titleTextVariant="buttonLabel4"
          />
        </Flex>
      )}
      {showOnDesktop && (
        <Flex display="none" $md={{ display: 'flex' }}>
          <DownloadWalletRow
            onPress={handleOpenGetTheAppModal}
            width="100%"
            borderTopLeftRadius="$rounded16"
            borderTopRightRadius="$rounded16"
            iconSize={20}
            titleTextVariant="buttonLabel4"
          />
        </Flex>
      )}
    </>
  )
}
