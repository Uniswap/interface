import { FilterIcon } from 'nft/components/icons'
import { pluralize } from 'nft/utils'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, styled, useSporeColors } from 'ui/src'
import { breakpoints } from 'ui/src/theme'
import { NumberType, useFormatter } from 'utils/formatNumbers'

const FilterButtonContainer = styled(Flex, {
  ...ClickableTamaguiStyle,
  row: true,
  alignItems: 'center',
  backgroundColor: '$accent2',
  borderRadius: '$rounded12',
  gap: '$gap8',
  p: '$padding12',
  width: 'auto',
  height: 44,
  '$platform-web': {
    whiteSpace: 'nowrap',
  },
  variants: {
    expanded: {
      true: {
        backgroundColor: '$surface1',
        color: '$neutral1',
        borderWidth: 1,
        borderStyle: 'solid',
        borderColor: '$surface3',
      },
    },
  } as const,
})

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
  const hideResultsCount = window.innerWidth >= breakpoints.md && window.innerWidth < breakpoints.lg
  const colors = useSporeColors()

  return (
    <FilterButtonContainer
      onPress={onClick}
      width={isMobile ? 44 : 'auto'}
      expanded={isFiltersExpanded}
      data-testid="nft-filter"
    >
      <FilterIcon color={colors.accent1.val} />
      {!isMobile ? (
        <Text variant="buttonLabel2" color="$accent1">
          {!collectionCount || hideResultsCount
            ? 'Filter'
            : `Filter • ${formatNumberOrString({
                input: collectionCount,
                type: NumberType.WholeNumber,
              })} result${pluralize(collectionCount)}`}
        </Text>
      ) : null}
    </FilterButtonContainer>
  )
}
