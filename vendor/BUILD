package(default_visibility = ["//visibility:public"])

licenses(["notice"])

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
        "//vendor/github.com/BurntSushi/toml:all-srcs",
        "//vendor/github.com/aymerick/raymond:all-srcs",
        "//vendor/github.com/gin-gonic/gin:all-srcs",
        "//vendor/github.com/golang/protobuf/proto:all-srcs",
        "//vendor/github.com/manucorporat/sse:all-srcs",
        "//vendor/github.com/mattn/go-isatty:all-srcs",
        "//vendor/github.com/pelletier/go-buffruneio:all-srcs",
        "//vendor/github.com/pelletier/go-toml:all-srcs",
        "//vendor/github.com/robvdl/ginraymond:all-srcs",
        "//vendor/github.com/xforce/ginraymond:all-srcs",
        "//vendor/golang.org/x/net/context:all-srcs",
        "//vendor/golang.org/x/sys/unix:all-srcs",
        "//vendor/gopkg.in/go-playground/validator.v8:all-srcs",
        "//vendor/gopkg.in/olivere/elastic.v5:all-srcs",
        "//vendor/gopkg.in/yaml.v2:all-srcs",
    ],
    tags = ["automanaged"],
)
