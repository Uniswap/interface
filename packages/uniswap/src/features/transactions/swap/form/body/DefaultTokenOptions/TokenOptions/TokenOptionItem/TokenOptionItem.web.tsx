import { Text, Tooltip } from 'ui/src'
import { TokenIcon } from 'uniswap/src/features/transactions/swap/form/body/DefaultTokenOptions/TokenIcon'
import type { TokenOptionItemProps } from 'uniswap/src/features/transactions/swap/form/body/DefaultTokenOptions/TokenOptions/TokenOptionItem/types'

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
      <Tooltip.Content>
        <Text variant="body4">{symbol}</Text>
        <Tooltip.Arrow />
      </Tooltip.Content>
    </Tooltip>
  )
}
