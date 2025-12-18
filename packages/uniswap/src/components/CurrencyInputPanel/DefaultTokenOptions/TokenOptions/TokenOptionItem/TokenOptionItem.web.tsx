import { Text, Tooltip } from 'ui/src'
import { zIndexes } from 'ui/src/theme'
import { TokenIcon } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/TokenIcon'
import type { TokenOptionItemProps } from 'uniswap/src/components/CurrencyInputPanel/DefaultTokenOptions/TokenOptions/TokenOptionItem/types'

const delay = { close: 0, open: 0 }

export const TokenOptionItem = ({
  currencyInfo,
  index,
  numOptions,
  currencyField,
}: TokenOptionItemProps): JSX.Element => {
  const {
    currency: { symbol },
  } = currencyInfo

  return (
    <Tooltip delay={delay} restMs={0} placement="top">
      <Tooltip.Trigger>
        <TokenIcon
          key={index}
          currencyInfo={currencyInfo}
          index={index}
          numOptions={numOptions}
          currencyField={currencyField}
        />
      </Tooltip.Trigger>
      <Tooltip.Content zIndex={zIndexes.overlay}>
        <Text variant="body4">{symbol}</Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
