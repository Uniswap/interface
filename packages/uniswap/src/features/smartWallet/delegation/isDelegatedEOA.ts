import { ensure0xHex, HexString } from 'utilities/src/addresses/hex'

const DELEGATE_PREFIX = 'ef0100'
const DELEGATE_LENGTH = 46 // 23 bytes

interface IsDelegatedEOAInput {
  bytecode: HexString
}

interface IsDelegatedEOAOutput {
  isDelegated: boolean
  delegateTo: HexString | null
}

// 0x[ef0100][63c0c19a282a1b52b07dd5a65b58948a07dae32b]
// 0x[delegation indicator][delegate address]
export function isDelegatedEOA(input: IsDelegatedEOAInput): IsDelegatedEOAOutput {
  const { bytecode } = input

  // if no code, it's a regular EOA
  if (bytecode === '0x') {
    return { isDelegated: false, delegateTo: null }
  }

  // remove '0x' prefix for checking
  const bytecodeWithoutPrefix = bytecode.startsWith('0x') ? bytecode.slice(2).toLowerCase() : bytecode.toLowerCase()

  // check if code starts with ef0100 and is 23 bytes long
  if (bytecodeWithoutPrefix.startsWith(DELEGATE_PREFIX) && bytecodeWithoutPrefix.length === DELEGATE_LENGTH) {
    // extract delegate address (20 bytes after the prefix)
    const delegateAddress = ensure0xHex(bytecodeWithoutPrefix.replace(DELEGATE_PREFIX, ''))
    return { isDelegated: true, delegateTo: delegateAddress }
  }

  // not a delegated EOA
  return { isDelegated: false, delegateTo: null }
}
