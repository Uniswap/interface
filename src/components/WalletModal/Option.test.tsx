import { useToggleAccountDrawer } from 'components/AccountDrawer'
import { mocked } from 'test-utils/mocked'

const mockToggleDrawer = jest.fn()
jest.mock('components/AccountDrawer')

beforeEach(() => {
  jest.spyOn(console, 'debug').mockReturnValue()
  mocked(useToggleAccountDrawer).mockReturnValue(mockToggleDrawer)
})
