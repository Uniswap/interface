import { ModalRegistry, ModalWrapperProps } from 'components/TopLevelModals/types'
import { useModalState } from 'hooks/useModalState'
import { memo, Suspense } from 'react'
import { useAppSelector } from 'state/hooks'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
import { createLazy } from 'utils/lazyWithRetry'

const AddressClaimModal = createLazy(() => import('components/claim/AddressClaimModal'))
const ConnectedAccountBlocked = createLazy(() => import('components/ConnectedAccountBlocked'))
const PendingWalletConnectionModal = createLazy(
  () => import('components/WalletModal/PendingWalletConnectionModal/PendingWalletConnectionModal'),
)
const UniwalletModal = createLazy(() => import('components/AccountDrawer/UniwalletModal'))
const Banners = createLazy(() =>
  import('components/Banner/shared/Banners').then((module) => ({ default: module.Banners })),
)
const OffchainActivityModal = createLazy(() =>
  import('components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal').then((module) => ({
    default: module.OffchainActivityModal,
  })),
)
const UkDisclaimerModal = createLazy(() =>
  import('components/TopLevelModals/UkDisclaimerModal').then((module) => ({ default: module.UkDisclaimerModal })),
)
const TestnetModeModal = createLazy(() =>
  import('uniswap/src/features/testnets/TestnetModeModal').then((module) => ({ default: module.TestnetModeModal })),
)
const GetTheAppModal = createLazy(() =>
  import('components/NavBar/DownloadApp/Modal').then((module) => ({ default: module.GetTheAppModal })),
)
const PrivacyPolicyModal = createLazy(() =>
  import('components/PrivacyPolicy').then((module) => ({ default: module.PrivacyPolicyModal })),
)
const PrivacyChoicesModal = createLazy(() =>
  import('components/PrivacyChoices').then((module) => ({ default: module.PrivacyChoicesModal })),
)
const FeatureFlagModal = createLazy(() => import('components/FeatureFlagModal/FeatureFlagModal'))
const SolanaPromoModal = createLazy(() => import('components/Banner/SolanaPromo/SolanaPromoModal'))
const DevFlagsBox = createLazy(() => import('dev/DevFlagsBox'))
const TokenNotFoundModal = createLazy(() => import('components/NotFoundModal/TokenNotFoundModal'))
const PoolNotFoundModal = createLazy(() => import('components/NotFoundModal/PoolNotFoundModal'))
const IncreaseLiquidityModal = createLazy(() =>
  import('pages/IncreaseLiquidity/IncreaseLiquidityModal').then((module) => ({
    default: module.IncreaseLiquidityModal,
  })),
)
const RemoveLiquidityModal = createLazy(() =>
  import('pages/RemoveLiquidity/RemoveLiquidityModal').then((module) => ({ default: module.RemoveLiquidityModal })),
)
const ClaimFeeModal = createLazy(() =>
  import('components/Liquidity/ClaimFeeModal').then((module) => ({ default: module.ClaimFeeModal })),
)
const PasskeysHelpModal = createLazy(() =>
  import('uniswap/src/features/passkey/PasskeysHelpModal').then((module) => ({ default: module.PasskeysHelpModal })),
)

const DelegationMismatchModal = createLazy(() =>
  import('components/delegation/DelegationMismatchModal').then((module) => ({
    default: module.default,
  })),
)
const HelpModal = createLazy(() =>
  import('components/HelpModal/HelpModal').then((module) => ({ default: module.HelpModal })),
)

const ReceiveCryptoModal = createLazy(() =>
  import('components/ReceiveCryptoModal').then((module) => ({ default: module.ReceiveCryptoModal })),
)

const SendModal = createLazy(() =>
  import('pages/Swap/Send/SendFormModal').then((module) => ({ default: module.SendFormModal })),
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
const ModalLoadingFallback = memo(() => null)
ModalLoadingFallback.displayName = 'ModalLoadingFallback'

const ModalWrapper = memo(({ Component, componentProps }: ModalWrapperProps) => (
  <Suspense fallback={<ModalLoadingFallback />}>
    <Component {...componentProps} />
  </Suspense>
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
  [ModalName.Banners]: {
    component: Banners,
    shouldMount: () => true,
  },
  [ModalName.OffchainActivity]: {
    component: OffchainActivityModal,
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
  [ModalName.PrivacyChoices]: {
    component: PrivacyChoicesModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.PrivacyChoices,
  },
  [ModalName.FeatureFlags]: {
    component: FeatureFlagModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.FeatureFlags,
  },
  [ModalName.SolanaPromo]: {
    component: SolanaPromoModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.SolanaPromo,
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
  [ModalName.PasskeysHelp]: {
    component: PasskeysHelpModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.PasskeysHelp,
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
} as const

export const ModalRenderer = ({
  modalName,
  componentProps,
}: {
  modalName: ModalNameType
  componentProps?: Record<string, any>
}) => {
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
