load("@io_bazel_rules_go//go:def.bzl", "go_library")

go_library(
    name = "go_default_library",
    srcs = [
        "cache.go",
        "options.go",
        "render.go",
    ],
    importpath = "github.com/xforce/ginraymond",
    visibility = ["//visibility:public"],
    deps = [
        "//vendor/github.com/aymerick/raymond:go_default_library",
        "//vendor/github.com/gin-gonic/gin:go_default_library",
        "//vendor/github.com/gin-gonic/gin/render:go_default_library",
    ],
)
