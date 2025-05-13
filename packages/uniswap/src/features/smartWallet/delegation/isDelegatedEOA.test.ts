import { isDelegatedEOA } from 'uniswap/src/features/smartWallet/delegation/isDelegatedEOA'

describe('isDelegatedEOA', () => {
  describe('when bytecode is empty', () => {
    it('should identify as non-delegated EOA', () => {
      const result = isDelegatedEOA({ bytecode: '0x' })
      expect(result).toEqual({ isDelegated: false, delegateTo: null })
    })
  })

  describe('when bytecode contains delegation pattern', () => {
    it('should identify as delegated EOA and extract correct address', () => {
      const delegateAddress = '63c0c19a282a1b52b07dd5a65b58948a07dae32b'
      const bytecode = `0xef0100${delegateAddress}`

      const result = isDelegatedEOA({ bytecode })

      expect(result).toEqual({
        isDelegated: true,
        delegateTo: `0x${delegateAddress}`,
      })
    })

    it('should handle uppercase bytecode', () => {
      const delegateAddress = '63C0C19A282A1B52B07DD5A65B58948A07DAE32B'
      const bytecode = `0xEF0100${delegateAddress}`

      const result = isDelegatedEOA({ bytecode })

      expect(result).toEqual({
        isDelegated: true,
        delegateTo: `0x${delegateAddress.toLowerCase()}`,
      })
    })
  })

  describe('when bytecode does not contain proper delegation pattern', () => {
    it('should identify as non-delegated if prefix matches but length is incorrect', () => {
      // Too short
      const bytecodeShort = '0xef010063c0c19a282a1b52b07dd5a65b58948a07dae3'
      const resultShort = isDelegatedEOA({ bytecode: bytecodeShort })
      expect(resultShort).toEqual({ isDelegated: false, delegateTo: null })

      // Too long
      const bytecodeLong = '0xef010063c0c19a282a1b52b07dd5a65b58948a07dae32b00'
      const resultLong = isDelegatedEOA({ bytecode: bytecodeLong })
      expect(resultLong).toEqual({ isDelegated: false, delegateTo: null })
    })

    it('should identify as non-delegated if prefix does not match', () => {
      const bytecodeWrongPrefix = '0xef020063c0c19a282a1b52b07dd5a65b58948a07dae32b'
      const result = isDelegatedEOA({ bytecode: bytecodeWrongPrefix })
      expect(result).toEqual({ isDelegated: false, delegateTo: null })
    })

    it('should identify as non-delegated for arbitrary bytecode', () => {
      const arbitraryBytecode =
        '0x608060405234801561001057600080fd5b50600436106100365760003560e01c806306fdde031461003b578063095ea7b31461005957'
      const result = isDelegatedEOA({ bytecode: arbitraryBytecode })
      expect(result).toEqual({ isDelegated: false, delegateTo: null })
    })
  })
})
