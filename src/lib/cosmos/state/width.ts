import { atom } from 'jotai'
import { useUpdateAtom } from 'jotai/utils'
import { useEffect } from 'react'
import { useValue } from 'react-cosmos/fixture'

export const cosmosWidthAtom = atom<number | undefined>(undefined)

export function useCosmosWidth() {
  const ctrl = useValue('width', { defaultValue: 272 })
  const [width] = ctrl
  const setCosmosWidth = useUpdateAtom(cosmosWidthAtom)
  useEffect(() => {
    setCosmosWidth(width)
  }, [setCosmosWidth, width])
  return ctrl
}
