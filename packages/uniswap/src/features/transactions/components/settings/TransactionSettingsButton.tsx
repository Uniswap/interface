import { memo } from 'react'
import type { ColorTokens, GeneratedIcon } from 'ui/src'
import { Flex, Tooltip as TooltipComponent } from 'ui/src'
import { SettingsCustom } from 'ui/src/components/icons/SettingsCustom'
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
    // Use SettingsCustom as default icon, or CustomIconComponent if provided
    const IconComponent = CustomIconComponent ?? SettingsCustom

    // Check if the icon is SettingsCustom (by checking displayName or comparing function)
    const isSettingsCustom =
      !CustomIconComponent ||
      CustomIconComponent === SettingsCustom ||
      CustomIconComponent.displayName === 'SettingsCustom'

    // Use 32x32 size for SettingsCustom, otherwise use prop or default
    const iconSize = isSettingsCustom ? 32 : (iconSizeProp ?? (isWebPlatform ? '$icon.20' : '$icon.24'))

    return (
      <Flex
        row
        alignItems="center"
        justifyContent="center"
        backgroundColor={backgroundColor}
        borderRadius="$rounded12"
        gap="$spacing4"
        px={IconLabel ? '$spacing8' : '$spacing4'}
        py="$spacing4"
        height={isWebApp ? '$spacing32' : 'auto'}
        flexShrink={0}
      >
        {IconLabel && (
          <Flex flexShrink={0} alignItems="center">
            {IconLabel}
          </Flex>
        )}
        <Flex
          width={32}
          height={32}
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          $platform-web={{
            cursor: 'pointer',
          }}
        >
          <IconComponent color={contentColor} hoverColor={contentColor} size={iconSize} />
        </Flex>
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
