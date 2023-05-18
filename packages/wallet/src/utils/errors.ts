export class NotImplementedError extends Error {
  constructor(functionName: string) {
    super(`KeyManager.${functionName}() not implemented. Did you forget a platform override?`)
    this.name = this.constructor.name
  }
}
