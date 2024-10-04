import { useMemo } from 'react'
import { CloseIcon } from 'theme/components'
import { Flex, Text, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'

export function LiquidityModalHeader({
  title,
  closeModal,
  goBack,
}: {
  title: string
  closeModal: () => void
  goBack?: () => void
}) {
  const CloseIconComponent = useMemo(
    () => <CloseIcon data-testid="LiquidityModalHeader-close" onClick={closeModal} size={iconSizes.icon24} />,
    [closeModal],
  )

  return (
    <Flex row justifyContent="space-between" alignItems="center" gap="$spacing4" width="100%">
      {goBack ? (
        <TouchableArea onPress={goBack}>
          <BackArrow color="$neutral1" size="$icon.24" />
        </TouchableArea>
      ) : (
        CloseIconComponent
      )}
      <Text variant="body2" flexGrow={1} textAlign="center" pr={24}>
        {title}
      </Text>
      {!!goBack && CloseIconComponent}
    </Flex>
  )
}
