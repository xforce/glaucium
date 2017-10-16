load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

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
    importpath = "github.com/aymerick/raymond",
    visibility = ["//visibility:public"],
    deps = [
        "//vendor/github.com/aymerick/raymond/ast:go_default_library",
        "//vendor/github.com/aymerick/raymond/parser:go_default_library",
    ],
)
