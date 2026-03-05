import { createSafeMigration, createSafeMigrationFactory } from 'uniswap/src/state/createSafeMigration'
import { vi } from 'vitest'

type TestState = {
  data?: {
    items: string[]
  }
}

describe('createSafeMigration', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('applies migration successfully', () => {
    const migration = createSafeMigration<TestState>({
      filename: 'testFile',
      name: 'testMigration',
      migrate: (state) => ({
        ...state,
        data: { items: [...(state.data?.items ?? []), 'new'] },
      }),
      onError: (state) => state,
    })

    const result = migration({
      data: { items: ['existing'] },
    })

    expect(result).toEqual({
      data: { items: ['existing', 'new'] },
    })
  })

  it('uses onError handler when migration throws', () => {
    const migration = createSafeMigration<TestState>({
      filename: 'testFile',
      name: 'testMigration',
      migrate: () => {
        throw new Error('Migration failed')
      },
      onError: (state) => ({ ...state, data: { items: [] } }),
    })

    const result = migration({
      data: { items: ['existing'] },
    })

    expect(result).toEqual({
      data: { items: [] },
    })
  })

  it('calls onError with the original state', () => {
    const errorHandler = vi.fn((state: TestState) => ({ ...state, data: { items: [] } }))

    const migration = createSafeMigration<TestState>({
      filename: 'testFile',
      name: 'testMigration',
      migrate: () => {
        throw new Error('Test error')
      },
      onError: errorHandler,
    })

    migration({
      data: { items: ['existing'] },
    })

    expect(errorHandler).toHaveBeenCalledWith(expect.objectContaining({ data: { items: ['existing'] } }))
  })
})

describe('createSafeMigrationFactory', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  it('creates migrations with pre-filled filename', () => {
    const createMigration = createSafeMigrationFactory('testFile')

    const migration = createMigration<TestState>({
      name: 'testMigration',
      migrate: (state) => ({
        ...state,
        data: { items: [...(state.data?.items ?? []), 'new'] },
      }),
      onError: (state) => state,
    })

    const result = migration({
      data: { items: ['existing'] },
    })

    expect(result).toEqual({
      data: { items: ['existing', 'new'] },
    })
  })

  it('handles errors with pre-filled filename', () => {
    const createMigration = createSafeMigrationFactory('testFile')

    const migration = createMigration<TestState>({
      name: 'testMigration',
      migrate: () => {
        throw new Error('Migration failed')
      },
      onError: (state) => ({ ...state, data: { items: [] } }),
    })

    const result = migration({
      data: { items: ['existing'] },
    })

    expect(result).toEqual({
      data: { items: [] },
    })
  })
})
