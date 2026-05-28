declare module 'fast-redact' {
  interface FastRedactOptions {
    paths: string[]
    serialize?: false | ((obj: Record<string, unknown>) => string)
    censor?: string
    strict?: boolean
    remove?: boolean
  }
  function fastRedact(
    options: FastRedactOptions & { serialize: false },
  ): (obj: Record<string, unknown>) => Record<string, unknown>
  function fastRedact(options: FastRedactOptions): (obj: Record<string, unknown>) => string
  export default fastRedact
}
