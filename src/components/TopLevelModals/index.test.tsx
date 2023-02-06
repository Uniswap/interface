import { BLOCKED_ADDRESS } from 'mocks/handlers'
import { act } from 'react-dom/test-utils'
import { render, screen } from 'test-utils'

import TopLevelModals from '.'

let mockAccountValue = '0x48c89D77ae34Ae475e4523b25aB01e363dce5A78'

jest.mock('@web3-react/core', () => {
  const actual = jest.requireActual('@web3-react/core')
  return {
    ...actual,
    useWeb3React: () => ({ ...actual.useWeb3React(), account: mockAccountValue }),
  }
})

test('blocks risky addresses', async () => {
  render(<TopLevelModals />)
  act(() => {
    mockAccountValue = BLOCKED_ADDRESS
  })
  expect(screen.queryByText('Blocked Address')).toBeInTheDocument()
})

test('does not block normal addresses', async () => {
  render(<TopLevelModals />)

  act(() => {
    mockAccountValue = '0x48c89D77ae34Ae475e4523b25aB01e363dce5A78'
  })
  expect(screen.queryByText('Blocked Address')).toBe(null)
})
