'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var $schema = "http://json-schema.org/draft-07/schema#";
var $id = "https://uniswap.org/tokenlist.schema.json";
var title = "Uniswap Token List";
var description = "Schema for lists of tokens compatible with the Uniswap Interface";
var definitions = {
	Version: {
		type: "object",
		description: "The version of the list, used in change detection",
		examples: [
			{
				major: 1,
				minor: 0,
				patch: 0
			}
		],
		additionalProperties: false,
		properties: {
			major: {
				type: "integer",
				description: "The major version of the list. Must be incremented when tokens are removed from the list or token addresses are changed.",
				minimum: 0,
				examples: [
					1,
					2
				]
			},
			minor: {
				type: "integer",
				description: "The minor version of the list. Must be incremented when tokens are added to the list.",
				minimum: 0,
				examples: [
					0,
					1
				]
			},
			patch: {
				type: "integer",
				description: "The patch version of the list. Must be incremented for any changes to the list.",
				minimum: 0,
				examples: [
					0,
					1
				]
			}
		},
		required: [
			"major",
			"minor",
			"patch"
		]
	},
	TagIdentifier: {
		type: "string",
		description: "The unique identifier of a tag",
		minLength: 1,
		maxLength: 10,
		pattern: "^[\\w]+$",
		examples: [
			"compound",
			"stablecoin"
		]
	},
	TagDefinition: {
		type: "object",
		description: "Definition of a tag that can be associated with a token via its identifier",
		additionalProperties: false,
		properties: {
			name: {
				type: "string",
				description: "The name of the tag",
				pattern: "^[ \\w]+$",
				minLength: 1,
				maxLength: 20
			},
			description: {
				type: "string",
				description: "A user-friendly description of the tag",
				pattern: "^[ \\w\\.,]+$",
				minLength: 1,
				maxLength: 200
			}
		},
		required: [
			"name",
			"description"
		],
		examples: [
			{
				name: "Stablecoin",
				description: "A token with value pegged to another asset"
			}
		]
	},
	TokenInfo: {
		type: "object",
		description: "Metadata for a single token in a token list",
		additionalProperties: false,
		properties: {
			chainId: {
				type: "integer",
				description: "The chain ID of the Ethereum network where this token is deployed",
				minimum: 1,
				examples: [
					1,
					42
				]
			},
			address: {
				type: "string",
				description: "The checksummed address of the token on the specified chain ID",
				pattern: "^0x[a-fA-F0-9]{40}$",
				examples: [
					"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
				]
			},
			decimals: {
				type: "integer",
				description: "The number of decimals for the token balance",
				minimum: 0,
				maximum: 255,
				examples: [
					18
				]
			},
			name: {
				type: "string",
				description: "The name of the token",
				minLength: 1,
				maxLength: 40,
				pattern: "^[ \\w.'+\\-%/À-ÖØ-öø-ÿ]+$",
				examples: [
					"USD Coin"
				]
			},
			symbol: {
				type: "string",
				description: "The symbol for the token; must be alphanumeric",
				pattern: "^[a-zA-Z0-9+\\-%/]+$",
				minLength: 1,
				maxLength: 20,
				examples: [
					"USDC"
				]
			},
			logoURI: {
				type: "string",
				description: "A URI to the token logo asset; if not set, interface will attempt to find a logo based on the token address; suggest SVG or PNG of size 64x64",
				format: "uri",
				examples: [
					"ipfs://QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM"
				]
			},
			tags: {
				type: "array",
				description: "An array of tag identifiers associated with the token; tags are defined at the list level",
				items: {
					$ref: "#/definitions/TagIdentifier"
				},
				maxLength: 10,
				examples: [
					"stablecoin",
					"compound"
				]
			}
		},
		required: [
			"chainId",
			"address",
			"decimals",
			"name",
			"symbol"
		]
	}
};
var type = "object";
var additionalProperties = false;
var properties = {
	name: {
		type: "string",
		description: "The name of the token list",
		minLength: 1,
		maxLength: 20,
		pattern: "^[\\w ]+$",
		examples: [
			"My Token List"
		]
	},
	timestamp: {
		type: "string",
		format: "date-time",
		description: "The timestamp of this list version; i.e. when this immutable version of the list was created"
	},
	version: {
		$ref: "#/definitions/Version"
	},
	tokens: {
		type: "array",
		description: "The list of tokens included in the list",
		items: {
			$ref: "#/definitions/TokenInfo"
		},
		minItems: 1,
		maxItems: 1000
	},
	keywords: {
		type: "array",
		description: "Keywords associated with the contents of the list; may be used in list discoverability",
		items: {
			type: "string",
			description: "A keyword to describe the contents of the list",
			minLength: 1,
			maxLength: 20,
			pattern: "^[\\w ]+$",
			examples: [
				"compound",
				"lending",
				"personal tokens"
			]
		},
		maxItems: 20,
		uniqueItems: true
	},
	tags: {
		type: "object",
		description: "A mapping of tag identifiers to their name and description",
		propertyNames: {
			$ref: "#/definitions/TagIdentifier"
		},
		additionalProperties: {
			$ref: "#/definitions/TagDefinition"
		},
		maxProperties: 20,
		examples: [
			{
				stablecoin: {
					name: "Stablecoin",
					description: "A token with value pegged to another asset"
				}
			}
		]
	},
	logoURI: {
		type: "string",
		description: "A URI for the logo of the token list; prefer SVG or PNG of size 256x256",
		format: "uri",
		examples: [
			"ipfs://QmXfzKRvjZz3u5JRgC4v5mGVbm9ahrUiB4DgzHBsnWbTMM"
		]
	}
};
var required = [
	"name",
	"timestamp",
	"version",
	"tokens"
];
var tokenlist_schema = {
	$schema: $schema,
	$id: $id,
	title: title,
	description: description,
	definitions: definitions,
	type: type,
	additionalProperties: additionalProperties,
	properties: properties,
	required: required
};

/**
 * Comparator function that allows sorting version from lowest to highest
 * @param versionA version A to compare
 * @param versionB version B to compare
 * @returns -1 if versionA comes before versionB, 0 if versionA is equal to version B, and 1 if version A comes after version B
 */
function versionComparator(versionA, versionB) {
  if (versionA.major < versionB.major) {
    return -1;
  } else if (versionA.major > versionB.major) {
    return 1;
  } else if (versionA.minor < versionB.minor) {
    return -1;
  } else if (versionA.minor > versionB.minor) {
    return 1;
  } else if (versionA.patch < versionB.patch) {
    return -1;
  } else if (versionA.patch > versionB.patch) {
    return 1;
  } else {
    return 0;
  }
}

/**
 * Returns true if versionB is an update over versionA
 */

function isVersionUpdate(base, update) {
  return versionComparator(base, update) < 0;
}

(function (VersionUpgrade) {
  VersionUpgrade[VersionUpgrade["NONE"] = 0] = "NONE";
  VersionUpgrade[VersionUpgrade["PATCH"] = 1] = "PATCH";
  VersionUpgrade[VersionUpgrade["MINOR"] = 2] = "MINOR";
  VersionUpgrade[VersionUpgrade["MAJOR"] = 3] = "MAJOR";
})(exports.VersionUpgrade || (exports.VersionUpgrade = {}));
/**
 * Return the upgrade type from the base version to the update version.
 * Note that downgrades and equivalent versions are both treated as `NONE`.
 * @param base base list
 * @param update update to the list
 */


function getVersionUpgrade(base, update) {
  if (update.major > base.major) {
    return exports.VersionUpgrade.MAJOR;
  }

  if (update.major < base.major) {
    return exports.VersionUpgrade.NONE;
  }

  if (update.minor > base.minor) {
    return exports.VersionUpgrade.MINOR;
  }

  if (update.minor < base.minor) {
    return exports.VersionUpgrade.NONE;
  }

  return update.patch > base.patch ? exports.VersionUpgrade.PATCH : exports.VersionUpgrade.NONE;
}

/**
 * compares two token info key values
 * this subset of full deep equal functionality does not work on objects or object arrays
 * @param a comparison item a
 * @param b comparison item b
 */
function compareTokenInfoProperty(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    return a.every(function (el, i) {
      return b[i] === el;
    });
  }

  return false;
}
/**
 * Computes the diff of a token list where the first argument is the base and the second argument is the updated list.
 * @param base base list
 * @param update updated list
 */


function diffTokenLists(base, update) {
  var indexedBase = base.reduce(function (memo, tokenInfo) {
    if (!memo[tokenInfo.chainId]) memo[tokenInfo.chainId] = {};
    memo[tokenInfo.chainId][tokenInfo.address] = tokenInfo;
    return memo;
  }, {});
  var newListUpdates = update.reduce(function (memo, tokenInfo) {
    var _indexedBase$tokenInf;

    var baseToken = (_indexedBase$tokenInf = indexedBase[tokenInfo.chainId]) === null || _indexedBase$tokenInf === void 0 ? void 0 : _indexedBase$tokenInf[tokenInfo.address];

    if (!baseToken) {
      memo.added.push(tokenInfo);
    } else {
      var changes = Object.keys(tokenInfo).filter(function (s) {
        return s !== 'address' && s !== 'chainId';
      }).filter(function (s) {
        return !compareTokenInfoProperty(tokenInfo[s], baseToken[s]);
      });

      if (changes.length > 0) {
        if (!memo.changed[tokenInfo.chainId]) {
          memo.changed[tokenInfo.chainId] = {};
        }

        memo.changed[tokenInfo.chainId][tokenInfo.address] = changes;
      }
    }

    if (!memo.index[tokenInfo.chainId]) {
      var _memo$index$tokenInfo;

      memo.index[tokenInfo.chainId] = (_memo$index$tokenInfo = {}, _memo$index$tokenInfo[tokenInfo.address] = true, _memo$index$tokenInfo);
    } else {
      memo.index[tokenInfo.chainId][tokenInfo.address] = true;
    }

    return memo;
  }, {
    added: [],
    changed: {},
    index: {}
  });
  var removed = base.reduce(function (list, curr) {
    if (!newListUpdates.index[curr.chainId] || !newListUpdates.index[curr.chainId][curr.address]) {
      list.push(curr);
    }

    return list;
  }, []);
  return {
    added: newListUpdates.added,
    changed: newListUpdates.changed,
    removed: removed
  };
}

/**
 * Returns the minimum version bump for the given list
 * @param baseList the base list of tokens
 * @param updatedList the updated list of tokens
 */

function minVersionBump(baseList, updatedList) {
  var diff = diffTokenLists(baseList, updatedList);
  if (diff.removed.length > 0) return exports.VersionUpgrade.MAJOR;
  if (diff.added.length > 0) return exports.VersionUpgrade.MINOR;
  if (Object.keys(diff.changed).length > 0) return exports.VersionUpgrade.PATCH;
  return exports.VersionUpgrade.NONE;
}

/**
 * Returns the next version of the list given a base version and the upgrade type
 * @param base current version
 * @param bump the upgrade type
 */

function nextVersion(base, bump) {
  switch (bump) {
    case exports.VersionUpgrade.NONE:
      return base;

    case exports.VersionUpgrade.MAJOR:
      return {
        major: base.major + 1,
        minor: 0,
        patch: 0
      };

    case exports.VersionUpgrade.MINOR:
      return {
        major: base.major,
        minor: base.minor + 1,
        patch: 0
      };

    case exports.VersionUpgrade.PATCH:
      return {
        major: base.major,
        minor: base.minor,
        patch: base.patch + 1
      };
  }
}

exports.diffTokenLists = diffTokenLists;
exports.getVersionUpgrade = getVersionUpgrade;
exports.isVersionUpdate = isVersionUpdate;
exports.minVersionBump = minVersionBump;
exports.nextVersion = nextVersion;
exports.schema = tokenlist_schema;
exports.versionComparator = versionComparator;
//# sourceMappingURL=token-lists.cjs.development.js.map
