import { UAParser } from 'ua-parser-js'

export function getUserAgent(): UAParser.IResult {
  const parser = new UAParser(window.navigator.userAgent)
  return parser.getResult()
}
