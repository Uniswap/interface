import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Lock } from 'ui/src/components/icons/Lock'
import { PermissionedTokenInfoBottomSheet } from 'uniswap/src/features/permissionedTokens/PermissionedTokenInfoBottomSheet'
import { useActiveSwapPermissionedState } from 'uniswap/src/features/permissionedTokens/useActiveSwapPermissionedState'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

export function PermissionedSwapBanner(): JSX.Element | null {
  const { t } = useTranslation()
  const { value: isInfoOpen, setTrue: openInfo, setFalse: closeInfo } = useBooleanState(false)
  const { isAllowlisted, permissionedSymbol, isPermissioned } = useActiveSwapPermissionedState()

  if (!isPermissioned || isAllowlisted) {
    return null
  }

  const tokenSymbol = permissionedSymbol ?? ''

  const heading = t('permissionedPool.banner.heading', { tokenSymbol })

  return (
    <>
      <TouchableArea
        aria-label={heading}
        accessibilityLabel={heading}
        testID={TestID.PermissionedPoolBanner}
        onPress={openInfo}
      >
        <Flex row alignItems="center" justifyContent="center" gap="$spacing8" py="$padding12">
          <Lock aria-hidden color="$neutral2" size="$icon.20" />
          <Text variant="body3" color="$neutral2">
            {heading}
          </Text>
        </Flex>
      </TouchableArea>
      <PermissionedTokenInfoBottomSheet isOpen={isInfoOpen} tokenSymbol={tokenSymbol} onClose={closeInfo} />
    </>
  )
}
