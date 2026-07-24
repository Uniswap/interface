// TODO: Move this to `packages/uniswap/src/components/CurrencyInputPanel/CurrencyInputPanel.tsx`

import { isHoverable, isWebAppDesktop } from '@universe/environment'
import { memo } from 'react'
import { Flex, ScrollView } from 'ui/src'
import { extraMarginForHoverAnimation } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/constants'
import { TokenOptions } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/TokenOptions/TokenOptions'
import { CurrencyField } from 'uniswap/src/types/currency'

export interface DefaultTokenOptionsProps {
  currencyField: CurrencyField
  maxTokens?: number
  alignEnd?: boolean
}

function DefaultTokenOptionsInner({ currencyField, maxTokens, alignEnd }: DefaultTokenOptionsProps): JSX.Element {
  return (
    <ScrollView horizontal justifyContent={alignEnd ? 'flex-end' : undefined} showsVerticalScrollIndicator={false}>
      <Flex
        row
        m={extraMarginForHoverAnimation}
        gap={isWebAppDesktop ? '$gap4' : '$gap8'}
        flex={1}
        {...(isHoverable
          ? {
              opacity: 0,
              transition: 'opacity 100ms ease-in-out, transform 100ms ease-in-out',
              '$group-hover': {
                opacity: 1,
                transition: 'opacity 100ms ease-in-out, transform 100ms ease-in-out',
              },
            }
          : {})}
      >
        <TokenOptions currencyField={currencyField} maxTokens={maxTokens} />
      </Flex>
    </ScrollView>
  )
}

export const DefaultTokenOptions = memo(DefaultTokenOptionsInner)
