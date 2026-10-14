import { Currency, Price } from '@uniswap/sdk-core'
import { Flex } from '@universe/mycelium'
import { SegmentedControl, type SegmentedControlOption } from '@universe/mycelium/segmented-control-compat'
import { DisplayCurrentPrice } from '~/features/Liquidity/DisplayCurrentPrice'

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
      gap="$gap12"
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
