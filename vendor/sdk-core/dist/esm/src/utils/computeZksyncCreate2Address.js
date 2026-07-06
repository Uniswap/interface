import { getAddress } from '@ethersproject/address';
import { concat, hexZeroPad } from '@ethersproject/bytes';
import { keccak256 } from '@ethersproject/keccak256';
import { toUtf8Bytes } from '@ethersproject/strings';
export function computeZksyncCreate2Address(sender, bytecodeHash, salt, input = '0x') {
    const prefix = keccak256(toUtf8Bytes('zksyncCreate2'));
    const inputHash = keccak256(input);
    const addressBytes = keccak256(concat([prefix, hexZeroPad(sender, 32), salt, bytecodeHash, inputHash])).slice(26);
    return getAddress(addressBytes);
}
//# sourceMappingURL=computeZksyncCreate2Address.js.map