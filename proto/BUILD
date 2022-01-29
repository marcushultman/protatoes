load("@rules_proto//proto:defs.bzl", "proto_library")
load("@rules_cc//cc:defs.bzl", "cc_proto_library")

proto_library(
    name = "protatoes_proto",
    srcs = ["protatoes.proto"]
)

cc_proto_library(
    name = "protatoes_cc_proto",
    deps = [":protatoes_proto"],
    visibility = ["//visibility:public"],
)
