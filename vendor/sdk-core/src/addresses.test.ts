import { SWAP_ROUTER_02_ADDRESSES } from './addresses'
import { ChainId } from './chains'

describe('addresses', () => {
  describe('swap router 02 addresses', () => {
    it('should return the correct address for base', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.BASE)
      expect(address).toEqual('0x2626664c2603336E57B271c5C0b26F421741e481')
    })

    it('should return the correct address for base goerli', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.BASE_GOERLI)
      expect(address).toEqual('0x8357227D4eDc78991Db6FDB9bD6ADE250536dE1d')
    })

    it('should return the correct address for avalanche', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.AVALANCHE)
      expect(address).toEqual('0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE')
    })

    it('should return the correct address for BNB', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.BNB)
      expect(address).toEqual('0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2')
    })

    it('should return the correct address for arbitrum goerli', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.ARBITRUM_GOERLI)
      expect(address).toEqual('0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45')
    })

    it('should return the correct address for optimism sepolia', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.OPTIMISM_SEPOLIA)
      expect(address).toEqual('0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4')
    })

    it('should return the correct address for sepolia', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.SEPOLIA)
      expect(address).toEqual('0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E')
    })

    it('should return the correct address for bast', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.BLAST)
      expect(address).toEqual('0x549FEB8c9bd4c12Ad2AB27022dA12492aC452B66')
    })

    it('should return the correct address for xlayer', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.XLAYER)
      // HookSwap own deployment (contracts/deployments/xlayer.json)
      expect(address).toEqual('0x3D30133F4d4A80684F02d8310faF572E3dc193b3')
    })

    it('should return the correct address for linea', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.LINEA)
      expect(address).toEqual('0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a')
    })

    it('should return the correct address for tempo', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.TEMPO)
      // HookSwap own SwapRouter02 on Tempo (contracts/deployments/tempo.json) — deploy COMPLETE.
      expect(address).toEqual('0x3D30133F4d4A80684F02d8310faF572E3dc193b3')
    })

    it('should return the correct address for megaeth', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.MEGAETH)
      expect(address).toEqual('0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4')
    })

    it('should return the correct address for arc', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.ARC)
      expect(address).toEqual('0x53bf6b0684ec7ef91e1387da3d1a1769bc5a6f77')
    })

    it('should return the correct address for robinhood', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.ROBINHOOD)
      expect(address).toEqual('0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4')
    })

    it('should return the correct address for ink', () => {
      const address = SWAP_ROUTER_02_ADDRESSES(ChainId.INK)
      expect(address).toEqual('0xE8526A0429aeC9a5253ac854F8b6dC964E677EE4')
    })
  })
})
