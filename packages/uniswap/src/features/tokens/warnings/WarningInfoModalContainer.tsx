import { isMobileApp } from '@universe/environment'
import { Flex, styled } from 'ui/src'

export const WarningModalInfoContainer = styled(Flex, {
  width: '100%',
  backgroundColor: '$surface2',
  px: '$spacing16',
  py: isMobileApp ? '$spacing8' : '$spacing12',
  alignItems: 'center',
  flexWrap: 'nowrap',
})
