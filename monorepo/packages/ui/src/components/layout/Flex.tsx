import { Stack, styled } from 'tamagui'

export const Flex = styled(Stack, {
  name: 'Flex',

  flexDirection: 'column',
  flexWrap: 'wrap',

  // TODO: make variants work to get Flex to same dev experience as mobile Flex
})
