import { useAtomValue } from 'jotai/utils'
import { providerAtom } from 'lib/state/web3'
import { useEffect } from 'react'
import { EMPTY } from 'widgets-web3-react/empty'

class IntegrationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'INTEGRATION ERROR'
  }
}

const missingProviderError = new IntegrationError('Missing provider')

export default function ErrorReporter() {
  const [connector] = useAtomValue(providerAtom)
  useEffect(() => {
    if (connector === EMPTY) {
      throw missingProviderError
    }
  }, [connector])
  return null
}
