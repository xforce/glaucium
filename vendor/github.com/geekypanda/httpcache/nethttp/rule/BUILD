package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "chained.go",
        "conditional.go",
        "header.go",
        "not_satisfied.go",
        "rule.go",
        "satisfied.go",
        "validator.go",
    ],
    tags = ["automanaged"],
    deps = ["//vendor/github.com/geekypanda/httpcache/ruleset:go_default_library"],
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
