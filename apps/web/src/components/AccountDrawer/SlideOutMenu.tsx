import { Flex, FlexProps, Text, TouchableArea, useScrollbarStyles } from 'ui/src'
import { ArrowLeft } from 'ui/src/components/icons/ArrowLeft'

type SlideOutMenuProps = {
  children: React.ReactNode
  onClose: () => void
  title: React.ReactNode
  rightIcon?: React.ReactNode
  versionComponent?: React.ReactNode
} & FlexProps

export const SlideOutMenu = ({
  children,
  onClose,
  title,
  rightIcon,
  versionComponent,
  ...flexProps
}: SlideOutMenuProps) => {
  const scrollbarStyles = useScrollbarStyles()

  const updatedScrollbarStyles = {
    ...scrollbarStyles,
    '::-webkit-scrollbar-track': {
      marginTop: '40px',
    },
  }

  return (
    <>
      <Flex
        $platform-web={{
          overflow: 'auto',
        }}
        style={updatedScrollbarStyles}
        mt="$spacing4"
        py="$padding12"
        px="$padding16"
        {...flexProps}
      >
        <Flex grow justifyContent="space-between">
          <Flex grow>
            <Flex row mb="$spacing20" justifyContent="space-between" width="100%" alignItems="center">
              <TouchableArea width="15%" data-testid="wallet-back" onPress={onClose}>
                <ArrowLeft color="$neutral2" size="$icon.24" />
              </TouchableArea>
              <Text color="$neutral1">{title}</Text>
              <Flex width="15%">{rightIcon}</Flex>
            </Flex>
            {children}
          </Flex>
        </Flex>
        {versionComponent}
      </Flex>
    </>
  )
}
