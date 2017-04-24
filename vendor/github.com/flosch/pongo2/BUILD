package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "context.go",
        "doc.go",
        "error.go",
        "filters.go",
        "filters_builtin.go",
        "helpers.go",
        "lexer.go",
        "nodes.go",
        "nodes_html.go",
        "nodes_wrapper.go",
        "parser.go",
        "parser_document.go",
        "parser_expression.go",
        "pongo2.go",
        "tags.go",
        "tags_autoescape.go",
        "tags_block.go",
        "tags_comment.go",
        "tags_cycle.go",
        "tags_extends.go",
        "tags_filter.go",
        "tags_firstof.go",
        "tags_for.go",
        "tags_if.go",
        "tags_ifchanged.go",
        "tags_ifequal.go",
        "tags_ifnotequal.go",
        "tags_import.go",
        "tags_include.go",
        "tags_lorem.go",
        "tags_macro.go",
        "tags_now.go",
        "tags_set.go",
        "tags_spaceless.go",
        "tags_ssi.go",
        "tags_templatetag.go",
        "tags_widthratio.go",
        "tags_with.go",
        "template.go",
        "template_loader.go",
        "template_sets.go",
        "value.go",
        "variable.go",
    ],
    tags = ["automanaged"],
    deps = ["//vendor/github.com/juju/errors:go_default_library"],
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
