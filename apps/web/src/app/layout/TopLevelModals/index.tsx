import { isBetaEnv, isDevEnv } from '@universe/environment'
import { useAtomValue } from 'jotai/utils'
import { useTranslation } from 'react-i18next'
import { BridgedAssetModalAtom } from 'uniswap/src/components/BridgedAsset/BridgedAssetModal'
import { WormholeModalAtom } from 'uniswap/src/components/BridgedAsset/WormholeModal'
import { ReportTokenDataModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenDataModal'
import { ReportTokenIssueModalPropsAtom } from 'uniswap/src/components/reporting/ReportTokenIssueModal'
import { useActiveAddresses } from 'uniswap/src/features/accounts/store/hooks'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { AnalyticsDebugOverlayLazy } from 'uniswap/src/features/telemetry/debug/AnalyticsDebugOverlayLazy'
import { useEvent } from 'utilities/src/react/hooks'
import { ModalRenderer } from '~/app/layout/TopLevelModals/modalRegistry'
import { OAuthRedirectProvider } from '~/components/Passkey/OAuthRedirectContext'
import { useOAuthRedirectRouter } from '~/components/Passkey/useOAuthRedirectRouter'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { GlobalEarnVaultModal } from '~/features/earn/GlobalEarnVaultModal'
import { useAccountRiskCheck } from '~/hooks/useAccountRiskCheck'
import { PageType, useIsPage } from '~/hooks/useIsPage'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'

export function TopLevelModals() {
  useOAuthRedirectRouter()
  const { t } = useTranslation()
  const isLandingPage = useIsPage(PageType.LANDING)
  const { evmAddress, svmAddress } = useActiveAddresses()
  const blockedAddress = useAccountRiskCheck({ evmAddress, svmAddress })
  const bridgedAssetModalProps = useAtomValue(BridgedAssetModalAtom)
  const wormholeModalProps = useAtomValue(WormholeModalAtom)

  const reportTokenIssueProps = useAtomValue(ReportTokenIssueModalPropsAtom)
  const reportTokenDataProps = useAtomValue(ReportTokenDataModalPropsAtom)
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
      <OAuthRedirectProvider value={true}>
        <ModalRenderer modalName={ModalName.PrivacyPolicy} />
        <ModalRenderer modalName={ModalName.PrivacyChoices} />
        <ModalRenderer modalName={ModalName.Disclosures} />
        <ModalRenderer modalName={ModalName.GetTheApp} />
        <ModalRenderer modalName={ModalName.FeatureFlags} />
        <ModalRenderer modalName={ModalName.UniWalletConnect} />
        <ModalRenderer modalName={ModalName.BlockedAccount} />
        {shouldShowDevFlags && <ModalRenderer modalName={ModalName.DevFlags} />}
        <ModalRenderer modalName={ModalName.Help} />
        <ModalRenderer modalName={ModalName.OffchainActivity} />
        <ModalRenderer modalName={ModalName.ReceiveCryptoModal} />
        <ModalRenderer modalName={ModalName.PendingWalletConnection} />
        <ModalRenderer modalName={ModalName.AddPasskey} />
        <ModalRenderer modalName={ModalName.AddBackupLogin} />
        <ModalRenderer modalName={ModalName.ReconnectBackupLogin} />
        <ModalRenderer modalName={ModalName.RecoverWallet} />
        <ModalRenderer modalName={ModalName.DeletePasskey} />
        <ModalRenderer modalName={ModalName.RemoveBackupLogin} />
        <ModalRenderer modalName={ModalName.UnitagRateLimitSpeedbump} />
        <ModalRenderer modalName={ModalName.UnsupportedBrowser} />
      </OAuthRedirectProvider>
    )
  }

  return (
    <OAuthRedirectProvider value={true}>
      <ModalRenderer modalName={ModalName.AddressClaim} />
      <ModalRenderer modalName={ModalName.BlockedAccount} componentProps={{ blockedAddress }} />
      <ModalRenderer modalName={ModalName.UniWalletConnect} />
      <ModalRenderer modalName={ModalName.Banners} />
      <ModalRenderer modalName={ModalName.OffchainActivity} />
      <ModalRenderer modalName={ModalName.TransactionDetails} />
      <ModalRenderer modalName={ModalName.TransactionConfirmation} />
      <ModalRenderer modalName={ModalName.UkDisclaimer} />
      <ModalRenderer modalName={ModalName.TestnetMode} componentProps={{ showCloseButton: true }} />
      <ModalRenderer modalName={ModalName.GetTheApp} />
      <ModalRenderer modalName={ModalName.PrivacyPolicy} />
      <ModalRenderer modalName={ModalName.PrivacyChoices} />
      <ModalRenderer modalName={ModalName.Disclosures} />
      <ModalRenderer modalName={ModalName.FeatureFlags} />
      {shouldShowDevFlags && <ModalRenderer modalName={ModalName.DevFlags} />}
      {shouldShowDevFlags && <AnalyticsDebugOverlayLazy />}
      <ModalRenderer modalName={ModalName.AddLiquidity} />
      <ModalRenderer modalName={ModalName.RemoveLiquidity} />
      <ModalRenderer modalName={ModalName.ClaimFee} />
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
      <ModalRenderer
        modalName={ModalName.ReportTokenData}
        componentProps={{ ...reportTokenDataProps, onReportSuccess }}
      />
      <ModalRenderer modalName={ModalName.AddPasskey} />
      <ModalRenderer modalName={ModalName.AddBackupLogin} />
      <ModalRenderer modalName={ModalName.ReconnectBackupLogin} />
      <ModalRenderer modalName={ModalName.RecoverWallet} />
      <ModalRenderer modalName={ModalName.DeletePasskey} />
      <ModalRenderer modalName={ModalName.RemoveBackupLogin} />
      <ModalRenderer modalName={ModalName.DataApiOutage} />
      <ModalRenderer modalName={ModalName.UnitagRateLimitSpeedbump} />
      <ModalRenderer modalName={ModalName.UnsupportedBrowser} />
      <GlobalEarnVaultModal />
    </OAuthRedirectProvider>
  )
}
