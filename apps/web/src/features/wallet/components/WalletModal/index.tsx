import { Platform } from '@universe/chains'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { EmbeddedWalletConnectionsModal } from '~/features/wallet/components/WalletModal/EmbeddedWalletModal'
import { StandardWalletModal } from '~/features/wallet/components/WalletModal/StandardWalletModal'
import { SwitchWalletModal } from '~/features/wallet/components/WalletModal/SwitchWalletModal'
import { MenuStateVariant, useSetMenuCallback } from '~/state/accountDrawer/menuState'

export function WalletModal({ connectOnPlatform }: { connectOnPlatform?: Platform | 'any' }) {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const onClose = useSetMenuCallback(MenuStateVariant.MAIN)

  if (connectOnPlatform) {
    return <SwitchWalletModal connectOnPlatform={connectOnPlatform} onClose={onClose} />
  }

  return isEmbeddedWalletEnabled ? <EmbeddedWalletConnectionsModal /> : <StandardWalletModal />
}
