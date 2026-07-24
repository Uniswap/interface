import { memo, Suspense } from 'react'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { ModalRegistry, ModalWrapperProps } from '~/app/layout/TopLevelModals/types'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { useModalState } from '~/hooks/useModalState'
import { useAppSelector } from '~/state/hooks'
import { createLazy } from '~/utils/lazyWithRetry'

const AddressClaimModal = createLazy(() => import('~/features/claim/AddressClaimModal'))
const ConnectedAccountBlocked = createLazy(() => import('~/components/ConnectedAccountBlocked'))
const PendingWalletConnectionModal = createLazy(
  () => import('~/components/WalletModal/PendingWalletConnectionModal/PendingWalletConnectionModal'),
)
const UniwalletModal = createLazy(() => import('~/components/AccountDrawer/UniwalletModal'))
const OffchainActivityModal = createLazy(() => import('~/components/modals/OffchainActivityModal'))
const TransactionDetailsModalDispatcher = createLazy(() =>
  import('~/app/layout/TopLevelModals/TransactionDetailsModalDispatcher').then((module) => ({
    default: module.TransactionDetailsModalDispatcher,
  })),
)
const UkDisclaimerModal = createLazy(() => import('~/app/layout/TopLevelModals/UkDisclaimerModal'))
const TestnetModeModal = createLazy(() =>
  import('uniswap/src/features/testnets/TestnetModeModal').then((module) => ({ default: module.TestnetModeModal })),
)
const GetTheAppModal = createLazy(() =>
  import('~/components/NavBar/DownloadApp/Modal').then((module) => ({ default: module.GetTheAppModal })),
)
const PrivacyPolicyModal = createLazy(() =>
  import('~/components/PrivacyPolicy').then((module) => ({ default: module.PrivacyPolicyModal })),
)
const PrivacyChoicesModal = createLazy(() =>
  import('~/components/PrivacyChoices').then((module) => ({ default: module.PrivacyChoicesModal })),
)
const DisclosuresModal = createLazy(() =>
  import('~/components/Disclosures').then((module) => ({ default: module.DisclosuresModal })),
)
const FeatureFlagModal = createLazy(() => import('~/components/FeatureFlagModal/FeatureFlagModal'))
const DevFlagsBox = createLazy(() => import('~/dev/DevFlagsBox'))
const TokenNotFoundModal = createLazy(() => import('~/components/NotFoundModal/TokenNotFoundModal'))
const PoolNotFoundModal = createLazy(() => import('~/components/NotFoundModal/PoolNotFoundModal'))
const IncreaseLiquidityModal = createLazy(() =>
  import('~/pages/IncreaseLiquidity/IncreaseLiquidityModal').then((module) => ({
    default: module.IncreaseLiquidityModal,
  })),
)
const RemoveLiquidityModal = createLazy(() =>
  import('~/pages/RemoveLiquidity/RemoveLiquidityModal').then((module) => ({ default: module.RemoveLiquidityModal })),
)
const ClaimFeeModal = createLazy(() =>
  import('~/features/Liquidity/ClaimFeeModal').then((module) => ({ default: module.ClaimFeeModal })),
)
const DelegationMismatchModal = createLazy(() =>
  import('~/components/delegation/DelegationMismatchModal').then((module) => ({
    default: module.default,
  })),
)
const HelpModal = createLazy(() =>
  import('~/components/HelpModal/HelpModal').then((module) => ({ default: module.HelpModal })),
)

const ReceiveCryptoModal = createLazy(() =>
  import('~/components/ReceiveCryptoModal').then((module) => ({ default: module.ReceiveCryptoModal })),
)

const SendModal = createLazy(() =>
  import('~/pages/Swap/Send/SendFormModal').then((module) => ({ default: module.SendFormModal })),
)

const BridgedAssetModal = createLazy(() =>
  import('uniswap/src/components/BridgedAsset/BridgedAssetModal').then((module) => ({
    default: module.BridgedAssetModal,
  })),
)

const WormholeModal = createLazy(() =>
  import('uniswap/src/components/BridgedAsset/WormholeModal').then((module) => ({
    default: module.WormholeModal,
  })),
)

const ReportTokenModal = createLazy(() =>
  import('uniswap/src/components/reporting/ReportTokenIssueModal').then((module) => ({
    default: module.ReportTokenIssueModal,
  })),
)

const ReportTokenDataModal = createLazy(() =>
  import('uniswap/src/components/reporting/ReportTokenDataModal').then((module) => ({
    default: module.ReportTokenDataModal,
  })),
)

const DataApiOutageModal = createLazy(() =>
  import('~/components/DataApiOutageModal').then((module) => ({ default: module.DataApiOutageModal })),
)

const AddBackupLoginModal = createLazy(() =>
  import('~/components/Passkey/AddBackupLoginModal').then((module) => ({ default: module.AddBackupLoginModal })),
)

const ReconnectBackupLoginModal = createLazy(() =>
  import('~/components/Passkey/ReconnectBackupLoginModal').then((module) => ({
    default: module.ReconnectBackupLoginModal,
  })),
)

const AddPasskeyModal = createLazy(() =>
  import('~/components/Passkey/AddPasskeyModal').then((module) => ({ default: module.AddPasskeyModal })),
)
const RecoverWalletModal = createLazy(() =>
  import('~/components/Passkey/RecoverWalletModal').then((module) => ({ default: module.RecoverWalletModal })),
)

const RemovePasskeyModal = createLazy(() =>
  import('~/components/Passkey/RemovePasskeyModal').then((module) => ({ default: module.RemovePasskeyModal })),
)

const RemoveBackupLoginModal = createLazy(() =>
  import('~/components/Passkey/RemoveBackupLoginModal').then((module) => ({
    default: module.RemoveBackupLoginModal,
  })),
)

const UnitagRateLimitSpeedbumpModal = createLazy(() =>
  import('~/components/UnitagRateLimitSpeedbump/UnitagRateLimitSpeedbumpModal').then((module) => ({
    default: module.UnitagRateLimitSpeedbumpModal,
  })),
)

const UnsupportedBrowserModal = createLazy(() =>
  import('~/components/Passkey/UnsupportedBrowserModal').then((module) => ({
    default: module.UnsupportedBrowserModal,
  })),
)
function ModalLoadingFallback(): null {
  return null
}

function ModalErrorFallback({ error }: { error: Error }): null {
  logger.error(error, {
    tags: {
      file: 'modalRegistry',
      function: 'ModalErrorFallback',
    },
    extra: {
      message: 'Modal failed to load - error caught by ErrorBoundary. Modal will not be displayed.',
    },
  })
  return null
}

const ModalWrapper = memo(({ Component, componentProps }: ModalWrapperProps) => (
  <ErrorBoundary fallback={ModalErrorFallback}>
    <Suspense fallback={<ModalLoadingFallback />}>
      <Component {...componentProps} />
    </Suspense>
  </ErrorBoundary>
))
ModalWrapper.displayName = 'ModalWrapper'

export const modalRegistry: ModalRegistry = {
  [ModalName.AddressClaim]: {
    component: AddressClaimModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.AddressClaim,
  },
  [ModalName.BlockedAccount]: {
    component: ConnectedAccountBlocked,
    shouldMount: (state) => state.application.openModal?.name === ModalName.BlockedAccount,
  },
  [ModalName.UniWalletConnect]: {
    component: UniwalletModal,
    // This modal is opened via WalletConnect Uri, not redux state, so it should always be mounted
    shouldMount: () => true,
  },
  [ModalName.OffchainActivity]: {
    component: OffchainActivityModal,
    shouldMount: () => true,
  },
  [ModalName.TransactionDetails]: {
    component: TransactionDetailsModalDispatcher,
    shouldMount: () => true,
  },
  [ModalName.UkDisclaimer]: {
    component: UkDisclaimerModal,
    shouldMount: () => true,
  },
  [ModalName.TestnetMode]: {
    component: TestnetModeModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.TestnetMode,
  },
  [ModalName.GetTheApp]: {
    component: GetTheAppModal,
    shouldMount: () => true,
  },
  [ModalName.PendingWalletConnection]: {
    component: PendingWalletConnectionModal,
    shouldMount: () => true,
  },
  [ModalName.PrivacyPolicy]: {
    component: PrivacyPolicyModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.PrivacyPolicy,
  },
  [ModalName.Disclosures]: {
    component: DisclosuresModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.Disclosures,
  },
  [ModalName.PrivacyChoices]: {
    component: PrivacyChoicesModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.PrivacyChoices,
  },
  [ModalName.FeatureFlags]: {
    component: FeatureFlagModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.FeatureFlags,
  },
  [ModalName.AddLiquidity]: {
    component: IncreaseLiquidityModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.AddLiquidity,
  },
  [ModalName.RemoveLiquidity]: {
    component: RemoveLiquidityModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.RemoveLiquidity,
  },
  [ModalName.ClaimFee]: {
    component: ClaimFeeModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.ClaimFee,
  },
  [ModalName.TokenNotFound]: {
    component: TokenNotFoundModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.TokenNotFound,
  },
  [ModalName.PoolNotFound]: {
    component: PoolNotFoundModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.PoolNotFound,
  },
  [ModalName.DevFlags]: {
    component: DevFlagsBox,
    shouldMount: () => true,
  },
  [ModalName.DelegationMismatch]: {
    component: DelegationMismatchModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.DelegationMismatch,
  },
  [ModalName.Help]: {
    component: HelpModal,
    shouldMount: () => true,
  },
  [ModalName.ReceiveCryptoModal]: {
    component: ReceiveCryptoModal,
    shouldMount: () => true,
  },
  [ModalName.Send]: {
    component: SendModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.Send,
  },
  [ModalName.BridgedAsset]: {
    component: BridgedAssetModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.BridgedAsset,
  },
  [ModalName.Wormhole]: {
    component: WormholeModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.Wormhole,
  },
  [ModalName.ReportTokenIssue]: {
    component: ReportTokenModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.ReportTokenIssue,
  },
  [ModalName.ReportTokenData]: {
    component: ReportTokenDataModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.ReportTokenData,
  },
  [ModalName.DataApiOutage]: {
    component: DataApiOutageModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.DataApiOutage,
  },
  [ModalName.AddBackupLogin]: {
    component: AddBackupLoginModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.AddBackupLogin,
  },
  [ModalName.ReconnectBackupLogin]: {
    component: ReconnectBackupLoginModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.ReconnectBackupLogin,
  },
  [ModalName.AddPasskey]: {
    component: AddPasskeyModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.AddPasskey,
  },
  [ModalName.RecoverWallet]: {
    component: RecoverWalletModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.RecoverWallet,
  },
  [ModalName.DeletePasskey]: {
    component: RemovePasskeyModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.DeletePasskey,
  },
  [ModalName.RemoveBackupLogin]: {
    component: RemoveBackupLoginModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.RemoveBackupLogin,
  },
  [ModalName.UnitagRateLimitSpeedbump]: {
    component: UnitagRateLimitSpeedbumpModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.UnitagRateLimitSpeedbump,
  },
  [ModalName.UnsupportedBrowser]: {
    component: UnsupportedBrowserModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.UnsupportedBrowser,
  },
} as const

export const ModalRenderer = ({
  modalName,
  componentProps,
}: {
  modalName: ModalNameType
  componentProps?: Record<string, any>
}) => {
  // oxlint-disable-next-line no-shadow
  const state = useAppSelector((state) => state)
  const modalState = useModalState(modalName)

  const config = modalRegistry[modalName]
  if (!config) {
    return null
  }

  const { component: Component, shouldMount } = config

  if (!shouldMount(state)) {
    return null
  }

  return <ModalWrapper Component={Component} componentProps={{ ...componentProps, ...modalState }} />
}
