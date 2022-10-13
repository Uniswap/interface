import test from 'tape';
import isBrowser from '../src/index';


test('isInBrowser', t => {
    t.equal(false, isBrowser, 'works as expected in Node');
    t.end();
});
