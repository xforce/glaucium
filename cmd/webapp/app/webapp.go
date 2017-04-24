package app

import (
	"flag"
	"fmt"
	"time"

	"github.com/pelletier/go-toml"
	"github.com/xforce/glaucium/pkg/crashstorage"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"

	"gopkg.in/kataras/iris.v6"
	"gopkg.in/kataras/iris.v6/adaptors/cors"
	"gopkg.in/kataras/iris.v6/adaptors/httprouter"
	"gopkg.in/kataras/iris.v6/adaptors/view"
)

type WebAppConfig struct {
	crashStorageClass []string
}

var crashStorage cs_interface.CrashStorage

func Run() error {

	configFilePath := flag.String("config", "/etc/glaucium/config.toml", "the config location")
	config, err := toml.LoadFile(*configFilePath)
	if err != nil {
		fmt.Println("Error ", err.Error())
		return err
	}

	webappConfig := WebAppConfig{}

	/*
		new_crash_source = ["rabbitmq"]
		destination_storage = ["fs"]
		source_storage = ["fs"]
		symbol_path = test/symbols
	*/
	webappConfig.crashStorageClass = config.GetDefault("webapp.crash_storage", []string{"fs"}).([]string)

	if len(webappConfig.crashStorageClass) > 1 {
		crashStorage = crashstorage.GetCrashStorage("poly", *configFilePath, webappConfig.crashStorageClass)
	} else {
		crashStorage = crashstorage.GetCrashStorage(webappConfig.crashStorageClass[0], *configFilePath, nil)
	}

	//val := crashStorage.GetProcessedCrashes(time.Date(2017, time.Month(4), 20, 0, 0, 0, 0, time.UTC))
	//fmt.Println(val)

	// data/webapp
	app := iris.New()

	handlerBarsInstance := view.Handlebars("data/webapp/views", ".html")
	handlerBarsInstance.Layout("layout.html")
	handlerBarsInstance.Reload(true)

	app.Adapt(
		iris.DevLogger(),
		httprouter.New(),
		handlerBarsInstance,
		// Cors wrapper to the entire application, allow all origins.
		cors.New(cors.Options{AllowedOrigins: []string{"*"}}))

	// http://localhost:6300
	// Method: "GET"
	// Render ./views/home.html
	app.Get("/", func(ctx *iris.Context) {
		ctx.Render("home.html", map[string]interface{}{"Name": "Iris", "Type": "Web", "Path": "/"}, iris.RenderOptions{"gzip": true})
	})
	app.StaticWeb("/css", "data/webapp/css")
	app.StaticWeb("/js", "data/webapp/js")

	// Group routes, optionally: share middleware, template layout and custom http errors.
	userAPI := app.Party("/crashes", crashAPIMiddleware).
		Layout("home.html")
	{
		// Fire userNotFoundHandler when Not Found
		// inside http://localhost:6300/users/*anything
		userAPI.OnError(404, userNotFoundHandler)

		// http://localhost:6300/users
		// Method: "GET"
		userAPI.Get("/count", getCrashCount)

		// http://localhost:6300/users
		// Method: "POST"
		userAPI.Post("/", saveUserHandler)
	}

	// Start the server at 127.0.0.1:6300
	app.Listen(":6300")

	return nil
}

func crashAPIMiddleware(ctx *iris.Context) {
	// your code here...
	println("Request: " + ctx.Path())
	ctx.Next() // go to the next handler(s)
}

func userNotFoundHandler(ctx *iris.Context) {
	// your code here...
	ctx.HTML(iris.StatusNotFound, "<h1> User page not found </h1>")
}

func getCrashCount(ctx *iris.Context) {
	// your code here...
	val := crashStorage.GetProcessedCrashes(time.Date(2017, time.Month(4), 20, 0, 0, 0, 0, time.UTC))
	fmt.Println(val)
}

func getByIDHandler(ctx *iris.Context) {
	// take the :id from the path, parse to integer
	// and set it to the new userID local variable.
	fmt.Println(ctx)
}

func saveUserHandler(ctx *iris.Context) {
	// your code here...
}
