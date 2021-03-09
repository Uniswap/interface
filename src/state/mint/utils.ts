import { Tick } from './hooks'
/**
 * @todo
 * udpate to actually parse input and calculate next tick
 */
export function tryParseTick(value?: string): Tick | undefined {
  if (!value) {
    return undefined
  }

  try {
    return { rate: parseFloat(value) * 0.999 }
  } catch (error) {
    console.debug(`Failed to parse range amount: "${value}"`, error)
  }

  return undefined
}
