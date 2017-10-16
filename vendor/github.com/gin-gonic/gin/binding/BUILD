load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = [
        "binding.go",
        "default_validator.go",
        "form.go",
        "form_mapping.go",
        "json.go",
        "protobuf.go",
        "xml.go",
    ],
    importpath = "github.com/gin-gonic/gin/binding",
    visibility = ["//visibility:public"],
    deps = [
        "//vendor/github.com/golang/protobuf/proto:go_default_library",
        "//vendor/gopkg.in/go-playground/validator.v8:go_default_library",
    ],
)
