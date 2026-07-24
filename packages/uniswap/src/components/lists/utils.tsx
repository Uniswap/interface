import { useMemo } from 'react'
import { OnchainItemListOption } from 'uniswap/src/components/lists/items/types'
import { type OnchainItemSection, OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'

export function useOnchainItemListSection<T extends OnchainItemListOption>({
  sectionKey,
  options,
  rightElement,
  endElement,
  name,
  sectionHeader,
  sectionHeaderHeight,
  icon,
}: {
  sectionKey: OnchainItemSectionName
  options?: T[]
  rightElement?: JSX.Element
  endElement?: JSX.Element
  name?: string
  sectionHeader?: JSX.Element
  sectionHeaderHeight?: number
  icon?: JSX.Element
}): OnchainItemSection<T>[] | undefined {
  return useMemo(() => {
    if (!options) {
      return undefined
    }

    // If it is a 2D array, check if any of the inner arrays are not empty
    // Otherwise, check if the array is not empty
    const is2DArray = options.length > 0 && Array.isArray(options[0])
    const hasData = is2DArray ? options.some((item) => Array.isArray(item) && item.length > 0) : options.length > 0
    return hasData
      ? [
          {
            sectionKey,
            data: options,
            name,
            rightElement,
            endElement,
            sectionHeader,
            sectionHeaderHeight,
            icon,
          },
        ]
      : undefined
  }, [name, rightElement, endElement, sectionKey, options, sectionHeader, sectionHeaderHeight, icon])
}
