import { migrations } from 'src/app/migrations'
import { persistConfig } from 'src/app/store'

describe('Redux persist config', () => {
  it('has a version that is in sync with migrations', () => {
    const migrationKeys = Object.keys(migrations)
      .map((version) => parseInt(version, 10))
      .sort((a, b) => a - b)

    const lastMigrationKey = migrationKeys.pop()
    expect(persistConfig.version).toEqual(lastMigrationKey)
  })
})
