import clsx from 'clsx'
import * as styles from 'nft/components/collection/FilterButton.css'
import { FilterIcon } from 'nft/components/icons'
import { breakpoints } from 'nft/css/sprinkles.css'
import { pluralize } from 'nft/utils'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, Text } from 'ui/src'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export const FilterButton = ({
  onClick,
  isMobile,
  isFiltersExpanded,
  collectionCount = 0,
}: {
  isMobile: boolean
  isFiltersExpanded: boolean
  onClick: () => void
  collectionCount?: number
}) => {
  const { formatNumberOrString } = useFormatter()
  const hideResultsCount = window.innerWidth >= breakpoints.sm && window.innerWidth < breakpoints.md

  return (
    <Flex
      row
      alignItems="center"
      className={clsx(styles.filterButton, !isFiltersExpanded && styles.filterButtonExpanded)}
      gap="$gap8"
      borderRadius="$rounded12"
      {...ClickableTamaguiStyle}
      onPress={onClick}
      p="$padding12"
      width={isMobile ? 44 : 'auto'}
      height={44}
      $platform-web={{ whiteSpace: 'nowrap' }}
      data-testid="nft-filter"
    >
      <FilterIcon />
      {!isMobile ? (
        <Text variant="buttonLabel2">
          {!collectionCount || hideResultsCount
            ? 'Filter'
            : `Filter • ${formatNumberOrString({
                input: collectionCount,
                type: NumberType.WholeNumber,
              })} result${pluralize(collectionCount)}`}
        </Text>
      ) : null}
    </Flex>
  )
}
