import { memo } from 'react'
import type { ColorTokens, GeneratedIcon } from 'ui/src'
import { Flex, Tooltip as TooltipComponent } from 'ui/src'
import { Settings } from 'ui/src/components/icons/Settings'
import type { IconSizeTokens } from 'ui/src/theme'
import { TransactionSettingsModalId } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import { useModalVisibility } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/useTransactionSettingsModalStore'
import { isWebApp, isWebPlatform } from 'utilities/src/platform'

type TransactionSettingsButtonProps = {
  Tooltip?: React.ReactNode
  contentColor?: ColorTokens
  iconSize?: IconSizeTokens
  backgroundColor?: ColorTokens
  CustomIconComponent?: GeneratedIcon
  IconLabel?: React.ReactNode
}

export const TransactionSettingsButton = memo(
  ({
    iconSize: iconSizeProp,
    contentColor,
    backgroundColor,
    CustomIconComponent,
    IconLabel,
  }: Omit<TransactionSettingsButtonProps, 'Tooltip'>): JSX.Element => {
    const IconComponent = CustomIconComponent ?? Settings

    const iconSize = iconSizeProp ?? (isWebPlatform ? '$icon.20' : '$icon.24')

    return (
      <Flex
        centered
        row
        backgroundColor={backgroundColor}
        borderRadius="$roundedFull"
        gap="$spacing4"
        px={IconLabel ? '$spacing8' : '$spacing4'}
        py="$spacing4"
        height={isWebApp ? '$spacing32' : 'auto'}
      >
        {IconLabel}
        <IconComponent color={contentColor} size={iconSize} />
      </Flex>
    )
  },
)

export const TransactionSettingsButtonWithTooltip = memo(
  ({
    Tooltip,
    iconSize: iconSizeProp,
    IconLabel,
    contentColor,
    backgroundColor,
    CustomIconComponent,
  }: TransactionSettingsButtonProps): JSX.Element => {
    const iconSize = iconSizeProp ?? (isWebPlatform ? '$icon.20' : '$icon.24')
    const isTransactionSettingsModalVisible = useModalVisibility(TransactionSettingsModalId.TransactionSettings)

    const button = (
      <TransactionSettingsButton
        iconSize={iconSize}
        contentColor={contentColor}
        backgroundColor={backgroundColor}
        CustomIconComponent={CustomIconComponent}
        IconLabel={IconLabel}
      />
    )

    if (Tooltip && !isTransactionSettingsModalVisible) {
      return (
        <TooltipComponent>
          <TooltipComponent.Trigger>{button}</TooltipComponent.Trigger>
          <TooltipComponent.Content>{Tooltip}</TooltipComponent.Content>
        </TooltipComponent>
      )
    }

    return button
  },
)

TransactionSettingsButton.displayName = 'TransactionSettingsButton'
