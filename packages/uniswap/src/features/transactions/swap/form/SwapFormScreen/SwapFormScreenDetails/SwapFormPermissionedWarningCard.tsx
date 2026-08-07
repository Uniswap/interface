import { Flex } from 'ui/src'
import { PermissionedTokenWarningCard } from 'uniswap/src/features/permissionedTokens/PermissionedTokenWarningCard'
import { useActiveSwapPermissionedState } from 'uniswap/src/features/permissionedTokens/useActiveSwapPermissionedState'

export function SwapFormPermissionedWarningCard(): JSX.Element | null {
  const { isAllowlisted, permissionedSymbol, isPermissioned } = useActiveSwapPermissionedState()

  if (!isPermissioned || isAllowlisted) {
    return null
  }

  return (
    <Flex pt="$spacing12">
      <PermissionedTokenWarningCard tokenSymbol={permissionedSymbol ?? ''} />
    </Flex>
  )
}
