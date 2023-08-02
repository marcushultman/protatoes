load("@emsdk//emscripten_toolchain:wasm_rules.bzl", "wasm_cc_binary")
load("@rules_cc//cc:defs.bzl", "cc_binary")

WASM_LINKOPTS = [
  "--bind",
  "--no-entry",
  "-Oz",
  "-sMODULARIZE",
  "-sEXPORT_ES6",
  "-sSINGLE_FILE",
  "-sNO_DYNAMIC_EXECUTION"
]

cc_binary(
  name = "api",
  srcs = ["api.cpp"],
  linkopts = WASM_LINKOPTS,
  deps = [
    "//proto:protatoes_cc_proto",
    "@com_google_protobuf//:protobuf",
  ],
)

wasm_cc_binary(
    name = "wasm",
    cc_target = ":api",
)
