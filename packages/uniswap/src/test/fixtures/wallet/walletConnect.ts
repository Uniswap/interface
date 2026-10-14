import { faker } from 'uniswap/src/test/shared'
import { createFixture } from 'uniswap/src/test/utils'
import { DappRequestType, WalletConnectSessionRequestInfo } from 'uniswap/src/types/walletConnect'

export const dappInfoWC = createFixture<WalletConnectSessionRequestInfo>()(() => ({
  requestType: DappRequestType.WalletConnectSessionRequest,
  name: faker.lorem.words(),
  url: faker.internet.url(),
  icon: faker.image.imageUrl(),
}))
