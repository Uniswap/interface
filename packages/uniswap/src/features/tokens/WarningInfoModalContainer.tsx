import { Flex, styled } from 'ui/src'
import { isMobileApp } from 'utilities/src/platform'

export const WarningModalInfoContainer = styled(Flex, {
  width: '100%',
  backgroundColor: '$surface2',
  borderRadius: '$rounded12',
  borderWidth: 1,
  borderColor: '$surface3',
  px: '$spacing16',
  py: isMobileApp ? '$spacing8' : '$spacing12',
  alignItems: 'center',
  flexWrap: 'nowrap',
})
