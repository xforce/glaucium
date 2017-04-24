package crashstorage

import (
	"github.com/xforce/glaucium/pkg/crashstorage/boto"
	"github.com/xforce/glaucium/pkg/crashstorage/fs"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"
)

type PolyCrashStorage struct {
	cs_interface.CrashStorageBase
	storages []cs_interface.CrashStorage
}

func (p *PolyCrashStorage)SaveRawCrash(rawCrash map[string]interface{}, dumps cs_interface.DumpsMapping, crashId string) {
	for _, storage := range p.storages {
		storage.SaveRawCrash(rawCrash, dumps, crashId)
	}
}
func (p *PolyCrashStorage)SaveProcessed(processedCrash map[string]interface{}) {
	for _, storage := range p.storages {
		storage.SaveProcessed(processedCrash)
	}
}
func (p *PolyCrashStorage)SaveRawAndProcessed(rawCrash map[string]interface{}, dumps cs_interface.DumpsMapping, processedCrash map[string]interface{}, crashID string) {
	for _, storage := range p.storages {
		storage.SaveRawAndProcessed(rawCrash, dumps, processedCrash, crashID)
	}	
}
func GetCrashStorage(name string, configFile string, additionals []string) cs_interface.CrashStorage {
	nullStorage := cs_interface.NullStorage{}
	if name == "boto" {
		return &boto.CrashStorage{}
	} else if name == "fs" {
		crashStorage, _ := fs.NewCrashStorage(configFile)
		return crashStorage
	} else if name == "poly" {
		if additionals == nil ||  len(additionals) == 0 {
			return &nullStorage 
		}
		crashStorage  := PolyCrashStorage{}
		for _, storage := range additionals {
			crashStorage.storages = append(crashStorage.storages, GetCrashStorage(storage, configFile, nil))
		}
		return &crashStorage
	}
	return &nullStorage
}
