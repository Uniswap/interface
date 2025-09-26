import { Currency, Price } from '@uniswap/sdk-core'
import { DisplayCurrentPrice } from 'components/Liquidity/DisplayCurrentPrice'
import { Flex } from 'ui/src'
import { SegmentedControl, SegmentedControlOption } from 'ui/src/components/SegmentedControl/SegmentedControl'

export function D3LiquidityChartHeader({
  price,
  isLoading,
  creatingPoolOrPair,
  currencyControlOptions,
  baseCurrency,
  handleSelectToken,
}: {
  price?: Price<Currency, Currency>
  isLoading?: boolean
  creatingPoolOrPair?: boolean
  currencyControlOptions: SegmentedControlOption<string>[]
  baseCurrency: Currency
  handleSelectToken: (option: string) => void
}) {
  return (
    <Flex
      row
      justifyContent="space-between"
      alignItems="center"
      p="$padding16"
      $sm={{ row: false, alignItems: 'flex-start', gap: '$gap8' }}
    >
      <DisplayCurrentPrice price={price} isLoading={isLoading} />
      {!creatingPoolOrPair && (
        <SegmentedControl
          options={currencyControlOptions}
          selectedOption={baseCurrency.symbol ?? ''}
          onSelectOption={handleSelectToken}
          size="smallThumbnail"
        />
      )}
    </Flex>
  )
}
