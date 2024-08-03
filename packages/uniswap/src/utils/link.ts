import { NotImplementedError } from 'utilities/src/errors'

export function openURL(_url: string): Window | null {
  throw new NotImplementedError('See `.native.ts` and `.web.ts` files.')
}

export function canOpenURL(_url: string): boolean {
  throw new NotImplementedError('See `.native.ts` and `.web.ts` files.')
}
