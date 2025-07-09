import { Link } from 'react-router'
import { ColorTokens, Flex, GeneratedIcon, Text, TouchableArea, useSporeColors } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons'
import { iconSizes } from 'ui/src/theme'

export function SettingsItem({
  Icon,
  title,
  onPress,
  iconProps,
  themeProps,
  url,
  count,
  hideChevron = false,
  RightIcon,
}: {
  Icon: GeneratedIcon
  title: string
  hideChevron?: boolean
  RightIcon?: GeneratedIcon
  onPress?: () => void
  iconProps?: { strokeWidth?: number }
  // TODO: do this with a wrapping Theme, "detrimental" wasn't working
  themeProps?: { color?: string; hoverColor?: string }
  url?: string
  count?: number
}): JSX.Element {
  const colors = useSporeColors()
  const hoverColor = themeProps?.hoverColor ?? colors.surface2.val

  const content = (
    <TouchableArea
      alignItems="center"
      borderRadius="$rounded12"
      flexDirection="row"
      flexGrow={1}
      gap="$spacing12"
      hoverStyle={{
        backgroundColor: hoverColor as ColorTokens,
      }}
      justifyContent="space-between"
      px="$spacing12"
      py="$spacing8"
      onPress={onPress}
    >
      <Flex row justifyContent="space-between" flexGrow={1}>
        <Flex row gap="$spacing12">
          <Icon
            color={themeProps?.color ?? '$neutral2'}
            size="$icon.24"
            strokeWidth={iconProps?.strokeWidth ?? undefined}
          />
          <Text style={{ color: themeProps?.color ?? colors.neutral1.val }} variant="subheading2">
            {title}
          </Text>
        </Flex>
        {count !== undefined && (
          <Text alignSelf="center" color="$neutral2" variant="subheading2">
            {count}
          </Text>
        )}
      </Flex>

      {RightIcon ? (
        <RightIcon color="$neutral3" size="$icon.24" strokeWidth={iconProps?.strokeWidth ?? undefined} />
      ) : (
        !hideChevron && (
          <RotatableChevron color="$neutral3" direction="end" height={iconSizes.icon20} width={iconSizes.icon20} />
        )
      )}
    </TouchableArea>
  )

  if (url) {
    return (
      <Link style={{ textDecoration: 'none' }} target="_blank" to={url}>
        {content}
      </Link>
    )
  }

  return content
}
