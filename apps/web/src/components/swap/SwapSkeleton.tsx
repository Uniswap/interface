import { useTranslation } from 'react-i18next'
import { Flex, styled, Text } from 'ui/src'
import { ArrowDown } from 'ui/src/components/icons/ArrowDown'
import { ArrowContainer, ArrowWrapper } from '~/components/swap/styled'
import { deprecatedStyled } from '~/lib/deprecated-styled'

const StyledArrowWrapper = styled(ArrowWrapper, {
  position: 'absolute',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  margin: 0,
})

const LoadingWrapper = deprecatedStyled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: space-between;

  padding: 8px;
  border: ${({ theme }) => `1px solid ${theme.surface3}`};
  border-radius: 16px;
  background-color: ${({ theme }) => theme.surface1};
`

const Blob = deprecatedStyled.div<{ width?: number; radius?: number }>`
  background-color: ${({ theme }) => theme.surface2};
  border-radius: ${({ radius }) => (radius ?? 4) + 'px'};
  height: 56px;
  width: ${({ width }) => (width ? width + 'px' : '100%')};
`

const ModuleBlob = deprecatedStyled(Blob)`
  background-color: ${({ theme }) => theme.surface3};
  height: 36px;
`

const InputColumn = deprecatedStyled.div`
  display: flex;
  flex-flow: column;
  background-color: ${({ theme }) => theme.surface2};
  border-radius: 16px;
  display: flex;
  gap: 30px;
  padding: 48px 12px;
`

const OutputWrapper = deprecatedStyled.div`
  position: relative;
`

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
      <ModuleBlob width={100} radius={16} />
    </Flex>
  )
}

function FloatingButton() {
  return <Blob radius={16} />
}

export function SwapSkeleton() {
  return (
    <LoadingWrapper>
      <Title />
      <InputColumn>
        <FloatingInput />
      </InputColumn>
      <OutputWrapper>
        <StyledArrowWrapper clickable={false}>
          <ArrowContainer>
            <ArrowDown size="$icon.16" color="$neutral3" />
          </ArrowContainer>
        </StyledArrowWrapper>
        <InputColumn>
          <FloatingInput />
        </InputColumn>
      </OutputWrapper>
      <FloatingButton />
    </LoadingWrapper>
  )
}
