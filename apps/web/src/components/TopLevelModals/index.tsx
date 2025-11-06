import { POPUP_MEDIUM_DISMISS_MS } from 'components/Popups/constants'
import { popupRegistry } from 'components/Popups/registry'
import { PopupType } from 'components/Popups/types'
import { ModalRenderer } from 'components/TopLevelModals/modalRegistry'
import useAccountRiskCheck from 'hooks/useAccountRiskCheck'
import { PageType, useIsPage } from 'hooks/useIsPage'
import { PasskeysHelpModalTypeAtom } from 'hooks/usePasskeyAuthWithHelpModal'
import { useAtomValue } from 'jotai/utils'
import { useTranslation } from 'react-i18next'
import { BridgedAssetModalAtom } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { WormholeModalAtom } from 'uniswap/src/components/BridgedAsset/WormholeModal'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { useUnitagsAddressQuery } from 'uniswap/src/data/apiClients/unitagsApi/useUnitagsAddressQuery'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { shortenAddress } from 'utilities/src/addresses'
import { isBetaEnv, isDevEnv } from 'utilities/src/environment/env'
import { useEvent } from 'utilities/src/react/hooks'

export default function TopLevelModals() {
  const { t } = useTranslation()
  const isLandingPage = useIsPage(PageType.LANDING)
  const wallet = useWallet()
  const evmAddress = wallet.evmAccount?.address
  const svmAddress = wallet.svmAccount?.address
  const { data: unitag } = useUnitagsAddressQuery({
    params: evmAddress ? { address: evmAddress } : undefined,
  })
  const evmAccountName = unitag?.username
    ? unitag.username + '.uni.eth'
    : evmAddress
      ? shortenAddress({ address: evmAddress })
      : undefined
  const blockedAddress = useAccountRiskCheck({ evmAddress, svmAddress })
  const passkeysHelpModalType = useAtomValue(PasskeysHelpModalTypeAtom)
  const bridgedAssetModalProps = useAtomValue(BridgedAssetModalAtom)
  const wormholeModalProps = useAtomValue(WormholeModalAtom)

  const reportTokenIssueProps = useAtomValue(ReportTokenIssueModalPropsAtom)
  const onReportSuccess = useEvent(() => {
    popupRegistry.addPopup(
      { type: PopupType.Success, message: t('common.reported') },
      'report-token-success',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })

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
        <ModalRenderer modalName={ModalName.ReceiveCryptoModal} />
        <ModalRenderer modalName={ModalName.PendingWalletConnection} />
      </>
    )
  }

  return (
    <>
      <ModalRenderer modalName={ModalName.AddressClaim} />
      <ModalRenderer modalName={ModalName.BlockedAccount} componentProps={{ blockedAddress }} />
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
      <ModalRenderer
        modalName={ModalName.PasskeysHelp}
        componentProps={{ type: passkeysHelpModalType, accountName: evmAccountName }}
      />
      <ModalRenderer modalName={ModalName.Help} />
      <ModalRenderer modalName={ModalName.DelegationMismatch} />
      <ModalRenderer modalName={ModalName.ReceiveCryptoModal} />
      <ModalRenderer modalName={ModalName.Send} />
      <ModalRenderer modalName={ModalName.BridgedAsset} componentProps={bridgedAssetModalProps} />
      <ModalRenderer modalName={ModalName.Wormhole} componentProps={wormholeModalProps} />
      <ModalRenderer modalName={ModalName.PendingWalletConnection} />
      <ModalRenderer
        modalName={ModalName.ReportTokenIssue}
        componentProps={{ ...reportTokenIssueProps, onReportSuccess }}
      />
    </>
  )
}
