export const WRAPPED_PATH = '/wrapped'

export function buildWrappedUrl(baseURL: string, address: string): string {
  return `${baseURL}${WRAPPED_PATH}?address=${address}`
}
