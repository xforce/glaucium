package(default_visibility = ["//visibility:public"])

licenses(["notice"])

load(
    "@io_bazel_rules_go//go:def.bzl",
    "go_library",
)

go_library(
    name = "go_default_library",
    srcs = [
        "adaptor.go",
        "amber.go",
        "django.go",
        "handlebars.go",
        "html.go",
        "pug.go",
    ],
    tags = ["automanaged"],
    deps = [
        "//vendor/github.com/Joker/jade:go_default_library",
        "//vendor/github.com/kataras/go-template:go_default_library",
        "//vendor/github.com/kataras/go-template/amber:go_default_library",
        "//vendor/github.com/kataras/go-template/django:go_default_library",
        "//vendor/github.com/kataras/go-template/handlebars:go_default_library",
        "//vendor/github.com/kataras/go-template/html:go_default_library",
        "//vendor/gopkg.in/kataras/iris.v6:go_default_library",
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
