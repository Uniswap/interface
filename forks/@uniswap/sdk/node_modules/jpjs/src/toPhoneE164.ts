/**
 * Convert a phone number into E.164 format.
 */
export function toPhoneE164(phone: string): string {
  phone = phone.replace(/[^0-9]/g, '');
  if (phone.length === 10) {
    phone = '1' + phone;
  }
  return '+' + phone;
}
