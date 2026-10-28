import fs from 'fs'
import os from 'os'
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
    expect(result).toHaveProperty('@universe/config')

    // Verify paths are absolute and point to the packages directory
    expect(result['uniswap']).toContain('packages/uniswap')
    expect(result['@universe/config']).toContain('packages/config')
    expect(path.isAbsolute(result['uniswap']!)).toBe(true)
    expect(path.isAbsolute(result['@universe/config']!)).toBe(true)
  })

  it('should not alias packages whose exports map is the resolution contract', () => {
    const result = getTsconfigAliases()

    // Aliasing an exports-map package to its source dir would bypass `exports`
    // and break subpaths that don't mirror the file layout (e.g.
    // @universe/mycelium/icons/<Name>). These packages declare `exports` today:
    expect(result).not.toHaveProperty('@universe/mycelium')
    expect(result).not.toHaveProperty('@universe/logger')
    expect(result).not.toHaveProperty('@universe/tailwind')
    expect(result).not.toHaveProperty('@universe/api')
  })

  it('should derive the skip set from each mapped package.json exports field', () => {
    const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tsconfig-aliases-'))
    try {
      fs.mkdirSync(path.join(fixtureDir, 'packages/with-exports'), { recursive: true })
      fs.mkdirSync(path.join(fixtureDir, 'packages/without-exports'), { recursive: true })
      fs.writeFileSync(
        path.join(fixtureDir, 'packages/with-exports/package.json'),
        JSON.stringify({ name: '@fixture/with-exports', exports: { '.': './src/index.ts' } }),
      )
      fs.writeFileSync(
        path.join(fixtureDir, 'packages/without-exports/package.json'),
        JSON.stringify({ name: '@fixture/without-exports', main: 'src/index.ts' }),
      )
      const tsconfigPath = path.join(fixtureDir, 'tsconfig.base.json')
      fs.writeFileSync(
        tsconfigPath,
        JSON.stringify({
          compilerOptions: {
            paths: {
              '@fixture/with-exports/*': ['./packages/with-exports/*'],
              '@fixture/without-exports/*': ['./packages/without-exports/*'],
            },
          },
        }),
      )

      const result = getTsconfigAliases(tsconfigPath)

      expect(result).not.toHaveProperty('@fixture/with-exports')
      expect(result['@fixture/without-exports']).toBe(path.join(fixtureDir, 'packages/without-exports'))
    } finally {
      fs.rmSync(fixtureDir, { recursive: true, force: true })
    }
  })
})
