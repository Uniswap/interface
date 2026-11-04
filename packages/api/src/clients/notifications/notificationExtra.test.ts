import { describe, expect, it } from 'vitest'
import { parseNotificationExtra, serializeNotificationExtra } from './notificationExtra'

describe('notification extra serialization', () => {
  it('round-trips the persist-until-interaction flag', () => {
    const serialized = serializeNotificationExtra({ persistUntilInteraction: true })

    expect(serialized).toBe('{"persistUntilInteraction":true}')
    expect(parseNotificationExtra(serialized)).toEqual({ persistUntilInteraction: true })
  })

  it.each([undefined, '', 'not-json', 'true', '[]', '{"persistUntilInteraction":"true"}'])(
    'ignores invalid notification extra: %s',
    (extra) => {
      expect(parseNotificationExtra(extra)).toBeUndefined()
    },
  )
})
