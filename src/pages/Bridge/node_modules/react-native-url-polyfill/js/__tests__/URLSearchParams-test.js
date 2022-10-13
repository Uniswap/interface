import {URLSearchParams} from '../URLSearchParams';

describe('URL', function () {
  // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams#Examples
  it('should pass Mozilla Dev Network examples', () => {
    const paramsString = 'q=URLUtils.searchParams&topic=api';
    const searchParams = new URLSearchParams(paramsString);

    expect(searchParams.has('topic')).toBe(true);
    expect(searchParams.get('topic')).toBe('api');
    expect(searchParams.getAll('topic')).toEqual(['api']);
    expect(searchParams.get('foo')).toBe(null);
    searchParams.append('topic', 'webdev');
    expect(searchParams.toString()).toBe(
      'q=URLUtils.searchParams&topic=api&topic=webdev',
    );
    searchParams.set('topic', 'More webdev');
    expect(searchParams.toString()).toBe(
      'q=URLUtils.searchParams&topic=More+webdev',
    );
    searchParams.delete('topic');
    expect(searchParams.toString()).toBe('q=URLUtils.searchParams');
  });
});
