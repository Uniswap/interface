import { OffchainActivityModal } from 'components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal'
import UniwalletModal from 'components/AccountDrawer/UniwalletModal'
import { AddressQRModal } from 'components/AddressQRModal'
import { Banners } from 'components/Banner/shared/Banners'
import ConnectedAccountBlocked from 'components/ConnectedAccountBlocked'
import FeatureFlagModal from 'components/FeatureFlagModal/FeatureFlagModal'
import { GetTheAppModal } from 'components/NavBar/DownloadApp/Modal'
import { PrivacyChoicesModal } from 'components/PrivacyChoices'
import { PrivacyPolicyModal } from 'components/PrivacyPolicy'
import { ReceiveCryptoModal } from 'components/ReceiveCryptoModal'
import { RecoveryPhraseModal } from 'components/RecoveryPhrase/Modal'
import { UkDisclaimerModal } from 'components/TopLevelModals/UkDisclaimerModal'
import AddressClaimModal from 'components/claim/AddressClaimModal'
import DevFlagsBox from 'dev/DevFlagsBox'
import { useAccount } from 'hooks/useAccount'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { PageType, useIsPage } from 'hooks/useIsPage'
import Bag from 'nft/components/bag/Bag'
import TransactionCompleteModal from 'nft/components/collection/TransactionCompleteModal'
import { IncreaseLiquidityModal } from 'pages/IncreaseLiquidity/IncreaseLiquidityModal'
import { ClaimFeeModal } from 'pages/Pool/Positions/ClaimFeeModal'
import { RemoveLiquidityModal } from 'pages/RemoveLiquidity/RemoveLiquidityModal'
import { useCloseModal, useModalIsOpen, useToggleModal } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/reducer'
import { useMedia } from 'ui/src'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TestnetModeModal } from 'uniswap/src/features/testnets/TestnetModeModal'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

export default function TopLevelModals() {
  const isLandingPage = useIsPage(PageType.LANDING)
  const media = useMedia()

  const addressClaimOpen = useModalIsOpen(ApplicationModal.ADDRESS_CLAIM)
  const addressClaimToggle = useToggleModal(ApplicationModal.ADDRESS_CLAIM)
  const blockedAccountModalOpen = useModalIsOpen(ApplicationModal.BLOCKED_ACCOUNT)
  const isAddLiquidityModalOpen = useModalIsOpen(ModalName.AddLiquidity)
  const isRemoveLiquidityModalOpen = useModalIsOpen(ModalName.RemoveLiquidity)
  const isClaimFeeModalOpen = useModalIsOpen(ModalName.ClaimFee)
  const isTestnetModeModalOpen = useModalIsOpen(ModalName.TestnetMode)
  const closeTestnetModeModal = useCloseModal(ModalName.TestnetMode)

  const account = useAccount()
  useAccountRiskCheck(account.address)
  const accountBlocked = Boolean(blockedAccountModalOpen && account.isConnected)
  const shouldShowDevFlags = isDevEnv() || isBetaEnv()

  // On mobile landing page we need to be very careful about what modals we show
  // because too many modals attached to the dom can cause performance issues
  // and potentially lead to crashes. Only add modals here if they are strictly
  // necessary and add minimal overhead to the dom.
  if (isLandingPage && media.sm) {
    return (
      <>
        <PrivacyPolicyModal />
        <PrivacyChoicesModal />
      </>
    )
  }

  return (
    <>
      <AddressClaimModal isOpen={addressClaimOpen} connectedAddress={account.address} onDismiss={addressClaimToggle} />
      <ConnectedAccountBlocked account={account.address} isOpen={accountBlocked} />
      <Bag />
      <UniwalletModal />

      <Banners />

      <OffchainActivityModal />
      <TransactionCompleteModal />
      {account.address && <ReceiveCryptoModal />}
      {account.address && <AddressQRModal accountAddress={account.address} />}
      <UkDisclaimerModal />
      <TestnetModeModal isOpen={isTestnetModeModalOpen} onClose={closeTestnetModeModal} showCloseButton />
      <GetTheAppModal />
      <PrivacyPolicyModal />
      <PrivacyChoicesModal />
      <FeatureFlagModal />
      {shouldShowDevFlags && <DevFlagsBox />}

      {isAddLiquidityModalOpen && <IncreaseLiquidityModal />}
      {isRemoveLiquidityModalOpen && <RemoveLiquidityModal />}
      {isClaimFeeModalOpen && <ClaimFeeModal />}
      <RecoveryPhraseModal />
    </>
  )
}
