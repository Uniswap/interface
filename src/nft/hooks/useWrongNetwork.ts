import create from 'zustand'
import { devtools } from 'zustand/middleware'

type State = { wrongNetwork: boolean; setWrongNetwork: (isWrongNetwork: boolean) => void }

export const useWrongNetwork = create<State>()(
  devtools(
    (set) => ({
      wrongNetwork: false,
      setWrongNetwork: (isWrongNetwork) => set(() => ({ wrongNetwork: isWrongNetwork })),
    }),
    { name: 'useWrongNetwork' }
  )
)
