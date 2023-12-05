// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/parseENSAddress.test.ts

import { parseENSAddress } from './parseENSAddress'

describe('parseENSAddress', () => {
  it('test cases', () => {
    expect(parseENSAddress('hello.eth')).toEqual({ ensName: 'hello.eth', ensPath: undefined })
    expect(parseENSAddress('hello.eth/')).toEqual({ ensName: 'hello.eth', ensPath: '/' })
    expect(parseENSAddress('hello.world.eth/')).toEqual({
      ensName: 'hello.world.eth',
      ensPath: '/',
    })
    expect(parseENSAddress('hello.world.eth/abcdef')).toEqual({
      ensName: 'hello.world.eth',
      ensPath: '/abcdef',
    })
    expect(parseENSAddress('abso.lutely')).toEqual(undefined)
    expect(parseENSAddress('abso.lutely.eth')).toEqual({
      ensName: 'abso.lutely.eth',
      ensPath: undefined,
    })
    expect(parseENSAddress('eth')).toEqual(undefined)
    expect(parseENSAddress('eth/hello-world')).toEqual(undefined)
    expect(parseENSAddress('hello-world.eth')).toEqual({
      ensName: 'hello-world.eth',
      ensPath: undefined,
    })
    expect(parseENSAddress('-prefix-dash.eth')).toEqual(undefined)
    expect(parseENSAddress('suffix-dash-.eth')).toEqual(undefined)
    expect(parseENSAddress('it.eth')).toEqual({ ensName: 'it.eth', ensPath: undefined })
    expect(parseENSAddress('only-single--dash.eth')).toEqual(undefined)
  })
})
