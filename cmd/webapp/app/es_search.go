package app

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"reflect"
	"strconv"

	toml "github.com/pelletier/go-toml"

	elastic "gopkg.in/olivere/elastic.v5"
)

var elastiClient *elastic.Client
var ctx context.Context

type MappingType struct {
	InDatabaseName string                 `json:"in_database_name"`
	Namespace      string                 `json:"namespace"`
	StorageMapping map[string]interface{} `json:"storage_mapping"`
	HasFullVersion bool                   `json:"has_full_version"`
	HasKeyword     bool                   `json:"has_keyword"`
}

var mapping map[string]MappingType

func InitializeEsSearch(configFilePath string) {

	config, err := toml.LoadFile(configFilePath)
	if err != nil {
		fmt.Println("Error ", err.Error())
	}
	mappingFilePath := config.GetDefault("storage.es.mapping_file_webapp", "/etc/glaucium/elastic_search_mapping_webapp.json").(string)

	ctx = context.Background()
	// elastic.SetTraceLog(log.New(os.Stderr, "ELASTIC ", log.LstdFlags))
	elastiClient, _ = elastic.NewClient()

	// Get mapping from the json file....
	file, e := ioutil.ReadFile(mappingFilePath)
	if e != nil {
		fmt.Printf("File error: %v\n", e)
		os.Exit(1)
	}
	json.Unmarshal(file, &mapping)
	properties := make(map[string]map[string]map[string]interface{}, 0)
	for _, value := range mapping {
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

	//res, _ := elastiClient.IndexNames()
	// Disabled because of breaking change in the mapping
	//if len(res) > 0 {
	// 	for _, indexName := range res {
	// 		_, err := elastiClient.PutMapping().Index(indexName).Type("crash_report").BodyJson(esMappingRoot).Do(context.TODO())
	// 		if err != nil {
	// 			fmt.Println(err)
	// 		}
	// 	}
	//}
}

func getFieldName(field string, useKeyword bool) string {
	if val, ok := mapping[field]; ok {
		finalFieldName := val.Namespace + "." + val.InDatabaseName
		if useKeyword && val.HasKeyword {
			finalFieldName += ".keyword"
		}
		if val.HasFullVersion && !val.HasKeyword {
			finalFieldName += ".full"
		}
		return finalFieldName
	}
	fmt.Println("Failed to map type")
	return field
}

func buildFields(jsonData map[string]interface{}) []string {
	columns := make([]string, 0)
	if val, ok := jsonData["columns"]; ok {
		//do something here
		columnsInterface, _ := val.([]interface{})
		for _, column := range columnsInterface {
			columnStr, ok := column.(string)
			if !ok {
				fmt.Println("invalid column type")
			}
			columns = append(columns, getFieldName(columnStr, false))
		}
	}
	return columns
}

func buildPaginate(jsonData map[string]interface{}) (int, int) {
	from := int(0)
	size := int(100)
	if val, ok := jsonData["results_from"]; ok {
		fromF, ok := val.(float64)
		if ok {
			from = int(fromF)
		}
	}
	if val, ok := jsonData["results_size"]; ok {
		sizeF, ok := val.(float64)
		if ok {
			size = int(sizeF)
		}
	}
	if size > 10000 {
		size = 10000
	}
	return from, size
}

func buildFilters(searchQuery *elastic.BoolQuery, jsonData map[string]interface{}) {
	subFilters := make(map[string][]elastic.Query, 0)
	if val, ok := jsonData["filters"]; ok {
		filtersInterface, _ := val.([]interface{})
		for _, filter := range filtersInterface {
			filterMap, ok := filter.(map[string]interface{})
			if ok {
				if val, ok := filterMap["operator"]; ok {
					if operatorStr, ok := val.(string); ok {
						query := elastic.NewRangeQuery(getFieldName(filterMap["name"].(string), false))
						if operatorStr == "gte" {
							query.Gte(filterMap["value"].(string))
						} else if operatorStr == "gt" {
							query.Gt(filterMap["value"].(string))
						} else if operatorStr == "lte" {
							query.Lte(filterMap["value"].(string))
						} else if operatorStr == "lt" {
							query.Lt(filterMap["value"].(string))
						}
						searchQuery = searchQuery.Filter(query)
					}
				} else {
					fieldName := getFieldName(filterMap["name"].(string), true)
					query := elastic.NewTermQuery(fieldName, filterMap["value"].(string))
					subFilters[fieldName] = append(subFilters[fieldName], query)
				}
			} else {
				fmt.Println("Failed to convert filter is", reflect.TypeOf(filter),
					"expected map[string]interface{}")
			}
		}
	}
	for _, v := range subFilters {
		query := elastic.NewBoolQuery()
		for _, q := range v {
			query = query.Should(q)
		}
		searchQuery.Filter(query)
	}
	/*
		{
			"filters": [
				{
					"name": "date",
					"operator": "gte",
					"value" : "2016-09-25T14:38:00.000Z"
				},
				{
					"name": "date",
					"operator": "lt",
					"value" : "2017-04-30T14:38:00.000Z"
				},
				{
					"name": "product",
					"value": "Test"
				}
			],
			"sort": [{
				"field": "date",
				"asc": true
			}],
			"facets": [
				"signature",
			]
		}
	*/
}

type histogramKey struct {
	histogram     string
	term          string
	subHistograms []histogramKey
}

type aggregationKeys struct {
	term      []string
	histogram []histogramKey
}

func buildAggregations(search *elastic.SearchService, jsonData map[string]interface{}) (*elastic.SearchService, aggregationKeys) {
	facetsSize := int(50)
	keys := aggregationKeys{}
	if val, ok := jsonData["facets_size"]; ok {
		facetsSize = val.(int)
		if facetsSize > 10000 {
			facetsSize = 10000
		}
	}
	if val, ok := jsonData["facets"]; ok {
		//do something here
		facetsInterface, _ := val.([]interface{})
		for _, facet := range facetsInterface {
			facetStr, ok := facet.(string)
			if ok {
				agg := elastic.NewTermsAggregation().Field(getFieldName(facetStr, true)).Size(facetsSize)
				search = search.Aggregation(facetStr, agg)
				keys.term = append(keys.term, facetStr)
			}
		}
	}

	// TODO(alexander): Clean this up to use recursive function so we can have more levels of histograms/facets
	if val, ok := jsonData["histograms"]; ok {
		histogramsInterface, _ := val.(map[string]interface{})
		for histogram, histogramValue := range histogramsInterface {
			histogramStr, ok := histogramValue.(string)
			if ok {
				agg := elastic.NewHistogramAggregation().Interval(float64(1000 * 60 * 60 * 24)).Field(getFieldName(histogram, true))
				histogramKeyValue := histogramKey{histogram: histogram}

				if len(histogramStr) > 0 {
					subAgg := elastic.NewTermsAggregation().Field(getFieldName(histogramStr, true)).Size(facetsSize)
					agg = agg.SubAggregation(histogramStr, subAgg)
					histogramKeyValue.subHistograms = append(histogramKeyValue.subHistograms, histogramKey{term: histogramStr})
				}
				search = search.Aggregation(histogram, agg)
				keys.histogram = append(keys.histogram, histogramKeyValue)
			}
		}
	}
	/*
		"facets_size": 40 // Optional
		"facets": [
				"signature",
		]
		"histograms": {
			"date": "version",
			"version": ""
		}
	*/

	return search, keys
}

func histogramToMap(searchAggregations *elastic.Aggregations, histogramKeys []histogramKey) map[string]interface{} {
	resultHistograms := make(map[string]interface{}, 0)
	for _, val := range histogramKeys {
		if len(val.histogram) > 0 {
			agg, ok := searchAggregations.Histogram(val.histogram)
			if ok {
				thingy := make([]interface{}, 0)
				for _, bucket := range agg.Buckets {
					keyString := ""
					if bucket.KeyAsString != nil {
						keyString = *bucket.KeyAsString
					} else {
						keyString = strconv.FormatFloat(bucket.Key, 'f', 6, 64)
					}
					tmpMap := map[string]interface{}{"count": bucket.DocCount, "term": keyString}

					subHistos := histogramToMap(&bucket.Aggregations, val.subHistograms)
					if len(subHistos) > 0 {
						tmpMap["facets"] = subHistos
					}
					thingy = append(thingy, tmpMap)
				}
				resultHistograms[val.histogram] = thingy
			}
		} else if len(val.term) > 0 {
			agg, ok := searchAggregations.Terms(val.term)
			if ok {
				thingy := make([]interface{}, 0)
				for _, bucket := range agg.Buckets {
					keyString := ""
					if bucket.KeyAsString != nil {
						keyString = *bucket.KeyAsString
					} else {
						keyString = bucket.Key.(string)
					}
					tmpMap := map[string]interface{}{"count": bucket.DocCount, "term": keyString}

					subHistos := histogramToMap(&bucket.Aggregations, val.subHistograms)
					if len(subHistos) > 0 {
						tmpMap["facets"] = subHistos
					}
					thingy = append(thingy, tmpMap)
				}
				resultHistograms[val.term] = thingy
			}
		}
	}
	return resultHistograms
}

func DoSearch(m map[string]interface{}) map[string]interface{} {
	searchQuery := elastic.NewBoolQuery()

	//requestedFields := buildFields(m)

	from, size := buildPaginate(m)
	buildFilters(searchQuery, m)
	search := elastiClient.Search().
		Index([]string{}...).
		Query(searchQuery).
		Pretty(true)

	if val, ok := m["sort"]; ok {
		sortObject, ok := val.(map[string]interface{})
		if ok {
			if field, ok := sortObject["field"]; ok {
				asc := true
				if ascJ, ok := sortObject["asc"]; ok {
					asc = ascJ.(bool)
				}
				search = search.Sort(getFieldName(field.(string), true), asc)
			}
		}
	}

	search = search.From(from)
	search = search.Size(size)

	search, aggregateKeys := buildAggregations(search, m)
	searchResult, err := search.
		Do(ctx)
	if err != nil {
		panic(err)
	}
	resultHits := make([]interface{}, 0)
	resultAggregations := make(map[string]interface{}, 0)
	resultHistograms := make(map[string]interface{}, 0)

	for _, val := range aggregateKeys.term {
		agg, ok := searchResult.Aggregations.Terms(val)
		if ok {
			thingy := make([]interface{}, 0)
			for _, bucket := range agg.Buckets {
				thingy = append(thingy, map[string]interface{}{"count": bucket.DocCount, "term": bucket.Key})
			}
			resultAggregations[val] = thingy
		}
	}

	resultHistograms = histogramToMap(&searchResult.Aggregations, aggregateKeys.histogram)

	if searchResult.Hits.TotalHits > 0 {
		for _, hit := range searchResult.Hits.Hits {
			var t map[string]interface{}
			err := json.Unmarshal(*hit.Source, &t)
			if err == nil {
				resultHits = append(resultHits, t)
			}
		}
	}
	docCount, _ := elastiClient.Count().Do(ctx)
	return map[string]interface{}{"hits": resultHits, "facets": resultAggregations, "histograms": resultHistograms, "total": docCount}
}

func GetVersions() []string {
	return []string{}
}
