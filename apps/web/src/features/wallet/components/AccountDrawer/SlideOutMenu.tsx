import { Flex, type FlexCompatProps as FlexProps, Text, TouchableArea } from '@universe/mycelium'
import { ArrowLeft } from '@universe/mycelium/icons/ArrowLeft'

type SlideOutMenuProps = {
  children: React.ReactNode
  onClose: () => void
  title: React.ReactNode
  rightIcon?: React.ReactNode
} & FlexProps

export const SlideOutMenu = ({ children, onClose, title, rightIcon, ...flexProps }: SlideOutMenuProps) => {
  return (
    <>
      <Flex mt="$spacing4" py="$padding12" px="$padding12" {...flexProps}>
        <Flex grow justifyContent="space-between">
          <Flex grow>
            <Flex row mb="$spacing24" justifyContent="space-between" width="100%" alignItems="center">
              <TouchableArea width="15%" testID="wallet-back" onPress={onClose}>
                <ArrowLeft color="$neutral2" size="$icon.24" />
              </TouchableArea>
              <Text color="$neutral1" variant="subheading1">
                {title}
              </Text>
              <Flex width="15%" alignItems="flex-end" justifyContent="center">
                {rightIcon}
              </Flex>
            </Flex>
            {children}
          </Flex>
        </Flex>
      </Flex>
    </>
  )
}
