package app

import (
	"context"
	"errors"
	"flag"
	"fmt"

	"github.com/aymerick/raymond"
	"github.com/gin-gonic/gin"
	"github.com/pelletier/go-toml"
	"github.com/robvdl/ginraymond"
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
	router.HTMLRender = ginraymond.Default()
	raymond.RegisterHelper("bold", bold)
	router.Run(":6300")
	return nil
}
