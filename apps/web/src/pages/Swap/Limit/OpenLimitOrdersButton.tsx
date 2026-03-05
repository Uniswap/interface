import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Arrow } from 'ui/src/components/arrow/Arrow'
import { Clock } from 'ui/src/components/icons/Clock'
import { iconSizes } from 'ui/src/theme'
import { useOpenLimitOrders } from '~/components/AccountDrawer/MiniPortfolio/Activity/hooks'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

function getExtraWarning(openLimitOrders: any[]) {
  if (openLimitOrders.length >= 100) {
    return <Trans i18nKey="common.limits.cancelProceed" />
  }
  if (openLimitOrders.length >= 90) {
    return <Trans i18nKey="common.limits.approachMax" />
  }
  return undefined
}

interface TabButtonProps {
  text: ReactNode
  icon: ReactNode
  extraWarning?: ReactNode
  onClick: () => void
  disabled?: boolean
}

function TabButton({ text, icon, extraWarning, onClick, disabled }: TabButtonProps) {
  return (
    <TouchableArea
      onPress={onClick}
      disabled={disabled}
      borderRadius="$rounded16"
      backgroundColor="$surface2"
      py="$spacing12"
      px="$spacing16"
      gap="$spacing12"
      justifyContent="space-between"
      alignItems="center"
      mt="$spacing12"
      {...ClickableTamaguiStyle}
    >
      <Flex row justifyContent="space-between" alignItems="center" gap="$spacing12" width="100%">
        <Flex row gap="$spacing8">
          {icon}
          <Flex>
            <Text variant="buttonLabel3" color="$neutral2" lineHeight={20} fontWeight="$medium">
              {text}
            </Text>
            {extraWarning && <Text variant="body4">{extraWarning}</Text>}
          </Flex>
        </Flex>
        <Arrow color="$neutral2" size={iconSizes.icon20} />
      </Flex>
    </TouchableArea>
  )
}

export function OpenLimitOrdersButton({
  openLimitsMenu,
  account,
  disabled,
}: {
  account: string
  openLimitsMenu: () => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const { openLimitOrders, loading } = useOpenLimitOrders(account)
  const extraWarning = getExtraWarning(openLimitOrders)

  if (openLimitOrders.length < 1) {
    return null
  }

  return (
    <Flex mb="$spacing8">
      <TabButton
        text={loading ? t('common.loading') : t('limit.open.count', { count: openLimitOrders.length })}
        icon={<Clock color="$neutral2" size="$icon.20" />}
        extraWarning={extraWarning}
        onClick={openLimitsMenu}
        disabled={disabled || loading}
      />
    </Flex>
  )
}
