import Animated from 'react-native-reanimated'
import { Path, Vector } from 'react-native-redash'
import { DailyTokenPricesQuery } from 'src/features/historicalChainData/generated'

export type AnimatedIndex = Animated.SharedValue<number>
export type AnimatedTranslation = Vector<Animated.SharedValue<number>>

export type GraphData = {
  minPrice: number
  maxPrice: number
  startingPrice: number
  path: Path
}

type GraphMetadata = Readonly<{
  label: string
  index: number
  data: GraphData
}>

// use tuple for type-safety (assumes there is always five graphs)
export type GraphMetadatas = readonly [
  GraphMetadata,
  GraphMetadata,
  GraphMetadata,
  GraphMetadata,
  GraphMetadata
]

type Price = Pick<DailyTokenPricesQuery['tokenDayDatas'][0], 'timestamp' | 'close'>
export type PriceList = Price[]
