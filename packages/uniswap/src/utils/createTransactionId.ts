import { v4 as uuid } from 'uuid'

export function createTransactionId(): string {
  return uuid()
}
