import { GitVersionRow } from 'components/AccountDrawer/GitVersionRow'
import { ArrowLeft } from 'react-feather'
import { Flex, Text, useScrollbarStyles } from 'ui/src'

export const SlideOutMenu = ({
  children,
  onClose,
  title,
  rightIcon,
}: {
  onClose: () => void
  title: React.ReactNode
  children: React.ReactNode
  onClear?: () => void
  rightIcon?: React.ReactNode
}) => {
  const scrollbarStyles = useScrollbarStyles()

  const updatedScrollbarStyles = {
    ...scrollbarStyles,
    '::-webkit-scrollbar-track': {
      marginTop: '40px',
    },
  }

  return (
    <Flex
      $platform-web={{
        overflow: 'auto',
      }}
      style={updatedScrollbarStyles}
      mt="$spacing4"
      py="$padding12"
      px="$padding16"
      minHeight="85vh"
    >
      <Flex grow justifyContent="space-between">
        <Flex>
          <Flex row mb="$spacing20" justifyContent="space-between" width="100%" alignItems="center">
            <ArrowLeft data-testid="wallet-back" onClick={onClose} size={24} />
            <Text color="$neutral1"> {title}</Text>
            {rightIcon ? <>{rightIcon}</> : <Flex />}
          </Flex>
          {children}
        </Flex>
        <GitVersionRow />
      </Flex>
    </Flex>
  )
}
