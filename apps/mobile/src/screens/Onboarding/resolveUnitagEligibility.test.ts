import {
  resolveUnitagEligibility,
  UNITAG_ELIGIBILITY_TIMEOUT_MS,
} from 'src/screens/Onboarding/resolveUnitagEligibility'
import { ONE_SECOND_MS } from 'utilities/src/time/time'
import { sleep } from 'utilities/src/time/timing'

describe(resolveUnitagEligibility, () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for an eligible answer that arrives after the old five-second cutoff', async () => {
    const resolution = resolveUnitagEligibility(() => sleep(6 * ONE_SECOND_MS).then(() => true))

    await vi.advanceTimersByTimeAsync(6 * ONE_SECOND_MS)

    await expect(resolution).resolves.toEqual({ status: 'resolved', canClaim: true })
  })

  it('keeps a timeout distinct from an authoritative ineligible answer', async () => {
    const resolution = resolveUnitagEligibility(() => new Promise(() => {}))

    await vi.advanceTimersByTimeAsync(UNITAG_ELIGIBILITY_TIMEOUT_MS)

    await expect(resolution).resolves.toEqual({ status: 'timeout' })
  })

  it('keeps a request failure distinct from an authoritative ineligible answer', async () => {
    const error = new Error('eligibility failed')

    await expect(resolveUnitagEligibility(() => Promise.reject(error))).resolves.toEqual({ status: 'error', error })
  })

  it('returns false only for an authoritative ineligible answer', async () => {
    await expect(resolveUnitagEligibility(() => Promise.resolve(false))).resolves.toEqual({
      status: 'resolved',
      canClaim: false,
    })
  })
})
