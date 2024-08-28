import { NotImplementedError } from 'utilities/src/errors'

export async function openURL(_url: string): Promise<Window | null> {
  throw new NotImplementedError('See `.native.ts` and `.web.ts` files.')
}

export async function canOpenURL(_url: string): Promise<boolean> {
  throw new NotImplementedError('See `.native.ts` and `.web.ts` files.')
}
