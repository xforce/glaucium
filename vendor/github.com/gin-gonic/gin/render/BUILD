load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = [
        "data.go",
        "html.go",
        "json.go",
        "redirect.go",
        "render.go",
        "text.go",
        "xml.go",
        "yaml.go",
    ],
    importpath = "github.com/gin-gonic/gin/render",
    visibility = ["//visibility:public"],
    deps = ["//vendor/gopkg.in/yaml.v2:go_default_library"],
)
