import { SectionListData } from 'react-native'
import { SearchableRecipient } from 'wallet/src/features/address/types'

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
