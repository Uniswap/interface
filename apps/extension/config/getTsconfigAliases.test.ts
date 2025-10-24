/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import path from 'path'
import { getTsconfigAliases } from './getTsconfigAliases'

describe('getTsconfigAliases', () => {
  it('should throw error when tsconfig file does not exist', () => {
    const nonExistentPath = '/path/that/does/not/exist/tsconfig.json'

    expect(() => getTsconfigAliases(nonExistentPath)).toThrow(`tsconfig file not found at: ${nonExistentPath}`)
  })

  it('should successfully parse the real tsconfig.base.json', () => {
    const result = getTsconfigAliases()

    // Verify we got aliases for some known packages
    expect(result).toHaveProperty('uniswap')
    expect(result).toHaveProperty('@universe/api')

    // Verify paths are absolute and point to the packages directory
    expect(result.uniswap).toContain('packages/uniswap')
    expect(result['@universe/api']).toContain('packages/api')
    expect(path.isAbsolute(result.uniswap!)).toBe(true)
    expect(path.isAbsolute(result['@universe/api']!)).toBe(true)
  })
})
