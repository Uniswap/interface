import { SectionListData } from 'react-native'
import { SearchableRecipient } from 'src/components/RecipientSelect/types'
import { unique } from 'src/utils/array'

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

export function filterSections(
  sections: SectionListData<SearchableRecipient>[],
  filteredAddresses: string[]
): { title: string; data: SearchableRecipient[] }[] {
  return sections
    .map((section) => {
      const { title, data } = section
      return { title, data: data.filter((item) => filteredAddresses.includes(item.address)) }
    })
    .filter((section) => section.data.length > 0)
}
