import { Account } from 'wallet/src/features/wallet/accounts/types'
import { concatListOfAccountNames } from './utils'

it('formats no account', () => {
  expect(concatListOfAccountNames([], 'and')).toEqual('')
})

it('formats 1 account', () => {
  expect(concatListOfAccountNames([{ name: '1' }] as Account[], 'and')).toEqual('1')
})

it('formats 2 accounts', () => {
  expect(concatListOfAccountNames([{ name: '1' }, { name: '2' }] as Account[], 'and')).toEqual(
    '1 and 2'
  )
})

it('formats 3 accounts', () => {
  expect(
    concatListOfAccountNames([{ name: '1' }, { name: '2' }, { name: '3' }] as Account[], 'and')
  ).toEqual('1, 2 and 3')
})

it('formats more than 3 accounts', () => {
  expect(
    concatListOfAccountNames(
      [{ name: '1' }, { name: '2' }, { name: '3' }, { name: '4' }] as Account[],
      'and'
    )
  ).toEqual('1, 2, 3 and 4')
})
