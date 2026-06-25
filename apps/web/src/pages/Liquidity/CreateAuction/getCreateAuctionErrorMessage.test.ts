import { Code, ConnectError } from '@connectrpc/connect'
import { describe, expect, it } from 'vitest'
import { getCreateAuctionErrorMessage } from '~/pages/Liquidity/CreateAuction/getCreateAuctionErrorMessage'

describe('getCreateAuctionErrorMessage', () => {
  it('strips the InputValidationError prefix from an InvalidArgument ConnectError', () => {
    const error = new ConnectError('InputValidationError: Unsupported fee tier: 10001', Code.InvalidArgument)
    expect(getCreateAuctionErrorMessage(error)).toBe('Unsupported fee tier: 10001')
  })

  it('returns the raw message when there is no InputValidationError prefix', () => {
    const error = new ConnectError('Unsupported fee tier: 10001', Code.InvalidArgument)
    expect(getCreateAuctionErrorMessage(error)).toBe('Unsupported fee tier: 10001')
  })

  it('matches the prefix case-insensitively and trims surrounding whitespace', () => {
    const error = new ConnectError('inputvalidationerror:   Floor price too low  ', Code.InvalidArgument)
    expect(getCreateAuctionErrorMessage(error)).toBe('Floor price too low')
  })

  it('drops the trailing period but preserves periods inside the message', () => {
    const error = new ConnectError(
      'InputValidationError: Wallet token balance is insufficient. Reduce auction_supply or use token_info.new_token.',
      Code.InvalidArgument,
    )
    expect(getCreateAuctionErrorMessage(error)).toBe(
      'Wallet token balance is insufficient. Reduce auction_supply or use token_info.new_token',
    )
  })

  it('returns undefined for ConnectErrors with a non-InvalidArgument code', () => {
    const error = new ConnectError('InputValidationError: Unsupported fee tier: 10001', Code.Internal)
    expect(getCreateAuctionErrorMessage(error)).toBeUndefined()
  })

  it('returns undefined when an InvalidArgument error has only the bare prefix', () => {
    const error = new ConnectError('InputValidationError:', Code.InvalidArgument)
    expect(getCreateAuctionErrorMessage(error)).toBeUndefined()
  })

  it('returns undefined for plain Errors and other non-ConnectError values', () => {
    expect(getCreateAuctionErrorMessage(new Error('InputValidationError: Unsupported fee tier: 10001'))).toBeUndefined()
    expect(getCreateAuctionErrorMessage('InputValidationError: nope')).toBeUndefined()
    expect(getCreateAuctionErrorMessage(undefined)).toBeUndefined()
  })
})
