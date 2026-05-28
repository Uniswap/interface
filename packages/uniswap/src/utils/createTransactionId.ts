import { uuid } from 'utilities/src/primitives/uuid'

export function createTransactionId(): string {
  return uuid()
}
