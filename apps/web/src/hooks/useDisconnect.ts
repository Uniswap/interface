import { useCallback, useMemo } from 'react'
import { UseDisconnectReturnType, useDisconnect as useDisconnectWagmi } from 'wagmi'

export function useDisconnect(): UseDisconnectReturnType {
  const { connectors, disconnect, ...rest } = useDisconnectWagmi()
  const disconnectAll = useCallback(() => {
    connectors.forEach((connector) => {
      disconnect({ connector })
    })
  }, [connectors, disconnect])
  return useMemo(() => ({ ...rest, disconnect: disconnectAll, connectors }), [disconnectAll, connectors, rest])
}
