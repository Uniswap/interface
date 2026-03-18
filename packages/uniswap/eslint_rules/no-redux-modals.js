module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent adding new modal types to the deprecated modalSlice',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
    messages: {
      noNewModals:
        'Adding new modal types to modalSlice is deprecated. Please use React Navigation for new modals instead. See apps/mobile/src/app/navigation/navigation.tsx for examples.',
    },
  },

  create(context) {
    if (!context.getFilename().endsWith('modalSlice.ts')) {
      return {}
    }

    const existingModalTypes = new Set([
      'BiometricsModalParams',
      'EditProfileSettingsModalParams',
      'EditLabelSettingsModalParams',
      'ExploreModalParams',
      'FiatCurrencySelectorParams',
      'FiatOnRampAggregatorModalParams',
      'LanguageSelectorModalParams',
      'SettingsAppearanceModalParams',
      'PortfolioBalanceModalParams',
      'ManageWalletsModalParams',
      'WalletConnectModalParams',
      'ConnectionsDappListModalParams',
      'SwapModalParams',
      'SendModalParams',
      'PermissionsModalParams',
      'OpenModalParams',
      'CloseModalParams',
    ])

    return {
      'TSTypeAliasDeclaration, TSInterfaceDeclaration'(node) {
        const typeName = node.id.name

        if (typeName.endsWith('ModalParams') && !existingModalTypes.has(typeName)) {
          context.report({
            node: node.id,
            messageId: 'noNewModals',
          })
        }
      },
    }
  },
}
