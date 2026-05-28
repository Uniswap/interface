import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { ArrowContainer, ArrowWrapper } from '~/features/Swap/styled'

const ModuleBlob = styled(Flex, {
  backgroundColor: '$surface3',
  borderRadius: '$rounded4',
  height: 36,
  width: '100%',
})

const InputColumn = styled(Flex, {
  flexDirection: 'column',
  backgroundColor: '$surface2',
  borderRadius: '$rounded16',
  gap: 30,
  paddingVertical: 48,
  paddingHorizontal: '$spacing12',
})

function Title() {
  const { t } = useTranslation()
  return (
    <Flex p="$spacing8">
      <Text variant="subheading1">{t('common.swap')}</Text>
    </Flex>
  )
}

function FloatingInput() {
  return (
    <Flex row justifyContent="space-between" alignItems="center">
      <ModuleBlob width={60} />
      <ModuleBlob width={100} borderRadius="$rounded16" />
    </Flex>
  )
}

function FloatingButton() {
  return <Flex backgroundColor="$surface2" height={56} width="100%" borderRadius="$rounded16" />
}

export function SwapSkeleton() {
  return (
    <Flex
      gap="$gap4"
      justifyContent="space-between"
      padding="$spacing8"
      borderWidth={1}
      borderStyle="solid"
      borderColor="$surface3"
      borderRadius="$rounded16"
      backgroundColor="$surface1"
    >
      <Title />
      <InputColumn>
        <FloatingInput />
      </InputColumn>
      <Flex position="relative">
        <ArrowWrapper clickable={false}>
          <ArrowContainer>
            <ArrowDown size="$icon.16" color="$neutral3" />
          </ArrowContainer>
        </ArrowWrapper>
        <InputColumn>
          <FloatingInput />
        </InputColumn>
      </Flex>
      <FloatingButton />
    </Flex>
  )
}
