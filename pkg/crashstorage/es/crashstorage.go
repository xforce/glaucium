package es

import (
	"context"

	"github.com/xforce/glaucium/pkg/crashstorage/interface"
	"gopkg.in/olivere/elastic.v5"
)

type CrashStorage struct {
	cs_interface.CrashStorageBase
}

func (p *CrashStorage) Close() {
	ctx := context.Background()
	client, err := elastic.NewClient()
	if err != nil {
		// Handle error
		panic(err)
	}
	// Create an index
	_, err = client.CreateIndex("twitter").Do(ctx)
	if err != nil {
		// Handle error
		panic(err)
	}
}
