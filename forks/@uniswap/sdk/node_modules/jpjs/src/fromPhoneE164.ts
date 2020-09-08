/**
 * Convert a phone number from E.164 format into (212)-555-9656 format
 */
export function fromPhoneE164(phone: string): string {
  if (phone.length === 12) {
    return (
      phone.substring(2, 5) +
      '-' +
      phone.substring(5, 8) +
      '-' +
      phone.substring(8, 12)
    );
  } else {
    return phone;
  }
}
