import { parse } from 'qs'

export default function useParseTheme(search: string) {
  if (!search) return
  if (search.length < 2) return

  const parsed = parse(search, {
    parseArrays: false,
    ignoreQueryPrefix: true,
  })

  return parsed.theme
}
