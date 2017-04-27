package app

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"net/http"

	"github.com/aymerick/raymond"
	"github.com/gin-gonic/gin"
	"github.com/pelletier/go-toml"
	"github.com/xforce/ginraymond"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"

	elastic "gopkg.in/olivere/elastic.v5"
)

type WebAppConfig struct {
}

var crashStorage cs_interface.CrashStorage

func bold(options *raymond.Options) raymond.SafeString {
	return raymond.SafeString("<strong>" + options.Fn() + "</strong>")
}

func Run() error {

	configFilePath := flag.String("config", "/etc/glaucium/config.toml", "the config location")
	config, err := toml.LoadFile(*configFilePath)
	if err != nil {
		fmt.Println(config)
		fmt.Println("Error ", err.Error())
		return err
	}

	ctx := context.Background()
	client, err := elastic.NewClient()
	fmt.Println(ctx)
	fmt.Println(client)
	if err != nil {
		fmt.Println("Error ", err.Error())
		// Handle error
		return errors.New(fmt.Sprint("Failed to create elastic search client", err))
	}

	webappConfig := WebAppConfig{}
	fmt.Println(webappConfig)

	// data/webapp
	router := gin.Default()
	renderOptions := ginraymond.RenderOptions{}
	renderOptions.TemplateDir = "data/webapp/views"
	renderOptions.Layout = "layout.html"

	router.HTMLRender = ginraymond.New(&renderOptions)
	router.Static("/css", "data/webapp/css")
	router.Static("/js", "data/webapp/js")
	raymond.RegisterHelper("bold", bold)
	router.GET("/home", func(c *gin.Context) {
		c.HTML(http.StatusOK, "home.html", gin.H{
			"title": "Main website",
		})
	})

	return router.Run(":6300")
}
