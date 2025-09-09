import { ModalRenderer } from 'components/TopLevelModals/modalRegistry'
import { useAccount } from 'hooks/useAccount'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { PasskeysHelpModalTypeAtom } from 'hooks/usePasskeyAuthWithHelpModal'
import { useAtomValue } from 'jotai/utils'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { shortenAddress } from 'utilities/src/addresses'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'

export default function TopLevelModals() {
  const isLandingPage = useIsPage(PageType.LANDING)
  const account = useAccount()
  const { data: unitag } = useUnitagsAddressQuery({
    params: account.address ? { address: account.address } : undefined,
  })
  const accountName = unitag?.username
    ? unitag.username + '.uni.eth'
    : account.address
      ? shortenAddress(account.address)
      : undefined
  useAccountRiskCheck(account.address)
  const passkeysHelpModalType = useAtomValue(PasskeysHelpModalTypeAtom)

  const shouldShowDevFlags = isDevEnv() || isBetaEnv()

  // On landing page we need to be very careful about what modals we show
  // because too many modals attached to the dom can cause performance issues
  // and potentially lead to crashes. Only add modals here if they are strictly
  // necessary and add minimal overhead to the dom.
  if (isLandingPage) {
    return (
      <>
        <ModalRenderer modalName={ModalName.PrivacyPolicy} />
        <ModalRenderer modalName={ModalName.PrivacyChoices} />
        <ModalRenderer modalName={ModalName.GetTheApp} />
        <ModalRenderer modalName={ModalName.FeatureFlags} />
        <ModalRenderer modalName={ModalName.UniWalletConnect} />
        <ModalRenderer modalName={ModalName.BlockedAccount} />
        {shouldShowDevFlags && <ModalRenderer modalName={ModalName.DevFlags} />}
        <ModalRenderer modalName={ModalName.Help} />
        <ModalRenderer modalName={ModalName.OffchainActivity} />
      </>
    )
  }

  return (
    <>
      <ModalRenderer modalName={ModalName.AddressClaim} />
      <ModalRenderer modalName={ModalName.BlockedAccount} />
      <ModalRenderer modalName={ModalName.UniWalletConnect} />
      <ModalRenderer modalName={ModalName.Banners} />
      <ModalRenderer modalName={ModalName.OffchainActivity} />
      <ModalRenderer modalName={ModalName.TransactionConfirmation} />
      <ModalRenderer modalName={ModalName.UkDisclaimer} />
      <ModalRenderer modalName={ModalName.TestnetMode} componentProps={{ showCloseButton: true }} />
      <ModalRenderer modalName={ModalName.GetTheApp} />
      <ModalRenderer modalName={ModalName.PrivacyPolicy} />
      <ModalRenderer modalName={ModalName.PrivacyChoices} />
      <ModalRenderer modalName={ModalName.FeatureFlags} />
      <ModalRenderer modalName={ModalName.SolanaPromo} />
      {shouldShowDevFlags && <ModalRenderer modalName={ModalName.DevFlags} />}
      <ModalRenderer modalName={ModalName.AddLiquidity} />
      <ModalRenderer modalName={ModalName.RemoveLiquidity} />
      <ModalRenderer modalName={ModalName.ClaimFee} />
      <ModalRenderer modalName={ModalName.PasskeysHelp} componentProps={{ type: passkeysHelpModalType, accountName }} />
      <ModalRenderer modalName={ModalName.Help} />
      <ModalRenderer modalName={ModalName.DelegationMismatch} />
      <ModalRenderer modalName={ModalName.ReceiveCryptoModal} />
    </>
  )
}
