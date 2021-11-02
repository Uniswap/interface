import Animated from 'react-native-reanimated'
import { Vector } from 'react-native-redash'
import { buildGraph } from 'src/components/PriceChart/Model'
import { PricesQuery } from 'src/features/historicalChainData/generated'
export type AnimatedIndex = Animated.SharedValue<number>

export type AnimatedTranslation = Vector<Animated.SharedValue<number>>

type GraphMetadata = Readonly<{
  label: string
  index: number
  data: ReturnType<typeof buildGraph>
}>

// use tuple for type-safety (assumes there is always five graphs)
export type GraphMetadatas = readonly [
  GraphMetadata,
  GraphMetadata,
  GraphMetadata,
  GraphMetadata,
  GraphMetadata
]

type Price = Pick<PricesQuery['tokenDayDatas'][0], 'timestamp' | 'close' | 'open'>
export type PriceList = Price[]
