import { LIST_MERGE_PRIORITY } from './../constants/lists'

export default function sortByListPriority(urlA: string, urlB: string) {
  const first = urlA in LIST_MERGE_PRIORITY ? LIST_MERGE_PRIORITY[urlA] : Number.MAX_SAFE_INTEGER
  const second = urlB in LIST_MERGE_PRIORITY ? LIST_MERGE_PRIORITY[urlB] : Number.MAX_SAFE_INTEGER

  // need reverse order to make sure mapping includes top priority last
  if (first < second) return 1
  else if (first > second) return -1
  return 0
}
