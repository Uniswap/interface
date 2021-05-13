/**
 * Returns true if the string value is zero in hex
 * @param hexNumberString the hex number string
 */
export default function isZero(hexNumberString: string) {
  return /^0x0*$/.test(hexNumberString) || /^0*$/.test(hexNumberString)
}
