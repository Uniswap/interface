import { TokenIcon } from 'uniswap/src/features/transactions/swap/form/body/DefaultTokenOptions/TokenIcon'
import type { TokenOptionItemProps } from 'uniswap/src/features/transactions/swap/form/body/DefaultTokenOptions/TokenOptions/TokenOptionItem/types'

export const TokenOptionItem = ({
  currencyInfo,
  index,
  numOptions,
  currencyField,
}: TokenOptionItemProps): JSX.Element => (
  <TokenIcon
    key={index}
    currencyInfo={currencyInfo}
    index={index}
    numOptions={numOptions}
    currencyField={currencyField}
  />
)
