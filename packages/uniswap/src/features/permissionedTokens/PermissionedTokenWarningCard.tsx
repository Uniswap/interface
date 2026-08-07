import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { InfoCircle } from 'ui/src/components/icons/InfoCircle'
import { Lock } from 'ui/src/components/icons/Lock'
import { PermissionedTokenInfoBottomSheet } from 'uniswap/src/features/permissionedTokens/PermissionedTokenInfoBottomSheet'
import { useBooleanState } from 'utilities/src/react/useBooleanState'

type PermissionedTokenWarningCardProps = {
  tokenSymbol: string
}

export function PermissionedTokenWarningCard({ tokenSymbol }: PermissionedTokenWarningCardProps): JSX.Element {
  const { t } = useTranslation()
  const { value: isInfoOpen, setTrue: openInfo, setFalse: closeInfo } = useBooleanState(false)

  const heading = t('permissionedPool.banner.heading', { tokenSymbol })

  return (
    <>
      <TouchableArea aria-label={heading} accessibilityLabel={heading} onPress={openInfo}>
        <Flex
          row
          backgroundColor="$surface2"
          borderRadius="$rounded12"
          p="$padding12"
          gap="$spacing12"
          alignItems="flex-start"
        >
          <Lock size="$icon.20" color="$neutral2" />
          <Flex flex={1} gap="$spacing2">
            <Text variant="body3" color="$neutral1">
              {heading}
            </Text>
            <Text variant="body3" color="$neutral2">
              {t('permissionedPool.banner.description')}
            </Text>
          </Flex>
          <InfoCircle size="$icon.20" color="$neutral3" />
        </Flex>
      </TouchableArea>
      <PermissionedTokenInfoBottomSheet isOpen={isInfoOpen} tokenSymbol={tokenSymbol} onClose={closeInfo} />
    </>
  )
}
