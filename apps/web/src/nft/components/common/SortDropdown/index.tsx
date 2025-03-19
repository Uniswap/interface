import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { ArrowsIcon, ChevronUpIcon, ReversedArrowsIcon } from 'nft/components/icons'
import { useCollectionFilters, useIsCollectionLoading } from 'nft/hooks'
import { DropDownOption } from 'nft/types'
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Flex, Text, useSporeColors } from 'ui/src'

export { FilterSortDropdown } from './FilterSortDropdown'

export const SortDropdown = ({
  dropDownOptions,
  inFilters,
  top,
  left,
}: {
  dropDownOptions: DropDownOption[]
  inFilters?: boolean
  top?: number
  left?: number
}) => {
  const sortBy = useCollectionFilters((state) => state.sortBy)
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const [isReversed, toggleReversed] = useReducer((s) => !s, false)
  const [selectedIndex, setSelectedIndex] = useState(sortBy)
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  const colors = useSporeColors()

  const [maxWidth, setMaxWidth] = useState(0)

  useEffect(() => {
    setSelectedIndex(sortBy)
  }, [sortBy])

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => isOpen && toggleOpen())

  useEffect(() => setMaxWidth(0), [dropDownOptions])

  const reversable = useMemo(
    () => dropDownOptions[selectedIndex].reverseOnClick || dropDownOptions[selectedIndex].reverseIndex,
    [selectedIndex, dropDownOptions],
  )

  const width = isCollectionStatsLoading ? 220 : inFilters ? 'full' : maxWidth ? maxWidth : '300px'

  return (
    <Flex
      ref={ref}
      borderRadius="$rounded12"
      borderBottomLeftRadius={isOpen ? 0 : undefined}
      borderBottomRightRadius={isOpen ? 0 : undefined}
      width={width}
    >
      <Flex
        borderRadius="$rounded12"
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderWidth={1}
        borderBottomLeftRadius={isOpen ? 0 : undefined}
        borderBottomRightRadius={isOpen ? 0 : undefined}
        p={inFilters ? 12 : 8}
        $platform-web={{
          whiteSpace: 'nowrap',
        }}
        justifyContent="space-between"
        height={44}
        alignItems="center"
        width={isCollectionStatsLoading ? 220 : inFilters ? '100%' : 'auto'}
        onPress={toggleOpen}
        cursor="pointer"
        borderBottomWidth={isOpen ? '$none' : 1}
        borderTopWidth={1}
      >
        {!isCollectionStatsLoading && (
          <>
            <Flex row alignItems="center" height="100%">
              {!isOpen && reversable && (
                <Flex
                  row
                  mr={4}
                  alignItems="center"
                  height="100%"
                  onPress={(e) => {
                    e.stopPropagation()

                    if (dropDownOptions[selectedIndex].reverseOnClick) {
                      dropDownOptions[selectedIndex].reverseOnClick?.()
                      toggleReversed()
                    } else {
                      const dropdownIndex = dropDownOptions[selectedIndex].reverseIndex ?? 1
                      dropDownOptions[dropdownIndex - 1].onClick()
                      setSelectedIndex(dropdownIndex - 1)
                    }
                  }}
                >
                  {dropDownOptions[selectedIndex].reverseOnClick &&
                    (isReversed ? (
                      <ArrowsIcon color={colors.neutral1.val} />
                    ) : (
                      <ReversedArrowsIcon color={colors.neutral1.val} />
                    ))}
                  {dropDownOptions[selectedIndex].reverseIndex &&
                    (selectedIndex > (dropDownOptions[selectedIndex].reverseIndex ?? 1) - 1 ? (
                      <ArrowsIcon color={colors.neutral1.val} />
                    ) : (
                      <ReversedArrowsIcon />
                    ))}
                </Flex>
              )}

              <Text ml={reversable ? 4 : 0} color="$neutral1" variant="buttonLabel2">
                {isOpen ? 'Sort by' : dropDownOptions[selectedIndex].displayText}
              </Text>
            </Flex>
            <ChevronUpIcon
              style={{
                transform: isOpen ? '' : 'rotate(180deg)',
              }}
            />
          </>
        )}
      </Flex>
      <Flex
        position="absolute"
        zIndex="3"
        width={inFilters ? 'auto' : 'inherit'}
        right={inFilters ? 16 : 'auto'}
        pb={8}
        backgroundColor="$surface1"
        borderColor="$surface3"
        borderWidth={1}
        borderRadius={8}
        borderTopLeftRadius={0}
        borderTopRightRadius={0}
        overflow="hidden"
        transition="250"
        display={isOpen || !maxWidth ? 'block' : 'none'}
        $platform-web={{
          visibility: maxWidth ? 'visible' : 'hidden',
        }}
        top={top ? top : 44}
        left={inFilters ? '16px' : left ? left : 'inherit'}
      >
        {!maxWidth
          ? [
              dropDownOptions.reduce((acc, curr) => {
                return curr.displayText.length >= acc.displayText.length ? curr : acc
              }, dropDownOptions[0]),
            ].map((option, index) => {
              return <LargestItem key={index} option={option} index={index} setMaxWidth={setMaxWidth} />
            })
          : isOpen &&
            dropDownOptions.map((option, index) => {
              return (
                <DropDownItem
                  key={index}
                  option={option}
                  index={index}
                  onClick={() => {
                    dropDownOptions[index].onClick()
                    setSelectedIndex(index)
                    toggleOpen()
                    isReversed && toggleReversed()
                  }}
                />
              )
            })}
      </Flex>
    </Flex>
  )
}

const DropDownItem = ({ option, index, onClick }: { option: DropDownOption; index: number; onClick?: () => void }) => {
  return (
    <Flex
      borderWidth={0}
      key={index}
      alignItems="center"
      py={10}
      pl={12}
      width="full"
      backgroundColor="$surface1"
      hoverStyle={{ backgroundColor: '$surface3' }}
      onPress={onClick}
      cursor="pointer"
    >
      <Text ml={8} variant="buttonLabel2" color="$neutral1">
        {option.displayText}
      </Text>
    </Flex>
  )
}

const MAX_PADDING = 52

const LargestItem = ({
  option,
  index,
  setMaxWidth,
}: {
  option: DropDownOption
  index: number
  setMaxWidth: (width: number) => void
}) => {
  const maxWidthRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (maxWidthRef && maxWidthRef.current) {
      setMaxWidth(Math.ceil(maxWidthRef.current.getBoundingClientRect().width) + MAX_PADDING)
    }
  })

  return (
    <Flex key={index} position="absolute" ref={maxWidthRef}>
      <DropDownItem option={option} index={index} />
    </Flex>
  )
}
