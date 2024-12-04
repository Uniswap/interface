import { useMemo } from 'react'
import { CloseIcon } from 'theme/components'
import { Flex, Text, TouchableArea } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'
import { SwapFormSettings } from 'uniswap/src/features/transactions/swap/form/SwapFormSettings'
import { Deadline } from 'uniswap/src/features/transactions/swap/settings/configs/Deadline'
import { Slippage } from 'uniswap/src/features/transactions/swap/settings/configs/Slippage'
import { useTranslation } from 'uniswap/src/i18n'

export function LiquidityModalHeader({
  title,
  closeModal,
  goBack,
}: {
  title: string
  closeModal: () => void
  goBack?: () => void
}) {
  const { t } = useTranslation()

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
      {!goBack ? (
        <SwapFormSettings
          adjustTopAlignment={false}
          settings={[Slippage, Deadline]}
          defaultTitle={t('pool.positions.transaction.settings')}
        />
      ) : (
        CloseIconComponent
      )}
    </Flex>
  )
}
