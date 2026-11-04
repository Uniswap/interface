import { Flex, type FlexCompatProps, Text } from '@universe/mycelium'
import { ArrowDown } from '@universe/mycelium/icons/ArrowDown'
import { forwardRef, type ForwardRefExoticComponent, type RefAttributes } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowContainer, ArrowWrapper } from '~/features/Swap/styled'

// Explicit return type: forwardRef's inferred type isn't nameable under declaration emit (TS2883).
const ModuleBlob: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function ModuleBlob(props, ref) {
  return <Flex ref={ref} backgroundColor="$surface3" borderRadius="$rounded4" height={36} width="100%" {...props} />
})

const InputColumn: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function InputColumn(props, ref) {
  return (
    <Flex
      ref={ref}
      flexDirection="column"
      backgroundColor="$surface2"
      borderRadius="$rounded16"
      gap={30}
      paddingVertical={48}
      paddingHorizontal="$spacing12"
      {...props}
    />
  )
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
