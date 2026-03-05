import { jsonParse, jsonStringify } from 'utilities/src/serialization/json'
import { describe, expect, it } from 'vitest'

describe('BigInt serialization utilities', () => {
  describe('stringify', () => {
    it('should serialize primitive BigInt values', () => {
      const result = jsonStringify(BigInt(123))
      expect(result).toBe('"__bigint__:123"')
    })

    it('should serialize BigInt in objects', () => {
      const data = { amount: BigInt('123456789012345678901234567890'), name: 'Test' }
      const result = jsonStringify(data)
      expect(result).toBe('{"amount":"__bigint__:123456789012345678901234567890","name":"Test"}')
    })

    it('should serialize BigInt in arrays', () => {
      const data = [BigInt(123), BigInt(456), 'text']
      const result = jsonStringify(data)
      expect(result).toBe('["__bigint__:123","__bigint__:456","text"]')
    })

    it('should serialize nested BigInt values', () => {
      const data = {
        user: {
          balance: BigInt('999999999999999999'),
          transactions: [
            { amount: BigInt(100), fee: BigInt(1) },
            { amount: BigInt(200), fee: BigInt(2) },
          ],
        },
      }
      const result = jsonStringify(data)
      const parsed = JSON.parse(result)
      expect(parsed.user.balance).toBe('__bigint__:999999999999999999')
      expect(parsed.user.transactions[0].amount).toBe('__bigint__:100')
      expect(parsed.user.transactions[1].fee).toBe('__bigint__:2')
    })

    it('should handle mixed types correctly', () => {
      const data = {
        bigIntValue: BigInt(123),
        numberValue: 123,
        stringValue: '123',
        boolValue: true,
        nullValue: null,
        undefinedValue: undefined,
        objectValue: { nested: BigInt(456) },
        arrayValue: [BigInt(789), 'string', 42],
      }
      const result = jsonStringify(data)
      expect(result).toContain('"bigIntValue":"__bigint__:123"')
      expect(result).toContain('"numberValue":123')
      expect(result).toContain('"stringValue":"123"')
      expect(result).toContain('"boolValue":true')
      expect(result).toContain('"nullValue":null')
      expect(result).not.toContain('undefined') // JSON.stringify removes undefined
    })

    it('should handle very large BigInt values', () => {
      const largeValue = BigInt('123456789012345678901234567890123456789012345678901234567890')
      const data = { value: largeValue }
      const result = jsonStringify(data)
      expect(result).toBe(`{"value":"__bigint__:${largeValue.toString()}"}`)
    })

    it('should support spacing parameter', () => {
      const data = { amount: BigInt(100) }
      const result = jsonStringify(data, undefined, 2)
      expect(result).toContain('\n')
      expect(result).toContain('  ')
    })

    it('should not modify strings that happen to contain bigint values', () => {
      const data = { message: 'The value is 123' }
      const result = jsonStringify(data)
      expect(result).toBe('{"message":"The value is 123"}')
    })
  })

  describe('parse', () => {
    it('should deserialize primitive BigInt values', () => {
      const json = '"__bigint__:123"'
      const result = jsonParse(json)
      expect(result).toBe(BigInt(123))
      expect(typeof result).toBe('bigint')
    })

    it('should deserialize BigInt in objects', () => {
      const json = '{"amount":"__bigint__:123456789012345678901234567890","name":"Test"}'
      const result: any = jsonParse(json)
      expect(result.amount).toBe(BigInt('123456789012345678901234567890'))
      expect(result.name).toBe('Test')
      expect(typeof result.amount).toBe('bigint')
    })

    it('should deserialize BigInt in arrays', () => {
      const json = '["__bigint__:123","__bigint__:456","text"]'
      const result: any = jsonParse(json)
      expect(result[0]).toBe(BigInt(123))
      expect(result[1]).toBe(BigInt(456))
      expect(result[2]).toBe('text')
    })

    it('should deserialize nested BigInt values', () => {
      const json =
        '{"user":{"balance":"__bigint__:999999999999999999","transactions":[{"amount":"__bigint__:100","fee":"__bigint__:1"},{"amount":"__bigint__:200","fee":"__bigint__:2"}]}}'
      const result: any = jsonParse(json)
      expect(result.user.balance).toBe(BigInt('999999999999999999'))
      expect(result.user.transactions[0].amount).toBe(BigInt(100))
      expect(result.user.transactions[1].fee).toBe(BigInt(2))
    })

    it('should handle mixed types correctly', () => {
      const json =
        '{"bigIntValue":"__bigint__:123","numberValue":123,"stringValue":"123","boolValue":true,"nullValue":null,"objectValue":{"nested":"__bigint__:456"},"arrayValue":["__bigint__:789","string",42]}'
      const result: any = jsonParse(json)

      expect(result.bigIntValue).toBe(BigInt(123))
      expect(result.numberValue).toBe(123)
      expect(result.stringValue).toBe('123')
      expect(result.boolValue).toBe(true)
      expect(result.nullValue).toBe(null)
      expect(result.objectValue.nested).toBe(BigInt(456))
      expect(result.arrayValue[0]).toBe(BigInt(789))
    })

    it('should handle very large BigInt values', () => {
      const largeValue = BigInt('123456789012345678901234567890123456789012345678901234567890')
      const json = `{"value":"__bigint__:${largeValue.toString()}"}`
      const result: any = jsonParse(json)
      expect(result.value).toBe(largeValue)
    })

    it('should not modify regular strings that start with prefix', () => {
      // String values that happen to start with the prefix but aren't followed by valid BigInt
      const json = '{"message":"__bigint__:notanumber"}'
      expect(() => jsonParse(json)).toThrow()
    })

    it('should not convert strings that contain but do not start with prefix', () => {
      const json = '{"message":"The value is __bigint__:123"}'
      const result = jsonParse<{ message: string }>(json)
      expect(result.message).toBe('The value is __bigint__:123')
      expect(typeof result.message).toBe('string')
    })
  })

  describe('round-trip serialization', () => {
    it('should maintain BigInt values through serialize/deserialize cycle', () => {
      const original = {
        balance: BigInt('123456789012345678901234567890'),
        fee: BigInt('1000000000000000000'),
        metadata: {
          chainId: 1,
          decimals: 18,
          totalSupply: BigInt('999999999999999999999999'),
        },
      }

      const serialized = jsonStringify(original)
      const deserialized: any = jsonParse(serialized)

      expect(deserialized.balance).toBe(original.balance)
      expect(deserialized.fee).toBe(original.fee)
      expect(deserialized.metadata.totalSupply).toBe(original.metadata.totalSupply)
      expect(typeof deserialized.balance).toBe('bigint')
    })

    it('should handle complex nested structures', () => {
      const original = {
        users: [
          { id: 1, balance: BigInt(100), active: true },
          { id: 2, balance: BigInt(200), active: false },
        ],
        totals: {
          sum: BigInt(300),
          count: 2,
          meta: { timestamp: Date.now(), verified: true },
        },
      }

      const serialized = jsonStringify(original)
      const deserialized: any = jsonParse(serialized)

      expect(deserialized.users[0].balance).toBe(BigInt(100))
      expect(deserialized.users[1].balance).toBe(BigInt(200))
      expect(deserialized.totals.sum).toBe(BigInt(300))
      expect(deserialized.totals.count).toBe(2)
    })

    it('should handle empty objects and arrays', () => {
      const original = { empty: {}, emptyArray: [], value: BigInt(123) }
      const serialized = jsonStringify(original)
      const deserialized: any = jsonParse(serialized)

      expect(deserialized.empty).toEqual({})
      expect(deserialized.emptyArray).toEqual([])
      expect(deserialized.value).toBe(BigInt(123))
    })

    it('should preserve other data types exactly', () => {
      const original = {
        string: 'hello',
        number: 42,
        float: 3.14,
        bool: true,
        null: null,
        array: [1, 'two', true, null],
        nested: { a: 1, b: 'two' },
        bigInt: BigInt(9007199254740991), // Max safe integer as BigInt
      }

      const serialized = jsonStringify(original)
      const deserialized: any = jsonParse(serialized)

      expect(deserialized.string).toBe('hello')
      expect(deserialized.number).toBe(42)
      expect(deserialized.float).toBe(3.14)
      expect(deserialized.bool).toBe(true)
      expect(deserialized.null).toBe(null)
      expect(deserialized.array).toEqual([1, 'two', true, null])
      expect(deserialized.nested).toEqual({ a: 1, b: 'two' })
      expect(deserialized.bigInt).toBe(BigInt(9007199254740991))
    })
  })

  describe('edge cases', () => {
    it('should handle zero BigInt', () => {
      const data = { value: BigInt(0) }
      const serialized = jsonStringify(data)
      const deserialized: any = jsonParse(serialized)
      expect(deserialized.value).toBe(BigInt(0))
    })

    it('should handle negative BigInt', () => {
      const data = { value: BigInt(-123456789) }
      const serialized = jsonStringify(data)
      const deserialized: any = jsonParse(serialized)
      expect(deserialized.value).toBe(BigInt(-123456789))
    })

    it('should handle arrays with only BigInt values', () => {
      const data = [BigInt(1), BigInt(2), BigInt(3)]
      const serialized = jsonStringify(data)
      const deserialized: any = jsonParse(serialized)
      expect(deserialized).toEqual([BigInt(1), BigInt(2), BigInt(3)])
    })

    it('should handle null and undefined in objects with BigInt', () => {
      const data = { value: BigInt(100), nullValue: null, undefinedValue: undefined }
      const serialized = jsonStringify(data)
      const deserialized: any = jsonParse(serialized)
      expect(deserialized.value).toBe(BigInt(100))
      expect(deserialized.nullValue).toBe(null)
      expect('undefinedValue' in deserialized).toBe(false) // undefined is removed by JSON.stringify
    })
  })

  describe('custom replacer and reviver', () => {
    it('should apply custom replacer before BigInt handling', () => {
      const data = { amount: BigInt(100), secret: 'password' }
      const customReplacer = (key: string, value: unknown): unknown => {
        if (key === 'secret') {
          return '[REDACTED]'
        }
        return value
      }
      const result = jsonStringify(data, customReplacer)
      expect(result).toContain('"secret":"[REDACTED]"')
      expect(result).toContain('"amount":"__bigint__:100"')
    })

    it('should apply custom reviver after BigInt handling', () => {
      const json = '{"amount":"__bigint__:100","timestamp":"2025-01-01T00:00:00.000Z"}'
      const customReviver = (key: string, value: unknown): unknown => {
        if (key === 'timestamp' && typeof value === 'string') {
          return new Date(value)
        }
        return value
      }
      const result: any = jsonParse(json, customReviver)
      expect(result.amount).toBe(BigInt(100))
      expect(result.timestamp).toBeInstanceOf(Date)
    })

    it('should handle both custom replacer and BigInt in round-trip', () => {
      const original = { amount: BigInt(500), date: new Date('2025-01-01') }

      const customReplacer = (key: string, value: unknown): unknown => {
        if (value instanceof Date) {
          return value.toISOString()
        }
        return value
      }

      const customReviver = (key: string, value: unknown): unknown => {
        if (key === 'date' && typeof value === 'string') {
          return new Date(value)
        }
        return value
      }

      const serialized = jsonStringify(original, customReplacer)
      const deserialized: any = jsonParse(serialized, customReviver)

      expect(deserialized.amount).toBe(BigInt(500))
      expect(deserialized.date).toBeInstanceOf(Date)
      expect(deserialized.date.getTime()).toBe(original.date.getTime())
    })
  })
})
