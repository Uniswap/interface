const PASSCODE_LENGTH = 4

// Top common 4-digit PINs (sources: DataGenetics PIN analysis, various breach datasets)
export const BANNED_PINS: ReadonlySet<string> = new Set([
  '1234',
  '1111',
  '0000',
  '1212',
  '7777',
  '1004',
  '2000',
  '4444',
  '2222',
  '6969',
  '9999',
  '3333',
  '5555',
  '6666',
  '1122',
  '1313',
  '8888',
  '4321',
  '2001',
  '1010',
  '0852',
  '1221',
  '2580',
  '0123',
  '0911',
  '1123',
  '1233',
  '1357',
  '2468',
  '9876',
  '1245',
  '5678',
  '7890',
  '3456',
  '4567',
  '6789',
  '0987',
  '8765',
  '7654',
  '6543',
  '5432',
  '0001',
  '0002',
  '1000',
  '2345',
  '3210',
  '8520',
  '1590',
  '7410',
  '9630',
])

export function validatePin(pin: string): { valid: boolean; reason?: 'banned' | 'invalid_length' | 'non_numeric' } {
  if (pin.length !== PASSCODE_LENGTH) {
    return { valid: false, reason: 'invalid_length' }
  }
  if (!/^\d+$/.test(pin)) {
    return { valid: false, reason: 'non_numeric' }
  }
  if (BANNED_PINS.has(pin)) {
    return { valid: false, reason: 'banned' }
  }
  return { valid: true }
}
