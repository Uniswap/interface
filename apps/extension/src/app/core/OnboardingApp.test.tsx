import { render } from '@testing-library/react'
import OnboardingApp from 'src/app/core/OnboardingApp'
import { initializeReduxStore } from 'src/store/store'

describe('OnboardingApp', () => {
  // eslint-disable-next-line jest/expect-expect
  it('renders without error', async () => {
    await initializeReduxStore()
    render(<OnboardingApp />)
  })
})
