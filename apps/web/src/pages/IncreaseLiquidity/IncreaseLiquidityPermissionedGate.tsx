import { VerifyIdentityBottomSheetView } from 'uniswap/src/features/permissionedTokens/VerifyIdentityBottomSheet'
import { PermissionedPoolBanner } from '~/components/PermissionedPool/PermissionedPoolBanner'

type IncreaseLiquidityPermissionedGateProps = {
  showVerifyIdentity: boolean
  tokenSymbol: string | undefined
  permissionedConfig: { registrationUrl: string; issuer: string } | undefined
  isVerifyIdentityOpen: boolean
  onCloseVerifyIdentity: () => void
}

// Banner + Verify Identity sheet for the add-liquidity gated state (ECO-578); mirrors
// DepositPermissionedGate in Deposit.tsx (no create-block case here: the position, and
// therefore the pool, already exists). Uses the shared VerifyIdentityBottomSheetView with a
// controlled isOpen, the same presentation the swap flow uses. It must never open via the
// global modal slot: this gate renders inside the AddLiquidity modal, which mounts only while
// the single-slot openModal is AddLiquidity, so dispatching another modal name would unmount
// this whole subtree, sheet included.
export function IncreaseLiquidityPermissionedGate({
  showVerifyIdentity,
  tokenSymbol,
  permissionedConfig,
  isVerifyIdentityOpen,
  onCloseVerifyIdentity,
}: IncreaseLiquidityPermissionedGateProps): JSX.Element | null {
  if (!showVerifyIdentity) {
    return null
  }
  return (
    <>
      <PermissionedPoolBanner tokenSymbol={tokenSymbol ?? ''} />
      <VerifyIdentityBottomSheetView
        isOpen={isVerifyIdentityOpen}
        onClose={onCloseVerifyIdentity}
        tokenSymbol={tokenSymbol ?? ''}
        registrationUrl={permissionedConfig?.registrationUrl}
        issuer={permissionedConfig?.issuer}
        isAllowlisted={false}
        hasPermissionedToken={true}
      />
    </>
  )
}
