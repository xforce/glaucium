package es

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
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

var mapping map[string]interface{}

type MappingType struct {
	InDatabaseName string                 `json:"in_database_name"`
	Namespace      string                 `json:"namespace"`
	StorageMapping map[string]interface{} `json:"storage_mapping"`
}

func (p *CrashStorage) createIndex(esIndex string) {
	rankingsJson, _ := json.Marshal(mapping)
	ioutil.WriteFile("output.json", rankingsJson, 0644)

	// Create an index
	_, err := p.client.CreateIndex(esIndex).BodyJson(map[string]interface{}{"mappings": mapping}).Do(p.ctx)
	if err != nil && !strings.Contains(err.Error(), "index_already_exists_exception") {
		// Handle error
		panic(err)
	}

	//p.client.PutMapping().Index(esIndex).Type("crash_reports").BodyJson(mapping).Do(p.ctx)
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
	// We don't want this massive dump of stuff we don't need in elastic search...
	delete(processedCrash, "json_dump")
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
	delete(processedCrash, "json_dump")
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

	mappingFilePath := config.GetDefault("storage.es.mapping_file", "/etc/glaucium/elastic_search_mapping.json").(string)
	// Get mapping from the json file....
	if mapping == nil {
		var n map[string]MappingType
		file, e := ioutil.ReadFile(mappingFilePath)
		if e != nil {
			fmt.Printf("File error: %v\n", e)
			os.Exit(1)
		}
		json.Unmarshal(file, &n)
		properties := make(map[string]map[string]map[string]interface{}, 0)
		for _, value := range n {
			if properties[value.Namespace] == nil {
				properties[value.Namespace] = make(map[string]map[string]interface{}, 0)
			}
			if properties[value.Namespace]["properties"] == nil {
				properties[value.Namespace]["properties"] = make(map[string]interface{}, 0)
			}
			if properties[value.Namespace]["properties"][value.InDatabaseName] == nil {
				properties[value.Namespace]["properties"][value.InDatabaseName] = make(map[string]interface{}, 0)
			}
			properties[value.Namespace]["properties"][value.InDatabaseName] = value.StorageMapping
		}

		esMappingRoot := make(map[string]interface{}, 0)
		esMapping := make(map[string]interface{}, 0)
		esMapping["_all"] = map[string]interface{}{"enabled": false}
		esMapping["properties"] = properties

		esMappingRoot["crash_report"] = esMapping

		mapping = esMappingRoot
	}

	// TODO(alexander): read config etc.

	crashStorage := &CrashStorage{ctx: ctx, client: client}

	crashStorage.createIndex("meow")

	return crashStorage, nil
}
