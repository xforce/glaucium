package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "copy.go",
        "crc32_amd64.go",
        "crc32_amd64.s",
        "deflate.go",
        "dict_decoder.go",
        "huffman_bit_writer.go",
        "huffman_code.go",
        "inflate.go",
        "reverse_bits.go",
        "snappy.go",
        "token.go",
    ],
    tags = ["automanaged"],
    deps = ["//vendor/github.com/klauspost/cpuid:go_default_library"],
)

filegroup(
    name = "package-srcs",
    srcs = glob(["**"]),
    tags = ["automanaged"],
    visibility = ["//visibility:private"],
)

filegroup(
    name = "all-srcs",
    srcs = [":package-srcs"],
    tags = ["automanaged"],
)
