import { Trans } from 'react-i18next'
import { Flex, Text } from 'ui/src'
import { TokenOptionSection } from 'uniswap/src/components/TokenSelector/types'
import { SectionHeader } from 'uniswap/src/components/lists/TokenSectionHeader'

export function NoResultsFound({ searchFilter }: { searchFilter: string }): JSX.Element {
  return (
    <Flex>
      <SectionHeader sectionKey={TokenOptionSection.SearchResults} />
      <Text color="$neutral3" mt="$spacing16" mx="$spacing16" textAlign="center" variant="subheading2">
        <Trans
          components={{ highlight: <Text color="$neutral1" variant="subheading2" /> }}
          i18nKey="tokens.selector.search.empty"
          values={{ searchText: searchFilter }}
        />
      </Text>
    </Flex>
  )
}
