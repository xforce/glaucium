package main

import (
	"fmt"
	"os"

	"github.com/xforce/glaucium/cmd/processor/app"
)

func main() {
	if err := app.Run(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	os.Exit(0)
}
