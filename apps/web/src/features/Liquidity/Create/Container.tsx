import { Flex, styled } from 'ui/src'

export const Container = styled(Flex, {
  gap: 32,
  p: '$spacing24',
  borderRadius: '$rounded20',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  overflow: 'hidden',
  width: '100%',
  $lg: {
    p: '$spacing16',
  },
})
