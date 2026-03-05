import { isAndroid, isIOS } from 'utilities/src/platform'

const APPLE_PAY = 'Apple Pay'
const GOOGLE_PAY = 'Google Pay'

/**
 * Filters payment methods based on the current platform.
 * - Removes Apple Pay on Android devices
 * - Removes Google Pay on iOS devices
 */
export function transformPaymentMethods(paymentMethods: string[]): string[] {
  return paymentMethods.filter((pm) => !(pm === APPLE_PAY && isAndroid) && !(pm === GOOGLE_PAY && isIOS))
}
