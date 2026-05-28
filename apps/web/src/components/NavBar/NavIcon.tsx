import { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, styled, Text, TouchableArea } from 'ui/src'
import { zIndexes } from 'ui/src/theme'

const Container = styled(Flex, {
  position: 'relative',
  centered: true,
  backgroundColor: '$transparent',
  borderWidth: '$none',
  borderRadius: '$roundedFull',
  zIndex: zIndexes.default,
  hoverStyle: { backgroundColor: '$surface1Hovered' },
  variants: {
    active: {
      true: { backgroundColor: '$surface1Hovered' },
    },
  },
})

interface NavIconProps {
  children: ReactNode
  size?: number
  isActive?: boolean
  label?: string
  onClick?: () => void
}

export const NavIcon = ({ children, isActive = false, size = 40, label, onClick }: NavIconProps) => {
  const { t } = useTranslation()
  const labelWithDefault = label ?? t('common.navigationButton')

  return (
    <TouchableArea onPress={onClick} aria-label={labelWithDefault}>
      <Container width={size} height={size} active={isActive} style={{ transition: 'background-color 0.1s' }}>
        <Text color="$neutral2" textAlign="center" lineHeight={12}>
          {children}
        </Text>
      </Container>
    </TouchableArea>
  )
}
