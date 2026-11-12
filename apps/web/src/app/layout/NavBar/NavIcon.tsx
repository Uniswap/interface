import { isMobileWeb } from '@universe/environment'
import { Flex, type FlexCompatProps, Text, TouchableArea, zIndexes } from '@universe/mycelium'
import { forwardRef, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

type ContainerProps = FlexCompatProps & { active?: boolean }

const Container = forwardRef<HTMLDivElement, ContainerProps>(function Container({ active, hoverStyle, ...rest }, ref) {
  return (
    <Flex
      ref={ref}
      position="relative"
      centered
      backgroundColor="$transparent"
      borderWidth="$none"
      borderRadius="$roundedFull"
      zIndex={zIndexes.default}
      hoverStyle={{ backgroundColor: '$surface1Hovered', ...hoverStyle }}
      {...(active ? { backgroundColor: '$surface1Hovered' } : {})}
      {...rest}
    />
  )
})

interface NavIconProps {
  children: ReactNode
  size?: number
  isActive?: boolean
  label?: string
  onClick?: () => void
}

export const NavIcon = ({ children, isActive = false, size = isMobileWeb ? 48 : 40, label, onClick }: NavIconProps) => {
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
