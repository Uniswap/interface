import sourceTranslations from 'uniswap/src/i18n/locales/source/en-US.json'

describe('Earn legal copy', () => {
  it('uses the approved yield language without promising a daily cadence', () => {
    const approvedCopy = 'Deposit for yield with no lockup'

    expect(sourceTranslations['explore.earn.subtitle']).toBe(approvedCopy)
    expect(sourceTranslations['explore.earn.swapToggle.subtitle']).toBe(approvedCopy)
    expect(sourceTranslations['explore.earn.toast.subtitle']).toBe(approvedCopy)
    expect(sourceTranslations['tdp.earnBanner.subtitle']).toBe(approvedCopy)
  })

  it('requires agreement to the Uniswap terms and Morpho disclaimer', () => {
    expect(sourceTranslations['explore.earn.vault.details.legalDisclaimer']).toContain(
      'read, understood, and agree to these terms',
    )
  })

  it('uses the full title for the mobile estimated APY sheet', () => {
    expect(sourceTranslations['explore.earn.vault.estApy.tooltip.title']).toBe('Estimated APY')
  })

  it('labels Earn APY values as estimates', () => {
    expect(sourceTranslations['explore.earn.apy']).toBe('{{apy}} est. APY')
    expect(sourceTranslations['explore.earn.vault.rateValue']).toBe('{{apy}} est. APY')
  })
})
