load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = [
        "parser.go",
        "whitespace.go",
    ],
    importpath = "github.com/aymerick/raymond/parser",
    visibility = ["//visibility:public"],
    deps = [
        "//vendor/github.com/aymerick/raymond/ast:go_default_library",
        "//vendor/github.com/aymerick/raymond/lexer:go_default_library",
    ],
)
