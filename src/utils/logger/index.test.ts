import { errorOn5xx } from '.'

describe('logger', () => {
  describe('errorOn5xx', () => {
    it('does not err on 4xx', () => {
      const data = errorOn5xx({ status: 400, statusText: 'Not Found' } as Response)
      expect(data).toEqual({ status: '400' })
    })

    it('does err on 5xx', () => {
      const data = errorOn5xx({ status: 500, statusText: 'Internal Server Error' } as Response)
      expect(data).toEqual({ status: '500', error: 'Internal Server Error' })
    })
  })
})
