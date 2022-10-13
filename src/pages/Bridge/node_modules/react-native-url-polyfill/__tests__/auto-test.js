describe('Auto', function () {
  it('should import polyfills and apply them automatically', () => {
    expect(global.REACT_NATIVE_URL_POLYFILL).toBeUndefined();

    require('../auto');

    expect(global.REACT_NATIVE_URL_POLYFILL).toBeDefined();
  });
});
