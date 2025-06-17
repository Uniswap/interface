import { SectionListData } from 'react-native'
import { SearchableRecipient } from 'uniswap/src/features/address/types'

export function filterSections({
  sections,
  filteredAddresses,
  includeTitle = true,
}: {
  sections: SectionListData<SearchableRecipient>[]
  filteredAddresses: string[]
  includeTitle?: boolean
}): ({ title: string; data: SearchableRecipient[] } | { data: SearchableRecipient[] })[] {
  return sections
    .map((section) => {
      const { title, data } = section
      const filteredData = data.filter((item) => filteredAddresses.includes(item.address))
      return includeTitle ? { title, data: filteredData } : { data: filteredData }
    })
    .filter((section) => section.data.length > 0)
}
