load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = [
        "doc.go",
        "isatty_linux.go",
        "isatty_others.go",
    ] + select({
        "@io_bazel_rules_go//go/platform:darwin_amd64": [
            "isatty_bsd.go",
        ],
        "@io_bazel_rules_go//go/platform:windows_amd64": [
            "isatty_windows.go",
        ],
        "//conditions:default": [],
    }),
    importpath = "github.com/mattn/go-isatty",
    visibility = ["//visibility:public"],
)
