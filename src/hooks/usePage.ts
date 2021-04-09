import { useMemo } from 'react'

/**
 * This hook returns the correct page (defined as a slice of a passed in array) given a dataset, the items per page
 * that are to be displayed, the wanted page number (NON zero indexed) and the number of
 * items which are always present in the first page (specific example: my pools card in aggregated view, since it is
 * always there in the first page)
 **/
export function usePage<T>(dataset: T[], itemsPerPage: number, page: number, pinnedItemsAmount: number): T[] {
  return useMemo(() => {
    const zeroIndexPage = page - 1
    const normalizedItemsPerPage = zeroIndexPage === 0 ? itemsPerPage - pinnedItemsAmount : itemsPerPage
    const pageOffset = zeroIndexPage * normalizedItemsPerPage
    return dataset.slice(pageOffset, pageOffset + normalizedItemsPerPage)
  }, [dataset, itemsPerPage, page, pinnedItemsAmount])
}
