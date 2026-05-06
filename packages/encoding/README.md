# @universe/encoding

Encoding utilities and helpers

## Background

Centralizes the byte \<-\> base64 \<-\> base64url conversions duplicated across
different code paths. Consumers depend on one shared implementation instead of
hand-rolling `btoa`/`atob` wrappers or missing padding edge cases.
