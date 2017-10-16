load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = [
        "auth.go",
        "context.go",
        "debug.go",
        "deprecated.go",
        "errors.go",
        "fs.go",
        "gin.go",
        "logger.go",
        "mode.go",
        "path.go",
        "recovery.go",
        "response_writer.go",
        "routergroup.go",
        "tree.go",
        "utils.go",
    ],
    importpath = "github.com/gin-gonic/gin",
    visibility = ["//visibility:public"],
    deps = [
        "//vendor/github.com/gin-gonic/gin/binding:go_default_library",
        "//vendor/github.com/gin-gonic/gin/render:go_default_library",
        "//vendor/github.com/manucorporat/sse:go_default_library",
        "//vendor/github.com/mattn/go-isatty:go_default_library",
        "//vendor/golang.org/x/net/context:go_default_library",
    ],
)
