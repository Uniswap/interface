import { DEFAULT_LIST_OF_LISTS } from './../constants/lists'

const DEFAULT_LIST_PRIORITIES = DEFAULT_LIST_OF_LISTS.reduce(
  (acc, listUrl, index) => ({
    ...acc,
    [listUrl]: index + 1,
  }),
  {}
) as Record<string, number>

// use ordering of default list of lists to assign priority
export default function sortByListPriority(urlA: string, urlB: string) {
  const A = DEFAULT_LIST_PRIORITIES[urlA]
  const B = DEFAULT_LIST_PRIORITIES[urlB]
  if (!A) return 0
  if (!B) return 0
  return A - B
}
