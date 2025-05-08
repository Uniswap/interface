import { ModalRegistry, ModalWrapperProps } from 'components/TopLevelModals/types'
import { useModalState } from 'hooks/useModalState'
import { Suspense, lazy, memo } from 'react'
import { useAppSelector } from 'state/hooks'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'
const AddressClaimModal = lazy(() => import('components/claim/AddressClaimModal'))
const ConnectedAccountBlocked = lazy(() => import('components/ConnectedAccountBlocked'))
const UniwalletModal = lazy(() => import('components/AccountDrawer/UniwalletModal'))
const Banners = lazy(() => import('components/Banner/shared/Banners').then((module) => ({ default: module.Banners })))
const OffchainActivityModal = lazy(() =>
  import('components/AccountDrawer/MiniPortfolio/Activity/OffchainActivityModal').then((module) => ({
    default: module.OffchainActivityModal,
  })),
)
const UkDisclaimerModal = lazy(() =>
  import('components/TopLevelModals/UkDisclaimerModal').then((module) => ({ default: module.UkDisclaimerModal })),
)
const TestnetModeModal = lazy(() =>
  import('uniswap/src/features/testnets/TestnetModeModal').then((module) => ({ default: module.TestnetModeModal })),
)
const GetTheAppModal = lazy(() =>
  import('components/NavBar/DownloadApp/Modal').then((module) => ({ default: module.GetTheAppModal })),
)
const PrivacyPolicyModal = lazy(() =>
  import('components/PrivacyPolicy').then((module) => ({ default: module.PrivacyPolicyModal })),
)
const PrivacyChoicesModal = lazy(() =>
  import('components/PrivacyChoices').then((module) => ({ default: module.PrivacyChoicesModal })),
)
const FeatureFlagModal = lazy(() => import('components/FeatureFlagModal/FeatureFlagModal'))
const DevFlagsBox = lazy(() => import('dev/DevFlagsBox'))
const TokenNotFoundModal = lazy(() => import('components/NotFoundModal/TokenNotFoundModal'))
const PoolNotFoundModal = lazy(() => import('components/NotFoundModal/PoolNotFoundModal'))
const IncreaseLiquidityModal = lazy(() =>
  import('pages/IncreaseLiquidity/IncreaseLiquidityModal').then((module) => ({
    default: module.IncreaseLiquidityModal,
  })),
)
const RemoveLiquidityModal = lazy(() =>
  import('pages/RemoveLiquidity/RemoveLiquidityModal').then((module) => ({ default: module.RemoveLiquidityModal })),
)
const ClaimFeeModal = lazy(() =>
  import('pages/Pool/Positions/ClaimFeeModal').then((module) => ({ default: module.ClaimFeeModal })),
)
const RecoveryPhraseModal = lazy(() =>
  import('components/RecoveryPhrase/Modal').then((module) => ({ default: module.RecoveryPhraseModal })),
)
const PasskeysHelpModal = lazy(() =>
  import('uniswap/src/features/passkey/PasskeysHelpModal').then((module) => ({ default: module.PasskeysHelpModal })),
)

const DelegationMismatchModal = lazy(() =>
  import('components/delegation/DelegationMismatchModal').then((module) => ({
    default: module.default,
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
  [ModalName.RecoveryPhrase]: {
    component: RecoveryPhraseModal,
    shouldMount: (state) => state.application.openModal?.name === ModalName.RecoveryPhrase,
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
