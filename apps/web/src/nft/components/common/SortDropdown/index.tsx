import clsx from 'clsx'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { Box } from 'nft/components/Box'
import { Row } from 'nft/components/Flex'
import { ArrowsIcon, ChevronUpIcon, ReversedArrowsIcon } from 'nft/components/icons'
import { buttonTextMedium } from 'nft/css/common.css'
import { themeVars } from 'nft/css/sprinkles.css'
import { useCollectionFilters, useIsCollectionLoading } from 'nft/hooks'
import { DropDownOption } from 'nft/types'
import { useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react'

import * as styles from './SortDropdown.css'

export { FilterSortDropdown } from './FilterSortDropdown'

export const SortDropdown = ({
  dropDownOptions,
  inFilters,
  mini,
  miniPrompt,
  top,
  left,
}: {
  dropDownOptions: DropDownOption[]
  inFilters?: boolean
  mini?: boolean
  miniPrompt?: string
  top?: number
  left?: number
}) => {
  const sortBy = useCollectionFilters((state) => state.sortBy)
  const [isOpen, toggleOpen] = useReducer((s) => !s, false)
  const [isReversed, toggleReversed] = useReducer((s) => !s, false)
  const [selectedIndex, setSelectedIndex] = useState(sortBy)
  const isCollectionStatsLoading = useIsCollectionLoading((state) => state.isCollectionStatsLoading)

  const [maxWidth, setMaxWidth] = useState(0)

  useEffect(() => {
    setSelectedIndex(sortBy)
  }, [sortBy])

  const ref = useRef<HTMLDivElement>(null)
  useOnClickOutside(ref, () => isOpen && toggleOpen())

  useEffect(() => setMaxWidth(0), [dropDownOptions])

  const reversable = useMemo(
    () => dropDownOptions[selectedIndex].reverseOnClick || dropDownOptions[selectedIndex].reverseIndex,
    [selectedIndex, dropDownOptions]
  )

  const width = isCollectionStatsLoading ? 220 : inFilters ? 'full' : mini ? 'min' : maxWidth ? maxWidth : '300px'

  return (
    <Box
      ref={ref}
      borderRadius="12"
      borderBottomLeftRadius={isOpen ? '0' : undefined}
      borderBottomRightRadius={isOpen ? '0' : undefined}
      style={{ width }}
    >
      <Box
        as="button"
        borderRadius="12"
        borderStyle="solid"
        background={mini ? 'none' : 'surface1'}
        borderColor="surface3"
        borderWidth="1px"
        borderBottomLeftRadius={isOpen ? '0' : undefined}
        borderBottomRightRadius={isOpen ? '0' : undefined}
        padding={inFilters ? '12' : mini ? '0' : '8'}
        color="neutral1"
        whiteSpace="nowrap"
        display="flex"
        justifyContent="space-between"
        height="44"
        alignItems="center"
        width={inFilters ? 'full' : 'inherit'}
        onClick={toggleOpen}
        cursor="pointer"
        className={isCollectionStatsLoading ? styles.isLoadingDropdown : clsx(isOpen && !mini && styles.activeDropdown)}
      >
        {!isCollectionStatsLoading && (
          <>
            <Box display="flex" alignItems="center" color="neutral1">
              {!isOpen && reversable && (
                <Row
                  marginRight="4"
                  onClick={(e) => {
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
                    (isReversed ? <ArrowsIcon /> : <ReversedArrowsIcon />)}
                  {dropDownOptions[selectedIndex].reverseIndex &&
                    (selectedIndex > (dropDownOptions[selectedIndex].reverseIndex ?? 1) - 1 ? (
                      <ArrowsIcon />
                    ) : (
                      <ReversedArrowsIcon />
                    ))}
                </Row>
              )}

              <Box
                marginLeft={reversable ? '4' : '0'}
                marginRight={mini ? '2' : '0'}
                color="neutral1"
                className={buttonTextMedium}
              >
                {mini ? miniPrompt : isOpen ? 'Sort by' : dropDownOptions[selectedIndex].displayText}
              </Box>
            </Box>
            <ChevronUpIcon
              secondaryColor={mini ? themeVars.colors.neutral1 : undefined}
              secondaryWidth={mini ? '20' : undefined}
              secondaryHeight={mini ? '20' : undefined}
              style={{
                transform: isOpen ? '' : 'rotate(180deg)',
              }}
            />
          </>
        )}
      </Box>
      <Box
        position="absolute"
        zIndex="3"
        width={inFilters ? 'auto' : 'inherit'}
        right={inFilters ? '16' : 'auto'}
        paddingBottom="8"
        fontSize="14"
        background="surface1"
        borderStyle="solid"
        borderColor="surface3"
        borderWidth="1px"
        borderRadius="8"
        borderTopLeftRadius={mini ? undefined : '0'}
        borderTopRightRadius={mini ? undefined : '0'}
        overflowY="hidden"
        transition="250"
        display={isOpen || !maxWidth ? 'block' : 'none'}
        visibility={maxWidth ? 'visible' : 'hidden'}
        marginTop={mini ? '12' : '0'}
        className={clsx(!mini && styles.activeDropDownItems)}
        style={{
          top: top ? `${top}px` : 'inherit',
          left: inFilters ? '16px' : left ? `${left}px` : 'inherit',
        }}
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
                  mini={mini}
                  onClick={() => {
                    dropDownOptions[index].onClick()
                    setSelectedIndex(index)
                    toggleOpen()
                    isReversed && toggleReversed()
                  }}
                />
              )
            })}
      </Box>
    </Box>
  )
}

const DropDownItem = ({
  option,
  index,
  onClick,
  mini,
}: {
  option: DropDownOption
  index: number
  onClick?: () => void
  mini?: boolean
}) => {
  return (
    <Box
      as="button"
      border="none"
      key={index}
      display="flex"
      alignItems="center"
      paddingTop="10"
      paddingBottom="10"
      paddingLeft="12"
      paddingRight={mini ? '20' : '0'}
      width="full"
      background={{
        default: 'surface1',
        hover: 'surface3',
      }}
      color="neutral1"
      onClick={onClick}
      cursor="pointer"
    >
      <Box marginLeft="8" className={buttonTextMedium}>
        {option.displayText}
      </Box>
    </Box>
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
    <Box key={index} position="absolute" ref={maxWidthRef}>
      <DropDownItem option={option} index={index} />
    </Box>
  )
}
