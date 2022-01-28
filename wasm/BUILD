load("@emsdk//emscripten_toolchain:wasm_rules.bzl", "wasm_cc_binary")

WASM_LINKOPTS = [
  "--bind",
  "--no-entry",
  "-sMODULARIZE",
  "-sEXPORT_ES6",
  "-sSINGLE_FILE",
  "-sNO_DYNAMIC_EXECUTION"
]

cc_binary(
  name = "api",
  srcs = ["api.cpp"],
  additional_linker_inputs = ["polyfill.js"],
  linkopts = WASM_LINKOPTS + [
    "--extern-pre-js=$(location :polyfill.js)"
  ],
  deps = [
    "@com_google_protobuf//:protoc_lib",
  ],
)

wasm_cc_binary(
    name = "wasm",
    cc_target = ":api",
)
