import { unique } from 'utilities/src/primitives/array'

interface HasAddress {
  address: string
}

export function uniqueAddressesOnly<T extends HasAddress>(objectsWithAddress: T[]): T[] {
  // the input array must be objects that have an obj.address field
  // had to cast to any because ts doesn't recognize it as HasAddress... maybe issue with unique
  return unique(
    objectsWithAddress,
    (v, i, a) => a.findIndex((v2) => v2.address === v.address) === i
  )
}
