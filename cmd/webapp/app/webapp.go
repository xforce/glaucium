package app

import (
	"errors"
	"flag"
	"fmt"
	"net/http"
	"path"
	"strconv"
	"strings"

	"github.com/aymerick/raymond"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"github.com/pelletier/go-toml"
	"github.com/xforce/ginraymond"
	"github.com/xforce/glaucium/pkg/crashstorage"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"
)

type WebAppConfig struct {
}

var crashStorage cs_interface.CrashStorage
var esCrashStorage cs_interface.CrashStorage
var collectorTargetStorage cs_interface.CrashStorage

func bold(options *raymond.Options) raymond.SafeString {
	return raymond.SafeString("<strong>" + options.Fn() + "</strong>")
}

func Run() error {
	configFilePath := flag.String("config", "/etc/glaucium/config.toml", "the config location")
	flag.Parse()
	config, err := toml.LoadFile(*configFilePath)
	if err != nil {
		fmt.Println(config)
		fmt.Println("Error ", err.Error())
		return err
	}
	fmt.Println(*configFilePath)
	crashStorage = crashstorage.GetCrashStorage(config.GetDefault("webapp.crashstorage", "fs").(string), *configFilePath, nil)
	collectorStorageClassesI := config.GetDefault("collector.storage.classes", []string{"fs"}).([]interface{})
	var collectorStorageClasses []string
	for _, v := range collectorStorageClassesI {
		collectorStorageClasses = append(collectorStorageClasses, v.(string))
	}
	if len(collectorStorageClasses) > 1 {
		collectorTargetStorage = crashstorage.GetCrashStorage("poly", *configFilePath, collectorStorageClasses)
	} else {
		collectorTargetStorage = crashstorage.GetCrashStorage(collectorStorageClasses[0], *configFilePath, nil)
	}
	esCrashStorage = crashstorage.GetCrashStorage("es", *configFilePath, nil)

	InitializeEsSearch(*configFilePath)

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
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	renderOptions := ginraymond.RenderOptions{}
	renderOptions.TemplateDir = path.Join(webappDataPath, "dist")

	router.HTMLRender = ginraymond.New(&renderOptions)
	router.Static("/dist", path.Join(webappDataPath, "dist"))

	// This is the default route, as we are doing client side routing for thigns
	// We don't really need handling for 404 here
	router.NoRoute(func(c *gin.Context) {
		fmt.Println(*c)
		if strings.HasPrefix(c.Request.RequestURI, "/api") {
			c.HTML(404, "404.html", gin.H{"title": "Page Not Found!", "extra_css": "404.css"})
		} else {
			c.HTML(http.StatusOK, "default.html", gin.H{})
		}
	})

	api := router.Group("/api")
	{
		api.POST("/search", searchApiPostHandler)
		api.GET("/report/:crashID/reprocess", reportReprocessApiHandler)
		api.GET("/report/:crashID", reportApiHandler)
		api.GET("/report/:crashID/delete", reportDeleteApiHandler)
		api.GET("/report/:crashID/download/raw", reportDownloadRawDumpHandler)
		api.GET("/versions", versionsApiHandler)
		api.GET("/products", productsApiHandler)
		api.GET("/platforms", platformsApiHandler)
	}

	return router.Run(config.GetDefault("webapp.host", "").(string) + ":" + strconv.Itoa(config.GetDefault("webapp.port", 6300).(int)))
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
	c.HTML(http.StatusOK, "search.html", gin.H{"title": "Report", "extra_js": "search.js"})
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

func reportDeleteApiHandler(c *gin.Context) {
	crashID := c.Param("crashID")
	esCrashStorage.Remove(crashID)
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

func reportReprocessApiHandler(c *gin.Context) {
	crashID := c.Param("crashID")
	rawCrash := crashStorage.GetRawCrash(crashID)
	if rawCrash == nil {
		c.Status(404)
		return
	}
	dumpsMapping := crashStorage.GetRawDumps(crashID).(*cs_interface.MemoryDumpsMapping)
	collectorTargetStorage.SaveRawCrash(rawCrash, dumpsMapping, crashID)
}
