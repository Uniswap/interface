import { Keyring } from 'app/src/features/wallet/Keyring/Keyring.web'

const mockStore = ({ data, failGet, failSet }: {
    data: Record<string, string>
    failGet?: boolean,
    failSet?: boolean
}) => ({
    get: () => failGet ? Promise.reject('failed get') : Promise.resolve(data),
    set: () => failSet ? Promise.reject('failed set') : Promise.resolve(),
}) as any

describe('Keyring', () => {
    it('returns all mnemonic ids', async () => {
        const data = { 'mnemonic1': 'my mnemonic ' }
        const keyring = new Keyring(mockStore({ data }))

        const allMnemonics = await keyring.getMnemonicIds()

        expect(allMnemonics).toEqual(data)
    })
})
