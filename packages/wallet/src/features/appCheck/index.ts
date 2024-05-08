import { NotImplementedError } from 'utilities/src/errors'

export function initFirebaseAppCheck(): void {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}

export async function getFirebaseAppCheckToken(): Promise<string | null> {
  throw new NotImplementedError('See `.native.tsx` and `.web.tsx` files.')
}
