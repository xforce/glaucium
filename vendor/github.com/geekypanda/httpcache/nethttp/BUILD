package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "client.go",
        "handler.go",
        "response_recorder.go",
        "ruleset.go",
        "utils.go",
    ],
    tags = ["automanaged"],
    deps = [
        "//vendor/github.com/geekypanda/httpcache/cfg:go_default_library",
        "//vendor/github.com/geekypanda/httpcache/entry:go_default_library",
        "//vendor/github.com/geekypanda/httpcache/nethttp/rule:go_default_library",
        "//vendor/github.com/geekypanda/httpcache/ruleset:go_default_library",
        "//vendor/github.com/geekypanda/httpcache/uri:go_default_library",
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
        "//vendor/github.com/geekypanda/httpcache/nethttp/rule:all-srcs",
    ],
    tags = ["automanaged"],
)
