"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeZksyncCreate2Address = void 0;
const address_1 = require("@ethersproject/address");
const bytes_1 = require("@ethersproject/bytes");
const keccak256_1 = require("@ethersproject/keccak256");
const strings_1 = require("@ethersproject/strings");
function computeZksyncCreate2Address(sender, bytecodeHash, salt, input = '0x') {
    const prefix = (0, keccak256_1.keccak256)((0, strings_1.toUtf8Bytes)('zksyncCreate2'));
    const inputHash = (0, keccak256_1.keccak256)(input);
    const addressBytes = (0, keccak256_1.keccak256)((0, bytes_1.concat)([prefix, (0, bytes_1.hexZeroPad)(sender, 32), salt, bytecodeHash, inputHash])).slice(26);
    return (0, address_1.getAddress)(addressBytes);
}
exports.computeZksyncCreate2Address = computeZksyncCreate2Address;
//# sourceMappingURL=computeZksyncCreate2Address.js.map