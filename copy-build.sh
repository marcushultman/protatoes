#!/usr/bin/env bash

test -d bin || mkdir bin
test -f bazel-bin/wasm/wasm/api.js && cp -rf bazel-bin/wasm/wasm/api.js bin/

exit 0
