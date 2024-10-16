import { render } from '@testing-library/react'
import UnitagClaimApp from 'src/app/UnitagClaimApp'
import { initializeReduxStore } from 'src/store/store'

describe('UnitagClaimApp', () => {
  it('renders without error', async () => {
    await initializeReduxStore()
    render(<UnitagClaimApp />)
  })
})
