ginraymond
==========

Package ginraymond is a custom template renderer that can be used with
the Gin web framework: https://github.com/gin-gonic/gin, it adds support
for Handlebars style templates to your Gin application. It uses the Raymond
template library for this: https://github.com/aymerick/raymond, which
implements Handlebars style templates in pure Go.

This simple binding library is based on a similar library I built for using
Pongo2 templates with Gin: https://github.com/robvdl/pongo2gin.

Usage
-----

To use ginraymond you need to set your router.HTMLRenderer instance to
a custom renderer, this is done just after creating the Gin router.

You can either use ginraymond.Default() to create a new renderer with
default options, this assumes that templates will be located in the
"templates" directory, or you can use ginraymond.New() to specify a
custom location with your own RenderOptions struct.

To render templates from a route call c.HTML() just as you would when
rendering regular Gin templates from a route, except that instead of
having to use gin.H{} for the template context, you can use any data
type or struct supported by Raymond.

Basic Example
-------------

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/robvdl/ginraymond"
)

func main() {
    router := gin.Default()
    router.HTMLRender = ginraymond.Default()

    // Use gin.H or your own custom data types supported by Raymond.
    router.GET("/", func(c *gin.Context) {
        c.HTML(200, "hello.hbs", gin.H{"name": "world"})
    })

    router.Run(":8080")
}
```

Handlerbars Helpers Example
---------------------------

Register your handlebars helpers with Raymond the same way as in the
Raymond docs:

```go
package main

import (
    "github.com/gin-gonic/gin"
    "github.com/aymerick/raymond"
    "github.com/robvdl/ginraymond"
)

// See Raymond docs on how to implement handlebars helpers.
func bold(options *raymond.Options) raymond.SafeString {
  return raymond.SafeString("<strong>" + options.Fn() + "</strong>")
}

func main() {
    router := gin.Default()
    router.HTMLRender = ginraymond.Default()

    // Optionally register any custom Raymond handlerbars helpers.
    raymond.RegisterHelper("bold", bold)

    router.GET("/", func(c *gin.Context) {
        c.HTML(200, "hello.hbs", gin.H{"name": "world"})
    })

    router.Run(":8080")
}
```

RenderOptions
-------------

When calling ginraymond.New() instead of ginraymond.Default() you can use
these custom RenderOptions:

```go
type RenderOptions struct {
    TemplateDir string  // location of the template directory
    ContentType string  // Content-Type header used when calling c.HTML()
}
```

Template Caching
----------------

Templates will be cached if the current Gin Mode is set to anything but "debug",
this means the first time a template is used it will still load from disk, but
after that the cached template will be used from memory instead.

If he Gin Mode is set to "debug" then templates will be loaded from disk on
each request.

Raymond does not implement it's own cache, so one is implemented in ginraymond.

GoDoc
-----

https://godoc.org/github.com/robvdl/ginraymond
