package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "data_frame.go",
        "escape.go",
        "eval.go",
        "helper.go",
        "partial.go",
        "raymond.go",
        "string.go",
        "template.go",
        "utils.go",
    ],
    tags = ["automanaged"],
    deps = [
        "//vendor/github.com/aymerick/raymond/ast:go_default_library",
        "//vendor/github.com/aymerick/raymond/parser:go_default_library",
    ],
)

filegroup(
    name = "package-srcs",
    srcs = glob(["**"]),
    tags = ["automanaged"],
    visibility = ["//visibility:private"],
)

filegroup(
    name = "all-srcs",
    srcs = [
        ":package-srcs",
        "//vendor/github.com/aymerick/raymond/ast:all-srcs",
        "//vendor/github.com/aymerick/raymond/lexer:all-srcs",
        "//vendor/github.com/aymerick/raymond/parser:all-srcs",
    ],
    tags = ["automanaged"],
)
