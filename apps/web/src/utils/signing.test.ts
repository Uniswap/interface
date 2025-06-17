import { ExternalProvider, JsonRpcProvider, JsonRpcSigner, Web3Provider } from '@ethersproject/providers'
import { Mutable } from 'types/mutable'
import { signTypedData } from 'utils/signing'

describe('signing', () => {
  describe('signTypedData', () => {
    const wallet = '0xcd2a3d9f938e13cd947ec05abc7fe734df8dd826'
    const domain = {
      name: 'Ether Mail',
      version: '1',
      chainId: '1',
      verifyingContract: '0xcccccccccccccccccccccccccccccccccccccccc',
    }

    const types = {
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    }

    const value = {
      from: {
        name: 'Cow',
        wallet,
      },
      to: {
        name: 'Bob',
        wallet: '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      },
      contents: 'Hello, Bob!',
    }

    let signer: JsonRpcSigner
    beforeEach(() => {
      signer = new JsonRpcProvider().getSigner()
      vi.spyOn(signer, 'getAddress').mockResolvedValue(wallet)
    })

    function itFallsBackToEthSignIfUnimplemented(signingMethod: string) {
      it.each(['not found', 'not implemented'])(`falls back to eth_sign if ${signingMethod} is %s`, async (message) => {
        const send = vi
          .spyOn(signer.provider, 'send')
          .mockImplementationOnce((method) => {
            if (method === signingMethod) {
              return Promise.reject({ message: `method ${message}` })
            }
            throw new Error('Unimplemented')
          })
          .mockImplementationOnce((method) => {
            if (method === 'eth_sign') {
              return Promise.resolve()
            }
            throw new Error('Unimplemented')
          })
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)

        await signTypedData({ signer, domain, types, value })
        expect(console.warn).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.stringContaining('signTypedData: wallet does not implement EIP-712, falling back to eth_sign'),
          expect.anything(),
        )
        expect(send).toHaveBeenCalledTimes(2)
        expect(send).toHaveBeenCalledWith(signingMethod, [wallet, expect.anything()])
        expect(send).toHaveBeenCalledWith('eth_sign', [wallet, expect.anything()])
        const hash = send.mock.lastCall?.[1]?.[1]
        expect(hash).toBe('0xbe609aee343fb3c4b28e1df9e632fca64fcfaede20f02e86244efddf30957bd2')
      })
    }

    function itFailsIfRejected(signingMethod: string) {
      it('fails if rejected', async () => {
        const send = vi.spyOn(signer.provider, 'send').mockImplementationOnce((method) => {
          if (method === signingMethod) {
            return Promise.reject(new Error('User rejected'))
          }
          throw new Error('Unimplemented')
        })

        await expect(async () => await signTypedData({ signer, domain, types, value })).rejects.toThrow('User rejected')
        expect(send).toHaveBeenCalledTimes(1)
        expect(send).toHaveBeenCalledWith(signingMethod, [wallet, expect.anything()])
        const data = send.mock.lastCall?.[1]?.[1]
        expect(JSON.parse(data)).toEqual(expect.objectContaining({ domain, message: value }))
      })
    }

    it('signs using eth_signTypedData_v4', async () => {
      const send = vi.spyOn(signer.provider, 'send').mockImplementationOnce((method) => {
        if (method === 'eth_signTypedData_v4') {
          return Promise.resolve()
        }
        throw new Error('Unimplemented')
      })

      await signTypedData({ signer, domain, types, value })
      expect(send).toHaveBeenCalledTimes(1)
      expect(send).toHaveBeenCalledWith('eth_signTypedData_v4', [wallet, expect.anything()])
      const data = send.mock.lastCall?.[1]?.[1]
      expect(JSON.parse(data)).toEqual(expect.objectContaining({ domain, message: value }))
    })

    itFallsBackToEthSignIfUnimplemented('eth_signTypedData_v4')
    itFailsIfRejected('eth_signTypedData_v4')

    describe('wallets which do not support eth_signTypedData_v4', () => {
      describe.each(['SafePal Wallet', 'Ledger Wallet Connect'])('%s', (name) => {
        beforeEach(() => {
          const web3Provider = signer.provider as Mutable<Web3Provider>
          web3Provider.provider = {
            isWalletConnect: true,
            session: { peer: { metadata: { name } } },
          } as ExternalProvider
        })

        it('signs using eth_signTypedData', async () => {
          const send = vi.spyOn(signer.provider, 'send').mockImplementationOnce((method) => {
            if (method === 'eth_signTypedData') {
              return Promise.resolve()
            }
            throw new Error('Unimplemented')
          })

          await signTypedData({ signer, domain, types, value })
          expect(send).toHaveBeenCalledTimes(1)
          expect(send).toHaveBeenCalledWith('eth_signTypedData', [wallet, expect.anything()])
          const data = send.mock.lastCall?.[1]?.[1]
          expect(JSON.parse(data)).toEqual(expect.objectContaining({ domain, message: value }))
        })

        itFallsBackToEthSignIfUnimplemented('eth_signTypedData')
        itFailsIfRejected('eth_signTypedData')
      })
    })

    describe('TrustWallet fallback for eth_signTypedData_v4', () => {
      beforeEach(() => {
        const web3Provider = signer.provider as Mutable<Web3Provider>
        web3Provider.provider = {
          isWalletConnect: true,
          session: { peer: { metadata: { name: 'Trust Wallet' } } },
        } as ExternalProvider
      })

      it('signs using eth_sign', async () => {
        vi.spyOn(console, 'warn').mockReturnValue()
        const send = vi.spyOn(signer.provider, 'send').mockImplementation((method) => {
          if (method === 'eth_sign') {
            return Promise.resolve()
          }
          throw new Error('TrustWalletConnect.WCError error 1')
        })

        await signTypedData({ signer, domain, types, value })
        expect(send).toHaveBeenCalledTimes(2)
        expect(send).toHaveBeenCalledWith('eth_sign', [wallet, expect.anything()])
      })
    })
  })
})
