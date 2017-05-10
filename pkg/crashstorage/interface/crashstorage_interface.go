package cs_interface

import (
	"fmt"
	"io/ioutil"
	"math/rand"
	"os"
	"path"
	"sync"
	"time"
)

type DumpsMapping interface {
	AsMemoryDumpsMapping() DumpsMapping
	AsFileDumpsMapping(crashId string, tempPath string, dumpFileSuffix string) DumpsMapping
}

type CrashStorage interface {
	Close()
	SaveRawCrash(rawCrash map[string]interface{}, dumps DumpsMapping, crashId string)
	SaveProcessed(processedCrash map[string]interface{})
	SaveRawAndProcessed(rawCrash map[string]interface{}, dumps DumpsMapping, processedCrash map[string]interface{}, crashID string)
	GetRawCrash(crashId string) map[string]interface{}
	GetRawDump(crashId string, dumpName string) []byte
	GetRawDumps(crashID string) DumpsMapping
	GetRawDumpsAsFiles(crashId string) DumpsMapping
	GetProcessedCrash(crashID string) map[string]interface{}
	Remove(crashId string)
	NewCrashes(callback func(string), wg *sync.WaitGroup)
	AckCrash(crashID string)
	GetProcessedCrashes(time time.Time) map[string]interface{}
}

type CrashStorageBase struct{}

func (p *CrashStorageBase) Close() {}
func (p *CrashStorageBase) SaveRawCrash(rawCrash map[string]interface{}, dumps DumpsMapping, crashId string) {
}
func (p *CrashStorageBase) SaveProcessed(processedCrash map[string]interface{}) {}
func (p *CrashStorageBase) SaveRawAndProcessed(rawCrash map[string]interface{}, dumps DumpsMapping, processedCrash map[string]interface{}, crashID string) {
}
func (p *CrashStorageBase) GetRawCrash(crashId string) map[string]interface{}         { return nil }
func (p *CrashStorageBase) GetRawDump(crashId string, dumpName string) []byte         { return nil }
func (p *CrashStorageBase) GetRawDumps(crashID string) DumpsMapping                   { return nil }
func (p *CrashStorageBase) GetRawDumpsAsFiles(crashId string) DumpsMapping            { return nil }
func (p *CrashStorageBase) GetProcessedCrash(crashID string) map[string]interface{}   { return nil }
func (p *CrashStorageBase) Remove(crashId string)                                     {}
func (p *CrashStorageBase) NewCrashes(callback func(string), wg *sync.WaitGroup)      {}
func (p *CrashStorageBase) AckCrash(crashID string)                                   {}
func (p *CrashStorageBase) GetProcessedCrashes(time time.Time) map[string]interface{} { return nil }

type NullStorage struct {
	CrashStorageBase
}

type MemoryDumpsMapping struct {
	M map[string]interface{}
}

type FileDumpsMapping struct {
	M                  map[string]interface{}
	deleteFilesOnClose bool
}

func (p *FileDumpsMapping) Close() {
	if p.deleteFilesOnClose {
		for _, v := range p.M {
			os.Remove(v.(string))
		}
	}
}

func NewMemoryDumpsMapping() MemoryDumpsMapping {
	return MemoryDumpsMapping{M: make(map[string]interface{})}
}
func NewFileDumpsMapping(deleteFilesOnClose bool) FileDumpsMapping {
	return FileDumpsMapping{M: make(map[string]interface{}), deleteFilesOnClose: deleteFilesOnClose}
}

func (p *MemoryDumpsMapping) AsFileDumpsMapping(crashId string, tempPath string, dumpFileSuffix string) DumpsMapping {
	mapping := NewFileDumpsMapping(true)
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	for k, v := range p.M {
		dumpPathName := path.Join(tempPath, fmt.Sprint(crashId, ".", k, ".", r.Int(), ".TEMPORARY", dumpFileSuffix))
		mapping.M[k] = dumpPathName
		data, _ := v.([]byte)
		ioutil.WriteFile(dumpPathName, data, 0644)
	}

	return &mapping
}

func (p *MemoryDumpsMapping) AsMemoryDumpsMapping() DumpsMapping {
	return p
}

func (p *FileDumpsMapping) AsFileDumpsMapping(crashId string, tempPath string, dumpFileSuffix string) DumpsMapping {
	return p
}

func (p *FileDumpsMapping) AsMemoryDumpsMapping() DumpsMapping {
	mapping := NewMemoryDumpsMapping()
	for k, v := range p.M {
		str, _ := v.(string)
		dat, err := ioutil.ReadFile(str)
		if err != nil {
			fmt.Println(err)
		} else {
			mapping.M[k] = dat
		}
	}
	return &mapping
}
