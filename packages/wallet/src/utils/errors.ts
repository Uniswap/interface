export class NotImplementedError extends Error {
  constructor(functionName: string) {
    super(`${functionName}() not implemented. Did you forget a platform override?`)
    this.name = this.constructor.name
  }
}
