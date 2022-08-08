import create from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface State {
  isExpanded: boolean
  setExpanded: (expanded: boolean) => void
}

const useFiltersExpandedStore = create<State>()(
  persist(
    devtools(
      (set) => ({
        isExpanded: false,
        setExpanded: (expanded) =>
          set(() => ({
            isExpanded: expanded,
          })),
      }),
      { name: 'useFiltersExpanded' }
    ),
    { name: 'useFiltersExpanded' }
  )
)

export const useFiltersExpanded = (): [boolean, (expanded: boolean) => void] => {
  const isExpanded = useFiltersExpandedStore((s) => s.isExpanded)
  const setExpanded = useFiltersExpandedStore((s) => s.setExpanded)

  return [isExpanded, setExpanded]
}
