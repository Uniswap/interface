import { DEFAULT_LIST_OF_LISTS } from './../constants/lists'

// use ordering of default list of lists to assign priority
export default function sortByListPriority(urlA: string, urlB: string) {
  const first = urlA in DEFAULT_LIST_OF_LISTS ? DEFAULT_LIST_OF_LISTS.indexOf(urlA) : Number.MAX_SAFE_INTEGER
  const second = urlB in DEFAULT_LIST_OF_LISTS ? DEFAULT_LIST_OF_LISTS.indexOf(urlB) : Number.MAX_SAFE_INTEGER

  // need reverse order to make sure mapping includes top priority last
  if (first < second) return 1
  else if (first > second) return -1
  return 0
}
