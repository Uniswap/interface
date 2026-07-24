import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'

/** Returns an RWA's tag category: the first non-UNSPECIFIED entry of `categories`, which the backend
 *  pre-sorts by display priority (COMMODITIES, ETFS, STOCKS). Returns UNSPECIFIED when nothing is classified,
 *  so no tag renders. A future backend category with no `CategoryTag` case renders no tag until that case is
 *  added, so ship the two together. */
export function getRwaTagCategory({ categories }: { categories?: RwaCategory[] }): RwaCategory {
  return categories?.find((category) => category !== RwaCategory.UNSPECIFIED) ?? RwaCategory.UNSPECIFIED
}
