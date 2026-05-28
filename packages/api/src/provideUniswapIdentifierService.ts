import { getStorageDriver } from '@universe/api/src/storage/getStorageDriver'
import { createUniswapIdentifierService, UniswapIdentifierService } from '@universe/sessions'

const UNISWAP_IDENTIFIER_KEY = 'UNISWAP_IDENTIFIER'

function provideUniswapIdentifierService(): UniswapIdentifierService {
  const driver = getStorageDriver()

  const service = createUniswapIdentifierService({
    getUniswapIdentifier: async () => {
      const identifier = await driver.get(UNISWAP_IDENTIFIER_KEY)
      return identifier || null
    },
    setUniswapIdentifier: async (identifier: string) => {
      await driver.set(UNISWAP_IDENTIFIER_KEY, identifier)
    },
    removeUniswapIdentifier: async () => {
      await driver.remove(UNISWAP_IDENTIFIER_KEY)
    },
  })

  return service
}

export { provideUniswapIdentifierService }
