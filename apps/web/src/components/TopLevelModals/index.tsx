import { OffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import UniwalletModal from 'components/AccountDrawer/UniwalletModal'
import { AddressQRModal } from 'components/AddressQRModal'
import { Banners } from 'components/Banner/shared/Banners'
import ConnectedAccountBlocked from 'components/ConnectedAccountBlocked'
import FeatureFlagModal from 'components/FeatureFlagModal/FeatureFlagModal'
import FiatOnrampModal from 'components/FiatOnrampModal'
import { GetTheAppModal } from 'components/NavBar/DownloadApp/Modal'
import { PrivacyPolicyModal } from 'components/PrivacyPolicy'
import { ReceiveCryptoModal } from 'components/ReceiveCryptoModal'
import { ExtensionLaunchModal } from 'components/TopLevelModals/ExtensionLaunchModal'
import { UkDisclaimerModal } from 'components/TopLevelModals/UkDisclaimerModal'
import AddressClaimModal from 'components/claim/AddressClaimModal'
import DevFlagsBox from 'dev/DevFlagsBox'
import { useAccount } from 'hooks/useAccount'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import Bag from 'nft/components/bag/Bag'
import TransactionCompleteModal from 'nft/components/collection/TransactionCompleteModal'
import { IncreaseLiquidityModal } from 'pages/IncreaseLiquidity/IncreaseLiquidityModal'
import { RemoveLiquidityModal } from 'pages/RemoveLiquidity/RemoveLiquidityModal'
import { useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

export default function TopLevelModals() {
  const addressClaimOpen = useModalIsOpen(ApplicationModal.ADDRESS_CLAIM)
  const addressClaimToggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  const blockedAccountModalOpen = useModalIsOpen(ApplicationModal.BLOCKED_ACCOUNT)
  const isAddLiquidityModalOpen = useModalIsOpen(ModalName.AddLiquidity)
  const isRemoveLiquidityModalOpen = useModalIsOpen(ModalName.RemoveLiquidity)

  const account = useAccount()
  useAccountRiskCheck(account.address)
  const accountBlocked = Boolean(blockedAccountModalOpen && account.isConnected)
  const shouldShowDevFlags = isDevEnv() || isBetaEnv()

  return (
    <>
      <AddressClaimModal isOpen={addressClaimOpen} onDismiss={addressClaimToggle} />
      <ConnectedAccountBlocked account={account.address} isOpen={accountBlocked} />
      <Bag />
      <UniwalletModal />

      <Banners />

      <OffchainActivityModal />
      <TransactionCompleteModal />
      <FiatOnrampModal />
      {account.address && <ReceiveCryptoModal />}
      {account.address && <AddressQRModal accountAddress={account.address} />}
      <UkDisclaimerModal />
      <GetTheAppModal />
      <PrivacyPolicyModal />
      <FeatureFlagModal />
      {shouldShowDevFlags && <DevFlagsBox />}
      <ExtensionLaunchModal />

      {isAddLiquidityModalOpen && <IncreaseLiquidityModal />}
      {isRemoveLiquidityModalOpen && <RemoveLiquidityModal />}
    </>
  )
}
