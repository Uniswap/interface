export class SignedTransactionTimestampRegistry {
  private static _instance: SignedTransactionTimestampRegistry

  private constructor() {
    // Private constructor to prevent instantiation
  }

  public static getInstance(): SignedTransactionTimestampRegistry {
    if (!this._instance) {
      this._instance = new SignedTransactionTimestampRegistry()
    }
    return this._instance
  }

  public set(hash: string): void {
    // Create a performance mark for the given hash
    const markName = this.getMarkNameForHash(hash)
    if (performance.getEntriesByName(markName, 'mark')?.length > 0) {
      // If a mark already exists for this hash, remove it before creating a new one
      performance.clearMarks(markName)
    }
    performance.mark(markName)
  }

  public get(hash: string): number | undefined {
    const markName = this.getMarkNameForHash(hash)
    const marks = performance.getEntriesByName(markName, 'mark')
    return marks?.length > 0 ? marks[0].startTime : undefined
  }

  // Helper method to derive mark name from hash
  private getMarkNameForHash(hash: string): string {
    return `time-to-sign-${hash}`
  }
}
