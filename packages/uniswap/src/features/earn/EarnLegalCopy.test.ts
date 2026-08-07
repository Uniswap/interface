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

  it('uses Current APY only in the vault overview', () => {
    expect(sourceTranslations['explore.earn.vault.estApy']).toBe('Current APY')
    expect(sourceTranslations['explore.earn.vault.estApy.tooltip.title']).toBe('Current APY')
    expect(sourceTranslations['explore.earn.vault.estApy.tooltip']).toBe(
      'Current rate is variable and subject to change based on strategy of underlying Morpho lending vault.',
    )
  })

  it('labels all other Earn rate values as APY', () => {
    expect(sourceTranslations['explore.earn.apy']).toBe('{{apy}} APY')
    expect(sourceTranslations['explore.earn.vault.rateValue']).toBe('{{apy}} APY')
  })

  it('uses the approved How it works copy', () => {
    expect(sourceTranslations['explore.earn.howItWorks.title']).toBe('How it works')
    expect(sourceTranslations['explore.earn.howItWorks.startEarning.title']).toBe('Start earning\u00A0instantly')
    expect(sourceTranslations['explore.earn.howItWorks.startEarning.caption']).toBe(
      'Rewards start accruing as soon as you\u00A0deposit',
    )
    expect(sourceTranslations['explore.earn.howItWorks.realTimeApy.title']).toBe('Real-time\u00A0APY')
    expect(sourceTranslations['explore.earn.howItWorks.realTimeApy.caption']).toBe(
      'All rates are variable and may change over\u00A0time',
    )
    expect(sourceTranslations['explore.earn.howItWorks.noLockup.title']).toBe('No\u00A0lockup')
    expect(sourceTranslations['explore.earn.howItWorks.noLockup.caption']).toBe(
      'Withdraw your funds from the Earn vault any\u00A0time',
    )
    expect(sourceTranslations['common.button.continue']).toBe('Continue')
    expect(sourceTranslations['explore.earn.howItWorks.acknowledgement']).toBe(
      'By continuing, you acknowledge and agree that assets deposited into any Earn vault are not FDIC or SIPC insured, and that you may lose some or all of your assets.',
    )
  })
})
