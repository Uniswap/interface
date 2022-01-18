import { SwapWidgetProps } from 'lib'
import { IntegrationError } from 'lib/errors'
import { useEffect } from 'react'

export default function ErrorGenerator(swapWidgetProps: SwapWidgetProps) {
  const { jsonRpcEndpoint, provider } = swapWidgetProps
  useEffect(() => {
    if (!provider && !jsonRpcEndpoint) {
      throw new IntegrationError('No provider or jsonRpcEndpoint provided')
    }
  }, [provider, jsonRpcEndpoint])
  return null
}
