import { styled } from 'ui/src'
import { Flex } from 'ui/src/components/layout'

export const NavDropdownDefaultWrapper = styled(Flex, {
  width: '100%',
  alignItems: 'center',
  gap: '$spacing2',
  maxHeight: 'inherit',
  '$platform-web': { overflowY: 'auto' },

  $sm: {
    width: '100%',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderBottomWidth: 0,
  },
})

export const NavDropdownTabWrapper = styled(Flex, {
  minWidth: 180,
  p: '$spacing4',
  gap: '$gap4',
  position: 'relative',
})
