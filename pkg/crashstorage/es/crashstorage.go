package es

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/pelletier/go-toml"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"
	"gopkg.in/olivere/elastic.v5"
)

type CrashStorage struct {
	cs_interface.CrashStorageBase

	ctx    context.Context
	client *elastic.Client
}

func (p *CrashStorage) Close() {
	p.client.Stop()
}

func (p *CrashStorage) createIndex(esIndex string) {
	// Create an index
	_, err := p.client.CreateIndex(esIndex).Do(p.ctx)
	if err != nil && !strings.Contains(err.Error(), "index_already_exists_exception") {
		// Handle error
		panic(err)
	}
}

func (p *CrashStorage) SaveRawAndProcessed(rawCrash map[string]interface{}, dumps cs_interface.DumpsMapping, processedCrash map[string]interface{}, crashID string) {
	dateProcessed, ok := processedCrash["date_processed"].(time.Time)
	if !ok {
		fmt.Println("Failed to get processed date, abort")
		return
	}
	_, week := dateProcessed.ISOWeek()
	esIndex := dateProcessed.Format("2006")
	esIndex = fmt.Sprintf("crash_reports_%s%d", esIndex, week)
	crashDocument := make(map[string]interface{}, 3)
	crashDocument["crash_id"] = crashID
	crashDocument["processed_crash"] = processedCrash
	crashDocument["raw_crash"] = rawCrash
	p.createIndex(esIndex)
	_, err := p.client.Index().Index(esIndex).Type("crash_report").Id(crashID).BodyJson(crashDocument).Refresh("true").Do(p.ctx)
	if err != nil {
		// Handle error
		panic(err)
	}
}

func (p *CrashStorage) SaveProcessed(processedCrash map[string]interface{}) {
	// Add a document to the index
	fmt.Println("Saving processed dump")
	crashID, _ := processedCrash["uuid"].(string)
	dateProcessed, ok := processedCrash["date_processed"].(time.Time)
	if !ok {
		fmt.Println("Failed to get processed date, abort")
	}
	_, week := dateProcessed.ISOWeek()
	esIndex := dateProcessed.Format("2006")
	esIndex = fmt.Sprintf("crash_reports_%s%d", esIndex, week)
	crashDocument := make(map[string]interface{}, 3)
	crashDocument["crash_id"] = crashID
	crashDocument["processed_crash"] = processedCrash
	p.createIndex(esIndex)
	_, err := p.client.Index().Index(esIndex).Type("crash_report").Id(crashID).BodyJson(crashDocument).Refresh("true").Do(p.ctx)
	if err != nil {
		// Handle error
		panic(err)
	}
}

func NewCrashStorage(configFile string) (*CrashStorage, error) {
	config, err := toml.LoadFile(configFile)
	if err != nil {
		fmt.Println(config)
		fmt.Println("Error ", err.Error())
		return nil, err
	}

	ctx := context.Background()
	client, err := elastic.NewClient()
	if err != nil {
		fmt.Println("Error ", err.Error())
		// Handle error
		return nil, errors.New(fmt.Sprint("Failed to create elastic search client", err))
	}

	// TODO(alexander): read config etc.

	crashStorage := &CrashStorage{ctx: ctx, client: client}

	crashStorage.createIndex("meow")

	return crashStorage, nil
}
