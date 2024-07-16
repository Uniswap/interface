import { PropsWithChildren } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, Tooltip } from 'ui/src'

type Side = 'top' | 'right' | 'bottom' | 'left'
type Alignment = 'start' | 'end'
type AlignedPlacement = `${Side}-${Alignment}`

export function ComingSoon({
  children,
  placement = 'bottom-end',
}: PropsWithChildren & {
  placement?: Side | AlignedPlacement
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Tooltip delay={20} placement={placement}>
      <Tooltip.Trigger>
        <Flex grow flex={1}>
          {children}
        </Flex>
      </Tooltip.Trigger>
      <Tooltip.Content px="$none" py="$none">
        <Flex p="$spacing12">
          <Text color="$neutral2" variant="body3">
            {t('settings.setting.beta.tooltip')}
          </Text>
        </Flex>
      </Tooltip.Content>
    </Tooltip>
  )
}
