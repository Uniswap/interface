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

export const PageLayout = styled(Flex, {
  width: '100%',
  maxWidth: 1200,
  mx: 'auto',
  $xxl: {
    px: '$spacing40',
  },
  $xl: {
    px: '$spacing24',
  },
  $sm: {
    px: '$spacing8',
  },
})
