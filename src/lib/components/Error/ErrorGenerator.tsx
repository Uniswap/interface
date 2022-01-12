import { useAtomValue } from 'jotai/utils'
import { missingProviderError } from 'lib/errors'
import { providerAtom } from 'lib/state/web3'
import { useEffect } from 'react'
import { EMPTY } from 'widgets-web3-react/empty'

export default function ErrorGenerator() {
  const [connector] = useAtomValue(providerAtom)
  useEffect(() => {
    if (connector === EMPTY) {
      throw missingProviderError
    }
  }, [connector])
  return null
}
