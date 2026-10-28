// Dependency-free on purpose (no ui/src or mycelium), so pure warning logic can import it.
// types.ts re-exports it.
export enum WarningSeverity {
  None = 0,
  Low = 1,
  Medium = 5,
  High = 10,
  Blocked = 11,
}
