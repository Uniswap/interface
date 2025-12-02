#!/bin/sh

REACT_NATIVE_XCODE="../../../node_modules/react-native/scripts/react-native-xcode.sh"
DATADOG_XCODE="../../../node_modules/.bin/datadog-ci react-native xcode"

/bin/sh -c "$DATADOG_XCODE $REACT_NATIVE_XCODE"
