package app

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"reflect"
	"strconv"

	elastic "gopkg.in/olivere/elastic.v5"
)

var elastiClient *elastic.Client
var ctx context.Context

func InitializeEsSearch() {
	ctx = context.Background()
	// elastic.SetTraceLog(log.New(os.Stderr, "ELASTIC ", log.LstdFlags))
	elastiClient, _ = elastic.NewClient(elastic.SetTraceLog(log.New(os.Stderr, "ELASTIC ", log.LstdFlags)))
}

type MappingType struct {
	InDatabaseName string                 `json:"in_database_name"`
	Namespace      string                 `json:"namespace"`
	StorageMapping map[string]interface{} `json:"storage_mapping"`
	HasFullVersion bool                   `json:"has_full_version"`
	HasKeyword     bool                   `json:"has_keyword"`
}

var mapping map[string]MappingType

func getFieldName(field string, useKeyword bool) string {
	if mapping == nil {
		file, e := ioutil.ReadFile("/etc/glaucium/elastic_search_mapping.json")
		if e != nil {
			fmt.Printf("File error: %v\n", e)
			os.Exit(1)
		}
		json.Unmarshal(file, &mapping)
	}

	if val, ok := mapping[field]; ok {
		finalFieldName := val.Namespace + "." + val.InDatabaseName
		if useKeyword && val.HasKeyword {
			finalFieldName += ".keyword"
		}
		if val.HasFullVersion && !val.HasKeyword {
			finalFieldName += ".full"
		}
		//do something here
		return finalFieldName
	}
	panic(field)
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
			} else {
				fmt.Println(columnStr)
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
		from = val.(int)
	}
	if val, ok := jsonData["results_size"]; ok {
		size = val.(int)
	}
	if size > 1000 {
		size = 1000
	}
	return from, size
}

func buildFilters(jsonData map[string]interface{}) []elastic.Query {
	result := make([]elastic.Query, 0)
	if val, ok := jsonData["filters"]; ok {
		filtersInterface, _ := val.([]interface{})
		for _, filter := range filtersInterface {
			filterMap, ok := filter.(map[string]interface{})
			if ok {
				fmt.Println(filterMap)
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
						result = append(result, query)
					}
				} else {
					query := elastic.NewTermQuery(getFieldName(filterMap["name"].(string), false), filterMap["value"].(string))
					result = append(result, query)
				}
			} else {
				fmt.Println("Failed to convert filter is", reflect.TypeOf(filter),
					"expected map[string]interface{}")
			}

		}
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
	return result
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
				agg := elastic.NewHistogramAggregation().Interval(float64(1000)).Field(getFieldName(histogram, true))
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
	searchQuery.Filter(buildFilters(m)...)
	search := elastiClient.Search().
		Index([]string{}...).
		Query(searchQuery).
		Pretty(true)

	if from > 0 {
		search = search.From(from)
	}
	if size > 0 {
		search = search.Size(size)
	}

	search, aggregateKeys := buildAggregations(search, m)
	searchResult, err := search.
		Do(ctx)
	if err != nil {
		panic(err)
	}
	fmt.Println(searchResult.Hits)
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
				fmt.Println(t)
				//requestedFields
				resultHits = append(resultHits, t)
			}
		}
	}
	return map[string]interface{}{"hits": resultHits, "facets": resultAggregations, "histograms": resultHistograms}
}
