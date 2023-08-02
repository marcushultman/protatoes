load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

http_archive(
    name = "rules_cc",
    urls = ["https://github.com/bazelbuild/rules_cc/releases/download/0.0.8/rules_cc-0.0.8.tar.gz"],
    sha256 = "ae46b722a8b8e9b62170f83bfb040cbf12adb732144e689985a66b26410a7d6f",
    strip_prefix = "rules_cc-0.0.8",
)

http_archive(
    name = "rules_proto",
    sha256 = "dc3fb206a2cb3441b485eb1e423165b231235a1ea9b031b4433cf7bc1fa460dd",
    strip_prefix = "rules_proto-5.3.0-21.7",
    urls = ["https://github.com/bazelbuild/rules_proto/archive/refs/tags/5.3.0-21.7.tar.gz"],
)

http_archive(
    name = "com_google_protobuf",
    strip_prefix = "protobuf-3.23.4",
    urls = ["https://github.com/protocolbuffers/protobuf/archive/v3.23.4.tar.gz"],
    sha256 = "c56b669e5898100142ff5936221b9c2854ce88379fd473d008607d3537500619",
)

http_archive(
    name = "emsdk",
    strip_prefix = "emsdk-ef2a8e929d5337755e9b1d1e1d4ad859dc694eee/bazel",
    url = "https://github.com/emscripten-core/emsdk/archive/ef2a8e929d5337755e9b1d1e1d4ad859dc694eee.tar.gz",
    sha256 = "52763f556d08ba0c0cde1840102e1e5fcf828b98924c4e77f629ad1d7d400933",
)

load("@rules_proto//proto:repositories.bzl", "rules_proto_dependencies", "rules_proto_toolchains")
rules_proto_dependencies()
rules_proto_toolchains()

load("@com_google_protobuf//:protobuf_deps.bzl", "protobuf_deps")
protobuf_deps()

load("@emsdk//:deps.bzl", emsdk_deps = "deps")
emsdk_deps()

load("@emsdk//:emscripten_deps.bzl", emsdk_emscripten_deps = "emscripten_deps")
emsdk_emscripten_deps()

load("@emsdk//:toolchains.bzl", "register_emscripten_toolchains")
register_emscripten_toolchains()
