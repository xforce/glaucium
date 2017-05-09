package app

import (
	"errors"
	"flag"
	"fmt"
	"net/http"

	"github.com/aymerick/raymond"
	"github.com/gin-gonic/gin"
	"github.com/pelletier/go-toml"
	"github.com/xforce/ginraymond"
	"github.com/xforce/glaucium/pkg/crashstorage"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"
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

	crashStorage = crashstorage.GetCrashStorage("fs", "/etc/glaucium/config.toml", nil)

	InitializeEsSearch()

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
	router.Static("/images", "data/webapp/images")

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "home.html", gin.H{"title": "Home", "extra_js": "home.js", "extra_css": "home.css"})
	})

	api := router.Group("/api")
	{
		api.POST("/search", searchApiPostHandler)
		api.GET("/report/:crashID", reportApiHandler)
		api.GET("/report/:crashID/download/raw", reportDownloadRawDumpHandler)
	}
	router.GET("/search", searchViewHandler)
	report := router.Group("/report")
	{
		report.GET("/:crashID", reportViewHandler)
	}
	router.NoRoute(func(c *gin.Context) {
		c.HTML(404, "404.html", gin.H{"title": "Page Not Found!", "extra_css": "404.css"})
	})

	return router.Run(":6300")
}

func reportViewHandler(c *gin.Context) {
	crashID := c.Param("crashID")
	c.HTML(http.StatusOK, "report.html", gin.H{"title": "Report", "extra_js": "report.js", "crashID": crashID})
}

func searchViewHandler(c *gin.Context) {
	c.HTML(http.StatusOK, "search.html", gin.H{"title": "Report", "extra_js": "search.js"})
}

func searchApiGetHandler(c *gin.Context) {
	// if we want this.....
	// maybe just return aggregations for things
	// ....does that make sense?!
	// I am confused
}

func searchApiPostHandler(c *gin.Context) {
	// build all the filters
	var m map[string]interface{}

	if c.BindJSON(&m) == nil {
		searchResult := DoSearch(m)
		c.JSON(200, searchResult)
	} else {
		fmt.Println("Failed to bind json")
	}
}

func reportDownloadRawDumpHandler(c *gin.Context) {
	crashID := c.Param("crashID")
	dumps := crashStorage.GetRawDumpsAsFiles(crashID)
	c.Header("Content-Disposition", `inline; filename="`+crashID+`.dmp"`)
	c.File(dumps.(*cs_interface.FileDumpsMapping).M["upload_file_minidump"].(string))
}

func reportApiHandler(c *gin.Context) {
	//elastiClient
	crashID := c.Param("crashID")
	processedDumpResult := crashStorage.GetProcessedCrash(crashID)
	if processedDumpResult == nil {
		c.Status(404)
		return
	}
	c.JSON(200, processedDumpResult)
}
