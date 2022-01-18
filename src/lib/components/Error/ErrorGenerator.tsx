import { useAtomValue } from 'jotai/utils'
import { providerAtom } from 'lib/state/web3'
import { useEffect } from 'react'
import { EMPTY } from 'widgets-web3-react/empty'

export default function ErrorGenerator() {
  const [connector] = useAtomValue(providerAtom)
  useEffect(() => {
    if (connector === EMPTY) {
      console.log('empty connector')
      // throw new MissingProviderError()
    } else {
      console.log('not empty connector')
    }
  }, [connector])
  return null
}
