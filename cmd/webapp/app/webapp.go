package app

import (
	"errors"
	"flag"
	"fmt"
	"net/http"
	"path"
	"strconv"

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
	crashStorage = crashstorage.GetCrashStorage(config.GetDefault("webapp.crashstorage", "fs").(string), "/etc/glaucium/config.toml", nil)

	InitializeEsSearch()

	webappDataPath := config.GetDefault("webapp.webapp_data", "/usr/share/glaucium/webapp/data").(string)

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
	renderOptions.TemplateDir = path.Join(webappDataPath, "views")
	renderOptions.Layout = "layout.html"

	router.HTMLRender = ginraymond.New(&renderOptions)
	router.Static("/css", path.Join(webappDataPath, "css"))
	router.Static("/js", path.Join(webappDataPath, "js"))
	router.Static("/images", path.Join(webappDataPath, "images"))

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "home.html", gin.H{"title": "Home", "extra_js": "home.js", "extra_css": "home.css"})
	})

	api := router.Group("/api")
	{
		api.POST("/search", searchApiPostHandler)
		api.GET("/report/:crashID", reportApiHandler)
		api.GET("/report/:crashID/download/raw", reportDownloadRawDumpHandler)
		api.GET("/versions", versionsApiHandler)
		api.GET("/products", productsApiHandler)
		api.GET("/platforms", platformsApiHandler)
	}
	router.GET("/search", searchViewHandler)
	router.GET("/report/:crashID", reportViewHandler)
	router.GET("/signature/:signature", signatureViewHandler)
	router.NoRoute(func(c *gin.Context) {
		c.HTML(404, "404.html", gin.H{"title": "Page Not Found!", "extra_css": "404.css"})
	})
	return router.Run(":" + strconv.Itoa(config.GetDefault("webapp.port", 6300).(int)))
}

func reportViewHandler(c *gin.Context) {
	crashID := c.Param("crashID")
	c.HTML(http.StatusOK, "report.html", gin.H{"title": "Report", "extra_js": "report.js", "crashID": crashID})
}

func signatureViewHandler(c *gin.Context) {
	signature := c.Param("signature")
	c.HTML(http.StatusOK, "signature.html", gin.H{"title": "Report", "extra_js": "signature.js", "signature": signature})
}

func searchViewHandler(c *gin.Context) {
	c.HTML(http.StatusOK, "search.html", gin.H{"title": "Report", "extra_js": "search.js", "extra_css": "search.css"})
}

func searchApiGetHandler(c *gin.Context) {
	// if we want this.....
	// maybe just return aggregations for things
	// ....does that make sense?!
	// I am confused
}

func versionsApiHandler(c *gin.Context) {

}

func productsApiHandler(c *gin.Context) {
	c.JSON(200, []string{"Meow"})
}

func platformsApiHandler(c *gin.Context) {

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
	dumps := crashStorage.GetRawDumps(crashID).(*cs_interface.MemoryDumpsMapping)
	c.Header("Content-Disposition", `inline; filename="`+crashID+`.dmp"`)
	c.Header("Content-Length", strconv.Itoa(len(dumps.M["upload_file_minidump"].([]byte))))
	c.Data(200, "application/octet-stream", dumps.M["upload_file_minidump"].([]byte))
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
