const PASSWORD_LENGTH_MIN = 8

export function isValidPassword(password: string): boolean {
  return password.length >= PASSWORD_LENGTH_MIN
}
