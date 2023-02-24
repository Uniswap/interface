pragma solidity >=0.5.0;

import './AddressStringUtil.sol';

// produces token descriptors from inconsistent or absent ERC20 symbol implementations that can return string or bytes32
// this library will always produce a string symbol to represent the token
library SafeERC20Namer {
    function bytes32ToString(bytes32 x) pure private returns (string memory) {
        bytes memory bytesString = new bytes(32);
        uint charCount = 0;
        for (uint j = 0; j < 32; j++) {
            byte char = x[j];
            if (char != 0) {
                bytesString[charCount] = char;
                charCount++;
            }
        }
        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (uint j = 0; j < charCount; j++) {
            bytesStringTrimmed[j] = bytesString[j];
        }
        return string(bytesStringTrimmed);
    }

    // assumes the data is in position 2
    function parseStringData(bytes memory b) pure private returns (string memory) {
        uint charCount = 0;
        // first parse the charCount out of the data
        for (uint i = 32; i < 64; i++) {
            charCount <<= 8;
            charCount += uint8(b[i]);
        }

        bytes memory bytesStringTrimmed = new bytes(charCount);
        for (uint i = 0; i < charCount; i++) {
            bytesStringTrimmed[i] = b[i + 64];
        }

        return string(bytesStringTrimmed);
    }

    // uses a heuristic to produce a token name from the address
    // the heuristic returns the full hex of the address string in upper case
    function addressToName(address token) pure private returns (string memory) {
        return AddressStringUtil.toAsciiString(token, 40);
    }

    // uses a heuristic to produce a token symbol from the address
    // the heuristic returns the first 6 hex of the address string in upper case
    function addressToSymbol(address token) pure private returns (string memory) {
        return AddressStringUtil.toAsciiString(token, 6);
    }

    // calls an external view token contract method that returns a symbol or name, and parses the output into a string
    function callAndParseStringReturn(address token, bytes4 selector) view private returns (string memory) {
        (bool success, bytes memory data) = token.staticcall(abi.encodeWithSelector(selector));
        // if not implemented, or returns empty data, return empty string
        if (!success || data.length == 0) {
            return "";
        }
        // bytes32 data always has length 32
        if (data.length == 32) {
            bytes32 decoded = abi.decode(data, (bytes32));
            return bytes32ToString(decoded);
        } else if (data.length > 64) {
            return abi.decode(data, (string));
        }
        return "";
    }

    // attempts to extract the token symbol. if it does not implement symbol, returns a symbol derived from the address
    function tokenSymbol(address token) internal view returns (string memory) {
        // 0x95d89b41 = bytes4(keccak256("symbol()"))
        string memory symbol = callAndParseStringReturn(token, 0x95d89b41);
        if (bytes(symbol).length == 0) {
            // fallback to 6 uppercase hex of address
            return addressToSymbol(token);
        }
        return symbol;
    }

    // attempts to extract the token name. if it does not implement name, returns a name derived from the address
    function tokenName(address token) internal view returns (string memory) {
        // 0x06fdde03 = bytes4(keccak256("name()"))
        string memory name = callAndParseStringReturn(token, 0x06fdde03);
        if (bytes(name).length == 0) {
            // fallback to full hex of address
            return addressToName(token);
        }
        return name;
    }
}
