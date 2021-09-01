import { DEFAULT_LIST_OF_LISTS } from './../constants/lists'

const DEFAULT_LIST_PRIORITIES = DEFAULT_LIST_OF_LISTS.reduce<{ [listUrl: string]: number }>((memo, listUrl, index) => {
  memo[listUrl] = index + 1
  return memo
}, {})

// use ordering of default list of lists to assign priority
export default function sortByListPriority(urlA: string, urlB: string) {
  if (DEFAULT_LIST_PRIORITIES[urlA] && DEFAULT_LIST_PRIORITIES[urlB]) {
    return DEFAULT_LIST_PRIORITIES[urlA] - DEFAULT_LIST_PRIORITIES[urlB]
  }
  return 0
}
