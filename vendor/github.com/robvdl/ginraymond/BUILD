package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "cache.go",
        "options.go",
        "render.go",
    ],
    tags = ["automanaged"],
    deps = [
        "//vendor/github.com/aymerick/raymond:go_default_library",
        "//vendor/github.com/gin-gonic/gin:go_default_library",
        "//vendor/github.com/gin-gonic/gin/render:go_default_library",
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
    srcs = [":package-srcs"],
    tags = ["automanaged"],
)
