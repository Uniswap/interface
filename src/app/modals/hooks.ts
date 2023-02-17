import { useCallback, useState } from 'react'

export function useModalOpenComplete(): { onOpenComplete: () => void; modalOpened: boolean } {
  const [modalOpened, setModalOpened] = useState(false)

  const onOpenComplete = useCallback((): void => {
    setModalOpened(true)
  }, [])

  return { onOpenComplete, modalOpened }
}
