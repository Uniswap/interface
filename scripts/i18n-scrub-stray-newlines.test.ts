/**
 * Test file for the i18n stray-newline scrub script
 * Run with `bun test scripts/i18n-scrub-stray-newlines.test.ts`
 */
import { describe, expect, test } from 'bun:test'
import { removeStrayNewlines } from './i18n-scrub-stray-newlines'

describe('removeStrayNewlines', () => {
  test('replaces a newline between two non-space characters with a single space', () => {
    expect(removeStrayNewlines('Hello\nworld')).toBe('Hello world')
  })

  test('deletes a newline adjacent to whitespace', () => {
    expect(removeStrayNewlines('Hello \nworld')).toBe('Hello world')
    expect(removeStrayNewlines('Hello\n world')).toBe('Hello world')
    expect(removeStrayNewlines('Hello \n world')).toBe('Hello  world')
  })

  test('deletes leading and trailing newlines', () => {
    expect(removeStrayNewlines('\nHello')).toBe('Hello')
    expect(removeStrayNewlines('Hello\n')).toBe('Hello')
  })

  test('collapses consecutive newlines between words into a single space', () => {
    expect(removeStrayNewlines('Hello\n\nworld')).toBe('Hello world')
    expect(removeStrayNewlines('Hello\n\n\nworld')).toBe('Hello world')
  })

  test('handles multiple stray newlines in one string', () => {
    expect(removeStrayNewlines('a\nb c\nd')).toBe('a b c d')
  })

  test('treats CRLF and bare CR as stray newlines', () => {
    expect(removeStrayNewlines('Hello\r\nworld')).toBe('Hello world')
    expect(removeStrayNewlines('Hello\rworld')).toBe('Hello world')
    expect(removeStrayNewlines('Hello \r\nworld')).toBe('Hello world')
    expect(removeStrayNewlines('\r\nHello\r')).toBe('Hello')
    expect(removeStrayNewlines('\r')).toBe('')
  })

  test('leaves strings without newlines unchanged', () => {
    expect(removeStrayNewlines('Hello world')).toBe('Hello world')
  })

  test('preserves interpolation placeholders around newlines', () => {
    expect(removeStrayNewlines('Swap {{amount}}\n{{symbol}}')).toBe('Swap {{amount}} {{symbol}}')
  })

  test('returns an empty string for newline-only input', () => {
    expect(removeStrayNewlines('\n')).toBe('')
    expect(removeStrayNewlines('\n\n')).toBe('')
  })
})
