import { Flex, Text } from '@universe/mycelium'
import { Wrench } from '@universe/mycelium/icons/Wrench'
import { TooltipCompat as Tooltip } from '@universe/mycelium/tooltip-compat'
import { useTranslation } from 'react-i18next'
import { useAccountDrawer } from '~/state/accountDrawer/hooks'
import { MenuStateVariant, useSetMenu } from '~/state/accountDrawer/menuState'

export function TestnetModeTooltip() {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()

  return (
    <Tooltip delay={{ close: 0 }} placement="bottom-end">
      <Tooltip.Trigger>
        <Flex
          p="$spacing4"
          backgroundColor="$statusSuccess2"
          borderWidth="$spacing1"
          borderStyle="dashed"
          borderColor="$statusSuccess"
          borderRadius="$rounded8"
          cursor="pointer"
          onPress={() => {
            setMenu({ variant: MenuStateVariant.SETTINGS })
            accountDrawer.open()
          }}
        >
          <Wrench color="$statusSuccess" size="$icon.16" />
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content animationDirection="right">
        <Text variant="body4">{t('home.banner.testnetMode.nav')}</Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
