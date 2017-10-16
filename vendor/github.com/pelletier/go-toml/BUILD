load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = [
        "doc.go",
        "keysparsing.go",
        "lexer.go",
        "marshal.go",
        "match.go",
        "parser.go",
        "position.go",
        "query.go",
        "querylexer.go",
        "queryparser.go",
        "token.go",
        "toml.go",
        "tomltree_create.go",
        "tomltree_write.go",
    ],
    importpath = "github.com/pelletier/go-toml",
    visibility = ["//visibility:public"],
    deps = ["//vendor/github.com/pelletier/go-buffruneio:go_default_library"],
)
