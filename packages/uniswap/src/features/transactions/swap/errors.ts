export class GasSponsorshipNotAppliedError extends Error {
  constructor(reason?: string) {
    super(reason ? `Gas sponsorship was not applied: ${reason}` : 'Gas sponsorship was requested but not applied')
    this.name = 'GasSponsorshipNotAppliedError'
  }
}
