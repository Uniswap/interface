import { isWebAppDesktop } from '@universe/environment'
import { useRef } from 'react'
import { Flex } from 'ui/src'
import { spacing } from 'ui/src/theme'
import { getDefaultTokenOptionsCount } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/constants'
import { DefaultTokenOptions } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/DefaultTokenOptions'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useContainerWidth } from 'utilities/src/react/useContainerWidth'

export function QuickSelectDefaultTokenOptions(): JSX.Element | null {
  const containerRef = useRef<HTMLElement>(null)
  const headerWidth = useContainerWidth(containerRef)

  if (!isWebAppDesktop) {
    return null
  }

  const maxTokens = getDefaultTokenOptionsCount(headerWidth)

  return (
    <Flex
      ref={containerRef}
      row
      justifyContent="flex-end"
      pointerEvents="box-none"
      position="absolute"
      left={0}
      right={0}
      top={-spacing.spacing6}
    >
      <DefaultTokenOptions alignEnd currencyField={CurrencyField.OUTPUT} maxTokens={maxTokens} />
    </Flex>
  )
}
