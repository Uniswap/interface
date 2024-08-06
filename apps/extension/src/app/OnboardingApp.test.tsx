import { render } from '@testing-library/react'
import OnboardingApp from 'src/app/OnboardingApp'
import { initializeReduxStore } from 'src/store/store'

describe('OnboardingApp', () => {
  it('renders without error', async () => {
    await initializeReduxStore()
    render(<OnboardingApp />)
  })
})
