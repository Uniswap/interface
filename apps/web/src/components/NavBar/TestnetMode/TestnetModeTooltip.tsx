import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import { MenuStateVariant, useSetMenu } from 'components/AccountDrawer/menuState'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'
import { Wrench } from 'ui/src/components/icons/Wrench'

export default function TestnetModeTooltip() {
  const { t } = useTranslation()
  const accountDrawer = useAccountDrawer()
  const setMenu = useSetMenu()

  return (
    <Tooltip delay={{ close: 0 }} placement="bottom-end">
      <Tooltip.Trigger>
        <Flex
          p="$spacing4"
          background="$statusSuccess2"
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
