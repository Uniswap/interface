// @vitest-environment jsdom
import { render, screen } from '@testing-library/react'
import { DeadlineSettingValue } from '@universe/transactions-ui/src/common/DeadlineSettingValue/DeadlineSettingValue'
import { describe, expect, it } from 'vitest'

describe('DeadlineSettingValue', () => {
  it('renders the minutes with their unit', () => {
    render(<DeadlineSettingValue minutes={30} />)
    expect(screen.getByText('common.minutes.withCount')).toBeTruthy()
  })
})
