import httpRequest from './httpRequest'

const BASE_URL = 'https://studio.fuse.io/api/v1'

export default {
  fund(account: string) {
    return httpRequest(`${BASE_URL}/fund/${account}`, { networkName: 'fuse' })
  }
}
