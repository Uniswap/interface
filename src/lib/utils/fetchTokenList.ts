import type { TokenInfo, TokenList } from '@uniswap/token-lists'
import type { Ajv, ValidateFunction } from 'ajv'

import contenthashToUri from './contenthashToUri'
import parseENSAddress from './parseENSAddress'
import uriToHttp from './uriToHttp'

export const DEFAULT_TOKEN_LIST = 'https://gateway.ipfs.io/ipns/tokens.uniswap.org'

enum ValidationSchema {
  LIST = 'list',
  INFO = 'info',
}

/**
 * Returns a ValidateFunction for token lists.
 * Lazily loads ajv and the schema for performance.
 */
const getValidateFunction = (() => {
  let validator: Promise<Ajv>
  let validateList: Promise<ValidateFunction | undefined>
  let validateInfo: Promise<ValidateFunction | undefined>
  return (schema: ValidationSchema) => {
    if (!validator) {
      validator = new Promise<Ajv>(async (resolve) => {
        const [ajv, schema] = await Promise.all([
          import('ajv'),
          import('@uniswap/token-lists/src/tokenlist.schema.json'),
        ])
        const validator = new ajv.default({ allErrors: true }).addSchema(schema, ValidationSchema.LIST).addSchema(
          {
            ...schema,
            $id: schema.$id + '#tokens',
            required: ['tokens'],
          },
          ValidationSchema.INFO
        )
        resolve(validator)
      })
      validateList = validator.then((ajv) => ajv.getSchema(ValidationSchema.LIST))
      validateInfo = validator.then((ajv) => ajv.getSchema(ValidationSchema.INFO))
    }
    switch (schema) {
      case ValidationSchema.LIST:
        return validateList
      case ValidationSchema.INFO:
        return validateInfo
    }
  }
})()

function getValidationErrors(validate: ValidateFunction | undefined): string {
  return (
    validate?.errors?.map((error) => [error.dataPath, error.message].filter(Boolean).join(' ')).join('; ') ??
    'unknown error'
  )
}

/** Validates a list of tokens. */
export async function getTokenInfo(tokens: TokenInfo[]): Promise<TokenInfo[]> {
  const validate = await getValidateFunction(ValidationSchema.INFO)
  if (!validate?.({ tokens })) {
    throw new Error(`Token list failed validation: ${getValidationErrors(validate)}`)
  }
  return tokens
}

/** Fetches and validates a token list. */
export default async function fetchTokenList(
  listUrl: string,
  resolveENSContentHash: (ensName: string) => Promise<string>
): Promise<TokenList> {
  // Start loading the validator so it loads concurrently
  const validateList = getValidateFunction(ValidationSchema.LIST)

  let urls: string[]
  const parsedENS = parseENSAddress(listUrl)
  if (parsedENS) {
    let contentHashUri
    try {
      contentHashUri = await resolveENSContentHash(parsedENS.ensName)
    } catch (error) {
      const message = `failed to resolve ENS name: ${parsedENS.ensName}`
      console.debug(message, error)
      throw new Error(message)
    }
    let translatedUri
    try {
      translatedUri = contenthashToUri(contentHashUri)
    } catch (error) {
      const message = `failed to translate contenthash to URI: ${contentHashUri}`
      console.debug(message, error)
      throw new Error(message)
    }
    urls = uriToHttp(`${translatedUri}${parsedENS.ensPath ?? ''}`)
  } else {
    urls = uriToHttp(listUrl)
  }

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const isLast = i === urls.length - 1
    let response
    try {
      response = await fetch(url, { credentials: 'omit' })
    } catch (error) {
      const message = `failed to fetch list: ${listUrl}`
      console.debug(message, error)
      if (isLast) throw new Error(message)
      continue
    }

    if (!response.ok) {
      const message = `failed to fetch list: ${listUrl}`
      console.debug(message, response.statusText)
      if (isLast) throw new Error(message)
      continue
    }

    const [json, validate] = await Promise.all([response.json(), validateList])
    if (!validate?.(json)) {
      throw new Error(`Token list failed validation: ${getValidationErrors(validate)}`)
    }
    return json
  }

  throw new Error('Unrecognized list URL protocol.')
}
