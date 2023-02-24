import assert from 'assert'

import { log, logCallback, LOGGING_KEY, LoggingState, measureCallback, squelch } from './measure'

describe('measure', () => {
  beforeEach(() => {
    performance.mark = jest.fn().mockImplementation((name, options) => {
      return { name, options }
    })
    performance.measure = jest.fn().mockImplementation((name, options) => {
      return { name, ...options }
    })
  })

  describe('log', () => {
    it('does not log in non-logging zone', () => {
      const state: LoggingState = { isLogging: false, logs: [] }
      Zone.current.fork({ name: 'parent', properties: { [LOGGING_KEY]: state } }).run(() => log('test'))
      expect(state.logs).toEqual([])
    })

    it('logs in logging zone', () => {
      const state: LoggingState = { isLogging: true, logs: [] }
      Zone.current.fork({ name: 'parent', properties: { [LOGGING_KEY]: state } }).run(() => log('test'))
      expect(state.logs).toEqual([
        {
          name: 'test',
          parent: 'parent',
          time: expect.any(Number),
          data: {},
        },
      ])
    })

    it('logs data', () => {
      expect(log('test', { a: 'a', b: 'b' })).toEqual(expect.objectContaining({ data: { a: 'a', b: 'b' } }))
    })

    it('logs an error', () => {
      expect(log('test', undefined, 'error')).toEqual(expect.objectContaining({ error: 'error' }))
    })
  })

  describe('measureCallback', () => {
    it('resolves', async () => {
      await expect(measureCallback('resolves', () => Promise.resolve('test'))).resolves.toBe('test')
    })

    it('rejects', async () => {
      await expect(measureCallback('rejects', () => Promise.reject('error'))).rejects.toBe('error')
    })

    it('does not log in non-logging zone', async () => {
      const state: LoggingState = { isLogging: false, logs: [] }
      await Zone.current
        .fork({ name: 'parent', properties: { [LOGGING_KEY]: state } })
        .run(() => measureCallback('test', () => Promise.resolve()))
      expect(state.logs).toEqual([])
    })

    it('logs in logging zone', async () => {
      const state: LoggingState = { isLogging: true, logs: [] }
      await Zone.current
        .fork({ name: 'parent', properties: { [LOGGING_KEY]: state } })
        .run(() => measureCallback('test', () => Promise.resolve()))
      expect(state.logs).toEqual([
        {
          name: 'test',
          parent: 'parent',
          time: expect.any(Number),
          duration: expect.any(Number),
          data: {},
        },
      ])
    })

    it('logs data', async () => {
      const state: LoggingState = { isLogging: true, logs: [] }
      await Zone.current.fork({ name: 'parent', properties: { [LOGGING_KEY]: state } }).run(() =>
        measureCallback(
          'test',
          () => Promise.resolve(),
          { a: 'a', b: 'b' },
          (result, data) => ({ ...data, c: 'c' })
        )
      )
      expect(state.logs).toEqual([
        expect.objectContaining({
          data: { a: 'a', b: 'b', c: 'c' },
        }),
      ])
    })
  })

  describe('logCallback', () => {
    beforeEach(() => {
      jest.spyOn(console, 'groupCollapsed')
      jest.spyOn(console, 'groupEnd')
      jest.spyOn(console, 'table')
    })

    it('resolves', async () => {
      await expect(logCallback('resolves', () => Promise.resolve('test'), jest.fn())).resolves.toBe('test')
    })

    it('rejects', async () => {
      await expect(measureCallback('rejects', () => Promise.reject('error'))).rejects.toBe('error')
    })

    it('logs', async () => {
      const onLogs = jest.fn()
      await logCallback('test', () => Promise.resolve(), onLogs, undefined, undefined)
      expect(onLogs).toHaveBeenCalledWith([
        {
          name: 'test',
          parent: undefined,
          time: expect.any(Number),
          duration: expect.any(Number),
          data: {},
        },
      ])
    })

    it('logs data', async () => {
      const onLogs = jest.fn()
      await logCallback(
        'test',
        () => Promise.resolve(),
        onLogs,
        { a: 'a', b: 'b' },
        (result, data) => ({ ...data, c: 'c' })
      )
      expect(onLogs).toHaveBeenCalledWith([
        expect.objectContaining({
          data: { a: 'a', b: 'b', c: 'c' },
        }),
      ])
    })

    it('logs the parent zone', async () => {
      const onLogs = jest.fn()
      const state: LoggingState = { isLogging: true, logs: [] }
      await Zone.current
        .fork({ name: 'parent', properties: { [LOGGING_KEY]: state } })
        .run(() => logCallback('test', () => Promise.resolve(), onLogs))
      expect(onLogs).toHaveBeenCalledWith([expect.objectContaining({ parent: 'parent' })])
    })

    it('creates a logging zone', async () => {
      await logCallback(
        'test',
        async () => {
          expect(Zone.current.name).toBe('test')
          expect(Zone.current.get(LOGGING_KEY)).toEqual(expect.objectContaining({ isLogging: true }))
        },
        jest.fn()
      )
    })

    it('stops logging in zone after resolving', async () => {
      let child: Promise<void> | undefined
      await logCallback(
        'test',
        async () => {
          child = Promise.resolve().then(async () => {
            await new Promise((resolve) => setTimeout(resolve, 1))
            expect(Zone.current.name).toBe('test')
            expect(Zone.current.get(LOGGING_KEY)).toEqual(expect.objectContaining({ isLogging: false }))
          })
        },
        jest.fn()
      )
      assert(child)
      await child
    })
  })

  describe('squelch', () => {
    it('resolves', async () => {
      await expect(squelch('resolves', () => Promise.resolve('test'))()).resolves.toBe('test')
    })

    it('rejects', async () => {
      await expect(squelch('rejects', () => Promise.reject('error'))).rejects.toBe('error')
    })

    it('does not log children', async () => {
      const state: LoggingState = { isLogging: true, logs: [] }
      await Zone.current.fork({ name: 'parent', properties: { [LOGGING_KEY]: state } }).run(() =>
        measureCallback(
          'test',
          squelch('squelch', () => measureCallback('child', () => Promise.resolve()))
        )
      )
      expect(state.logs).toEqual([expect.objectContaining({ name: 'test' })])
    })
  })
})
