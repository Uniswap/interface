'use strict';

var secp256k1 = require('ethereum-cryptography/secp256k1');

var secp256k1v3 = require('./secp256k1-lib/index');
var der = require('./secp256k1-lib/der');

/**
 * Verify an ECDSA privateKey
 * @method privateKeyVerify
 * @param {Buffer} privateKey
 * @return {boolean}
 */
var privateKeyVerify = function privateKeyVerify(privateKey) {
  // secp256k1 v4 version throws when privateKey length is not 32
  if (privateKey.length !== 32) {
    return false;
  }

  return secp256k1.privateKeyVerify(Uint8Array.from(privateKey));
};

/**
 * Export a privateKey in DER format
 * @method privateKeyExport
 * @param {Buffer} privateKey
 * @param {boolean} compressed
 * @return {boolean}
 */
var privateKeyExport = function privateKeyExport(privateKey, compressed) {
  // privateKeyExport method is not part of secp256k1 v4 package
  // this implementation is based on v3
  if (privateKey.length !== 32) {
    throw new RangeError('private key length is invalid');
  }

  var publicKey = secp256k1v3.privateKeyExport(privateKey, compressed);

  return der.privateKeyExport(privateKey, publicKey, compressed);
};

/**
 * Import a privateKey in DER format
 * @method privateKeyImport
 * @param {Buffer} privateKey
 * @return {Buffer}
 */

var privateKeyImport = function privateKeyImport(privateKey) {
  // privateKeyImport method is not part of secp256k1 v4 package
  // this implementation is based on v3
  privateKey = der.privateKeyImport(privateKey);
  if (privateKey !== null && privateKey.length === 32 && privateKeyVerify(privateKey)) {
    return privateKey;
  }

  throw new Error("couldn't import from DER format");
};

/**
 * Negate a privateKey by subtracting it from the order of the curve's base point
 * @method privateKeyNegate
 * @param {Buffer} privateKey
 * @return {Buffer}
 */
var privateKeyNegate = function privateKeyNegate(privateKey) {
  return Buffer.from(secp256k1.privateKeyNegate(Uint8Array.from(privateKey)));
};

/**
 * Compute the inverse of a privateKey (modulo the order of the curve's base point).
 * @method privateKeyModInverse
 * @param {Buffer} privateKey
 * @return {Buffer}
 */
var privateKeyModInverse = function privateKeyModInverse(privateKey) {
  if (privateKey.length !== 32) {
    throw new Error('private key length is invalid');
  }

  return Buffer.from(secp256k1v3.privateKeyModInverse(Uint8Array.from(privateKey)));
};

/**
 * Tweak a privateKey by adding tweak to it.
 * @method privateKeyTweakAdd
 * @param {Buffer} privateKey
 * @param {Buffer} tweak
 * @return {Buffer}
 */
var privateKeyTweakAdd = function privateKeyTweakAdd(privateKey, tweak) {
  return Buffer.from(secp256k1.privateKeyTweakAdd(Uint8Array.from(privateKey), tweak));
};

/**
 * Tweak a privateKey by multiplying it by a tweak.
 * @method privateKeyTweakMul
 * @param {Buffer} privateKey
 * @param {Buffer} tweak
 * @return {Buffer}
 */
var privateKeyTweakMul = function privateKeyTweakMul(privateKey, tweak) {
  return Buffer.from(secp256k1.privateKeyTweakMul(Uint8Array.from(privateKey), Uint8Array.from(tweak)));
};

/**
 * Compute the public key for a privateKey.
 * @method publicKeyCreate
 * @param {Buffer} privateKey
 * @param {boolean} compressed
 * @return {Buffer}
 */
var publicKeyCreate = function publicKeyCreate(privateKey, compressed) {
  return Buffer.from(secp256k1.publicKeyCreate(Uint8Array.from(privateKey), compressed));
};

/**
 * Convert a publicKey to compressed or uncompressed form.
 * @method publicKeyConvert
 * @param {Buffer} publicKey
 * @param {boolean} compressed
 * @return {Buffer}
 */
var publicKeyConvert = function publicKeyConvert(publicKey, compressed) {
  return Buffer.from(secp256k1.publicKeyConvert(Uint8Array.from(publicKey), compressed));
};

/**
 * Verify an ECDSA publicKey.
 * @method publicKeyVerify
 * @param {Buffer} publicKey
 * @return {boolean}
 */
var publicKeyVerify = function publicKeyVerify(publicKey) {
  // secp256k1 v4 version throws when publicKey length is not 33 or 65
  if (publicKey.length !== 33 && publicKey.length !== 65) {
    return false;
  }

  return secp256k1.publicKeyVerify(Uint8Array.from(publicKey));
};

/**
 * Tweak a publicKey by adding tweak times the generator to it.
 * @method publicKeyTweakAdd
 * @param {Buffer} publicKey
 * @param {Buffer} tweak
 * @param {boolean} compressed
 * @return {Buffer}
 */
var publicKeyTweakAdd = function publicKeyTweakAdd(publicKey, tweak, compressed) {
  return Buffer.from(secp256k1.publicKeyTweakAdd(Uint8Array.from(publicKey), Uint8Array.from(tweak), compressed));
};

/**
 * Tweak a publicKey by multiplying it by a tweak value
 * @method publicKeyTweakMul
 * @param {Buffer} publicKey
 * @param {Buffer} tweak
 * @param {boolean} compressed
 * @return {Buffer}
 */
var publicKeyTweakMul = function publicKeyTweakMul(publicKey, tweak, compressed) {
  return Buffer.from(secp256k1.publicKeyTweakMul(Uint8Array.from(publicKey), Uint8Array.from(tweak), compressed));
};

/**
 * Add a given publicKeys together.
 * @method publicKeyCombine
 * @param {Array<Buffer>} publicKeys
 * @param {boolean} compressed
 * @return {Buffer}
 */
var publicKeyCombine = function publicKeyCombine(publicKeys, compressed) {
  var keys = [];
  publicKeys.forEach(function (publicKey) {
    keys.push(Uint8Array.from(publicKey));
  });

  return Buffer.from(secp256k1.publicKeyCombine(keys, compressed));
};

/**
 * Convert a signature to a normalized lower-S form.
 * @method signatureNormalize
 * @param {Buffer} signature
 * @return {Buffer}
 */
var signatureNormalize = function signatureNormalize(signature) {
  return Buffer.from(secp256k1.signatureNormalize(Uint8Array.from(signature)));
};

/**
 * Serialize an ECDSA signature in DER format.
 * @method signatureExport
 * @param {Buffer} signature
 * @return {Buffer}
 */
var signatureExport = function signatureExport(signature) {
  return Buffer.from(secp256k1.signatureExport(Uint8Array.from(signature)));
};

/**
 * Parse a DER ECDSA signature (follow by [BIP66](https://github.com/bitcoin/bips/blob/master/bip-0066.mediawiki)).
 * @method signatureImport
 * @param {Buffer} signature
 * @return {Buffer}
 */
var signatureImport = function signatureImport(signature) {
  return Buffer.from(secp256k1.signatureImport(Uint8Array.from(signature)));
};

/**
 * Parse a DER ECDSA signature (not follow by [BIP66](https://github.com/bitcoin/bips/blob/master/bip-0066.mediawiki)).
 * @method signatureImportLax
 * @param {Buffer} signature
 * @return {Buffer}
 */
var signatureImportLax = function signatureImportLax(signature) {
  // signatureImportLax method is not part of secp256k1 v4 package
  // this implementation is based on v3
  // ensure that signature is greater than 0
  if (signature.length === 0) {
    throw new RangeError('signature length is invalid');
  }

  var sigObj = der.signatureImportLax(signature);
  if (sigObj === null) {
    throw new Error("couldn't parse DER signature");
  }

  return secp256k1v3.signatureImport(sigObj);
};

/**
 * Create an ECDSA signature. Always return low-S signature.
 * @method sign
 * @param {Buffer} message
 * @param {Buffer} privateKey
 * @param {Object} options
 * @return {Buffer}
 */
var sign = function sign(message, privateKey, options) {
  if (options === null) {
    throw new TypeError('options should be an Object');
  }

  var signOptions = void 0;

  if (options) {
    signOptions = {};

    if (options.data === null) {
      throw new TypeError('options.data should be a Buffer');
    }

    if (options.data) {
      // validate option.data length
      if (options.data.length !== 32) {
        throw new RangeError('options.data length is invalid');
      }

      signOptions.data = new Uint8Array(options.data);
    }

    if (options.noncefn === null) {
      throw new TypeError('options.noncefn should be a Function');
    }

    if (options.noncefn) {
      //  convert option.noncefn function signature
      signOptions.noncefn = function (message, privateKey, algo, data, attempt) {
        var bufferAlgo = algo != null ? Buffer.from(algo) : null;
        var bufferData = data != null ? Buffer.from(data) : null;

        var buffer = Buffer.from('');

        if (options.noncefn) {
          buffer = options.noncefn(Buffer.from(message), Buffer.from(privateKey), bufferAlgo, bufferData, attempt);
        }

        return Uint8Array.from(buffer);
      };
    }
  }

  var sig = secp256k1.ecdsaSign(Uint8Array.from(message), Uint8Array.from(privateKey), signOptions);

  return {
    signature: Buffer.from(sig.signature),
    recovery: sig.recid
  };
};

/**
 * Verify an ECDSA signature.
 * @method verify
 * @param {Buffer} message
 * @param {Buffer} signature
 * @param {Buffer} publicKey
 * @return {boolean}
 */
var verify = function verify(message, signature, publicKey) {
  // note: secp256k1 v4 verify method has a different argument order
  return secp256k1.ecdsaVerify(Uint8Array.from(signature), Uint8Array.from(message), publicKey);
};

/**
 * Recover an ECDSA public key from a signature.
 * @method recover
 * @param {Buffer} message
 * @param {Buffer} signature
 * @param {Number} recid
 * @param {boolean} compressed
 * @return {Buffer}
 */
var recover = function recover(message, signature, recid, compressed) {
  // note: secp256k1 v4 recover method has a different argument order
  return Buffer.from(secp256k1.ecdsaRecover(Uint8Array.from(signature), recid, Uint8Array.from(message), compressed));
};

/**
 * Compute an EC Diffie-Hellman secret and applied sha256 to compressed public key.
 * @method ecdh
 * @param {Buffer} publicKey
 * @param {Buffer} privateKey
 * @return {Buffer}
 */
var ecdh = function ecdh(publicKey, privateKey) {
  // note: secp256k1 v3 doesn't allow optional parameter
  return Buffer.from(secp256k1.ecdh(Uint8Array.from(publicKey), Uint8Array.from(privateKey), {}));
};

/**
 * Compute an EC Diffie-Hellman secret and return public key as result
 * @method ecdhUnsafe
 * @param {Buffer} publicKey
 * @param {Buffer} privateKey
 * @param {boolean} compressed
 * @return {Buffer}
 */
var ecdhUnsafe = function ecdhUnsafe(publicKey, privateKey, compressed) {
  // ecdhUnsafe method is not part of secp256k1 v4 package
  // this implementation is based on v3
  // ensure valid publicKey length
  if (publicKey.length !== 33 && publicKey.length !== 65) {
    throw new RangeError('public key length is invalid');
  }

  // ensure valid privateKey length
  if (privateKey.length !== 32) {
    throw new RangeError('private key length is invalid');
  }

  return Buffer.from(secp256k1v3.ecdhUnsafe(Uint8Array.from(publicKey), Uint8Array.from(privateKey), compressed));
};

module.exports = {
  privateKeyVerify: privateKeyVerify,
  privateKeyExport: privateKeyExport,
  privateKeyImport: privateKeyImport,
  privateKeyNegate: privateKeyNegate,
  privateKeyModInverse: privateKeyModInverse,
  privateKeyTweakAdd: privateKeyTweakAdd,
  privateKeyTweakMul: privateKeyTweakMul,

  publicKeyCreate: publicKeyCreate,
  publicKeyConvert: publicKeyConvert,
  publicKeyVerify: publicKeyVerify,
  publicKeyTweakAdd: publicKeyTweakAdd,
  publicKeyTweakMul: publicKeyTweakMul,
  publicKeyCombine: publicKeyCombine,

  signatureNormalize: signatureNormalize,
  signatureExport: signatureExport,
  signatureImport: signatureImport,
  signatureImportLax: signatureImportLax,

  sign: sign,
  verify: verify,
  recover: recover,

  ecdh: ecdh,
  ecdhUnsafe: ecdhUnsafe
};