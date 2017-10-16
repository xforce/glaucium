load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = ["gzip.go"],
    importpath = "github.com/gin-contrib/gzip",
    visibility = ["//visibility:public"],
    deps = ["//vendor/github.com/gin-gonic/gin:go_default_library"],
)
