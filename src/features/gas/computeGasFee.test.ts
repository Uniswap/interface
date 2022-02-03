import { BigNumber } from 'ethers'
import { ChainId } from 'src/constants/chains'
import { computeGasFee } from 'src/features/gas/computeGasFee'
import { gweiToWei } from 'src/utils/wei'

// Data taken from eth_feeHistory queries on Mainnet
// To generate, send calls like: await provider.send('eth_feeHistory'...
// As shown in feeSuggestion.ts
const mockGasUsedRatio = [
  0.6946501666666667, 0.32790536666666664, 0.040635833333333336, 0.9092351666666667,
  0.8387208557510258, 0.2143639405518092, 0.1554715682756038, 0.9287374757893665,
  0.9999040145977854, 0.8633623915674357, 0.0463212709786498, 0.7702610666666667,
  0.26719386666666667, 0.8449865, 0.8160287854423177, 0.47039883903891644, 0.0849551186533655,
  0.8162696991027732, 0.8523356, 0.4146550698869113, 0.3900427831201841, 0.9996665369940058,
  0.2347553938003349, 0.09647336666666667, 0.19219089048505847,
]
// prettier-ignore
const mockBaseFeePerGas = [ '0x19425ac25b', '0x1a7d06161a', '0x19594781d3', '0x16700b31b8',
  '0x18bbb5bc08', '0x1ad3e16806', '0x18e973b165', '0x16c426073e', '0x1934d5c0bd', '0x1c5b48d4f1',
  '0x1eeeb8e85f', '0x1b6c95550e', '0x1d46ee505f', '0x1b92b6e5b4', '0x1df38136a3', '0x20514af7df',
  '0x2014116d75', '0x1cbff94fa2', '0x1f05e87614', '0x21c1765866', '0x2109160690', '0x20209b4db1',
  '0x2423ff3518', '0x21be7c8075', '0x1e5705818f', '0x1c0154de25' ]
const mockBlockRewards = [
  ['0x8ce2de5a', '0xb2d05e00', '0x393bf205a', '0x393bf205a'],
  ['0x4effffc0', '0x59682f00', '0x59682f00', '0x5e67d96b'],
  ['0x59682f00', '0x59682f00', '0x59682f00', '0x77359400'],
  ['0x59682f00', '0x59682f00', '0x73a20d00', '0x77359400'],
  ['0x41c994bb', '0x41c994bb', '0x59682f00', '0x77359400'],
  ['0x3fc6e780', '0x3fc6e780', '0x59682f00', '0x73a20d00'],
  ['0x52bfddfc', '0x59682f00', '0x73a20d00', '0x77359400'],
  ['0x59682f00', '0x59682f00', '0x73a20d00', '0x77359400'],
  ['0x59682f00', '0x59682f00', '0x73a20d00', '0x937f190e'],
  ['0x26864838c', '0x2b943c052', '0x49590473e', '0x5e93ac501'],
]

const mockProvider: any = {
  estimateGas: jest.fn(() => BigNumber.from(100_000)),
  getGasPrice: jest.fn(() => gweiToWei(50)),
  send: jest
    .fn()
    .mockReturnValueOnce({ baseFeePerGas: mockBaseFeePerGas, gasUsedRatio: mockGasUsedRatio })
    .mockReturnValueOnce({ reward: mockBlockRewards }),
}

describe('computeGasFee', () => {
  it('Computes fee for 1559 chain', async () => {
    const fee = await computeGasFee(ChainId.Mainnet, {}, mockProvider)
    expect(fee).toEqual({
      type: 'eip1559',
      gasLimit: '100000',
      fee: {
        fast: '14255952332500000',
        normal: '14123468711400000',
        urgent: '14387289454400000',
      },
      feeDetails: {
        currentBaseFeePerGas: '120281423397',
        maxBaseFeePerGas: '139559523325',
        maxPriorityFeePerGas: {
          fast: '3000000000',
          normal: '1675163789',
          urgent: '4313371219',
        },
      },
    })
  })

  it('Computes fee for legacy chain', async () => {
    const fee = await computeGasFee(ChainId.Optimism, {}, mockProvider)
    expect(fee).toEqual({
      type: 'legacy',
      gasLimit: '100000',
      gasPrice: '50000000000',
      fee: {
        fast: '6250000000000000',
        normal: '5000000000000000',
        urgent: '7500000000000000',
      },
    })
  })
})
