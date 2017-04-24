package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = ["httpcache.go"],
    tags = ["automanaged"],
    deps = [
        "//vendor/github.com/geekypanda/httpcache/fhttp:go_default_library",
        "//vendor/github.com/geekypanda/httpcache/nethttp:go_default_library",
        "//vendor/github.com/geekypanda/httpcache/server:go_default_library",
        "//vendor/github.com/valyala/fasthttp:go_default_library",
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
        "//vendor/github.com/geekypanda/httpcache/cfg:all-srcs",
        "//vendor/github.com/geekypanda/httpcache/entry:all-srcs",
        "//vendor/github.com/geekypanda/httpcache/fhttp:all-srcs",
        "//vendor/github.com/geekypanda/httpcache/nethttp:all-srcs",
        "//vendor/github.com/geekypanda/httpcache/ruleset:all-srcs",
        "//vendor/github.com/geekypanda/httpcache/server:all-srcs",
        "//vendor/github.com/geekypanda/httpcache/uri:all-srcs",
    ],
    tags = ["automanaged"],
)
