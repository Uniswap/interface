import React, { memo } from 'react'
import { SvgProps } from 'react-native-svg'
import { useAppTheme } from 'src/app/hooks'
import { Box } from 'src/components/layout'

function _TabBarButton({
  focused,
  color,
  IconFilled,
  Icon,
}: {
  focused: boolean
  color: string
  IconFilled: React.FC<SvgProps>
  Icon: React.FC<SvgProps>
}) {
  const theme = useAppTheme()

  return (
    <Box alignItems="center">
      {focused ? (
        <IconFilled color={theme.colors.userThemeColor} height={24} />
      ) : (
        <Icon color={color} height={24} />
      )}
      {/* bottom positioning is calculated based on the padding in the TabBar to minimize the icon shifting when selecting a tab. */}
      {focused && (
        <Box
          backgroundColor="userThemeColor"
          borderRadius="full"
          bottom={theme.spacing.sm - theme.spacing.md}
          height={4}
          width={4}
        />
      )}
    </Box>
  )
}

export const TabBarButton = memo(_TabBarButton)
