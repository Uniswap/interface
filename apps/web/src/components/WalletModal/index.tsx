import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { MenuStateVariant, useSetMenuCallback } from 'components/AccountDrawer/menuState'
import { EmbeddedWalletModal } from 'components/WalletModal/EmbeddedWalletModal'
import { StandardWalletModal } from 'components/WalletModal/StandardWalletModal'
import { SwitchWalletModal } from 'components/WalletModal/SwitchWalletModal'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'

export default function WalletModal({ connectOnPlatform }: { connectOnPlatform?: Platform | 'any' }) {
  const isEmbeddedWalletEnabled = useFeatureFlag(FeatureFlags.EmbeddedWallet)
  const onClose = useSetMenuCallback(MenuStateVariant.MAIN)

  if (connectOnPlatform) {
    return <SwitchWalletModal connectOnPlatform={connectOnPlatform} onClose={onClose} />
  }

  return isEmbeddedWalletEnabled ? <EmbeddedWalletModal /> : <StandardWalletModal />
}
