package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "engine.go",
        "loader.go",
        "mux.go",
        "template.go",
    ],
    tags = ["automanaged"],
    deps = [
        "//vendor/github.com/kataras/go-errors:go_default_library",
        "//vendor/github.com/valyala/bytebufferpool:go_default_library",
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
        "//vendor/github.com/kataras/go-template/amber:all-srcs",
        "//vendor/github.com/kataras/go-template/django:all-srcs",
        "//vendor/github.com/kataras/go-template/handlebars:all-srcs",
        "//vendor/github.com/kataras/go-template/html:all-srcs",
    ],
    tags = ["automanaged"],
)
