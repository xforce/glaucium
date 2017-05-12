package fs

import (
	"bytes"
	"compress/gzip"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"path"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/pelletier/go-toml"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"
)

type CrashStorageConfig struct {
	FsRoot              string
	DumpFileSuffix      string
	DumpField           string
	JsonFileSuffix      string
	JsonzFileSuffix     string
	DateBranchBase      string
	MinuteSliceInterval int
}

// TODO(alexander) :This stuff really needs some documenting comments...just take them from socorror

type CrashStorage struct {
	cs_interface.CrashStorageBase
	config CrashStorageConfig
}

func dateAndDepthFromOoid(ooid string) (time.Time, int, error) {
	day, err := strconv.Atoi(ooid[len(ooid)-2:])
	if err != nil {
		return time.Now(), 0, errors.New("Failed to get date and depth")
	}
	month, err := strconv.Atoi(ooid[len(ooid)-4 : len(ooid)-2])
	if err != nil {
		return time.Now(), 0, errors.New("Failed to get date and depth")
	}
	year, err := strconv.Atoi(ooid[len(ooid)-6 : len(ooid)-4])
	if err != nil {
		return time.Now(), 0, errors.New("Failed to get date and depth")
	}
	year = year + 2000
	depth, err := strconv.Atoi(string(ooid[len(ooid)-7]))
	if err != nil {
		depth = 2
	}

	return time.Date(year, time.Month(month), day, 0, 0, 0, 0, time.UTC), depth, nil
}

func formatDate(date time.Time) string {
	return fmt.Sprintf("%02d%02d%02d", date.Year(), date.Month(), date.Day())
}
func formatDateLong(date time.Time) string {
	return fmt.Sprintf("%04d%02d%02d", date.Year(), date.Month(), date.Day())
}

func getCurrentDate() string {
	return formatDate(time.Now())
}

func prepend(items []string, item string) []string {
	return append([]string{item}, items...)
}

func (p *CrashStorage) currentSlot() [2]string {
	now := time.Now()
	return [...]string{fmt.Sprintf("%02d", now.Hour()), fmt.Sprintf("%02d_%02d", now.Minute(), now.Second()/p.config.MinuteSliceInterval)}
}

func (p *CrashStorage) getDumpFileName(crashID string, dumpName string) string {
	if dumpName == p.config.DumpField || len(dumpName) == 0 {
		return crashID + p.config.DumpFileSuffix
	}
	return fmt.Sprintf("%s.%s%s", crashID,
		dumpName,
		p.config.DumpFileSuffix)
}

func (p *CrashStorage) getBase(crashID string) string {
	date, _, _ := dateAndDepthFromOoid(crashID)
	dateFormatted := formatDateLong(date)
	return path.Join(p.config.FsRoot, dateFormatted)
}

func getRadix(crashID string) []string {
	_, depth, _ := dateAndDepthFromOoid(crashID)
	result := make([]string, depth)
	for i := 0; i < depth; i++ {
		result[i] = crashID[i*2 : (i+1)*2]
	}
	return result
}

func (p *CrashStorage) getRadixedParentDirectory(crashID string) string {
	things := getRadix(crashID)
	things = prepend(things, p.getBase(crashID))
	things = append(things, crashID)
	return path.Join(things...)
}

func (p *CrashStorage) getDatedParentDirectory(crashID string, slot [2]string) string {
	things := make([]string, 0)
	things = append(things, p.getBase(crashID))
	things = append(things, p.config.DateBranchBase)
	things = append(things, slot[0], slot[1])
	return path.Join(things...)
}

func (p *CrashStorage) saveFiles(files map[string][]byte, crashID string) {
	parentDir := p.getRadixedParentDirectory(crashID)
	os.MkdirAll(parentDir, 0755)
	for k, v := range files {
		err := ioutil.WriteFile(path.Join(parentDir, k), v, 0644)
		if err != nil {
			fmt.Println(err)
		}
	}
}

func (p *CrashStorage) createDateToNameSymlink(crashID string, slot [2]string) error {
	radixedParentDir := p.getRadixedParentDirectory(crashID)
	things := make([]string, 0)
	for i := 0; i < len(getRadix(crashID))+1; i++ {
		things = append(things, "..")
	}
	root := path.Join(things...)
	return os.Symlink(path.Join(root, p.config.DateBranchBase, slot[0], slot[1]), path.Join(radixedParentDir, crashID))
}

func (p *CrashStorage) createNameToDateSymlink(crashID string, slot [2]string) error {
	things := make([]string, 0)
	for i := 0; i < 3; i++ {
		things = append(things, "..")
	}
	root := path.Join(things...)
	return os.Symlink(path.Join(root, path.Join(getRadix(crashID)...), crashID),
		path.Join(p.getDatedParentDirectory(crashID, slot), crashID))
}

func (p *CrashStorage) SaveRawAndProcessed(rawCrash map[string]interface{}, dumps cs_interface.DumpsMapping, processedCrash map[string]interface{}, crashID string) {
	p.SaveProcessed(processedCrash)
	p.SaveRawCrash(rawCrash, dumps, crashID)
}

func (p *CrashStorage) SaveRawCrash(rawCrash map[string]interface{}, dumps cs_interface.DumpsMapping, crashID string) {
	memoryMapping := dumps.AsMemoryDumpsMapping().(*cs_interface.MemoryDumpsMapping)
	b, err := json.Marshal(rawCrash)
	if err != nil {
		fmt.Println("Failed to encode rawCrash to json")
		return
	}
	files := make(map[string][]byte)
	files[crashID+p.config.JsonFileSuffix] = b
	for k, v := range memoryMapping.M {
		data, _ := v.([]byte)
		files[p.getDumpFileName(crashID, k)] = data
	}
	p.saveFiles(files, crashID)

	slot := p.currentSlot()
	parentDir := p.getDatedParentDirectory(crashID, slot)
	os.MkdirAll(parentDir, 0755)

	err = p.createDateToNameSymlink(crashID, slot)
	if err == nil {
		err = p.createNameToDateSymlink(crashID, slot)
	}
	if err != nil {
		// TODO(alexander): Report error
	}
}

func (p *CrashStorage) GetRawCrash(crashID string) map[string]interface{} {
	parentDir := p.getRadixedParentDirectory(crashID)
	if _, err := os.Stat(parentDir); err == nil {
		if os.IsNotExist(err) {
			// TODO(alexander): handle error
		}
		rawCrashPath := path.Join(parentDir, crashID+p.config.JsonFileSuffix)
		fmt.Println(rawCrashPath)
		data, err := ioutil.ReadFile(rawCrashPath)
		fmt.Println(err)
		if err == nil {
			var rawCrash map[string]interface{}
			json.Unmarshal(data, &rawCrash)
			return rawCrash
		}

	}
	return nil
}

func (p *CrashStorage) GetRawDump(crashID string, dumpName string) []byte {
	parentDir := p.getRadixedParentDirectory(crashID)
	if _, err := os.Stat(parentDir); err == nil {
		if os.IsNotExist(err) {
			// TODO(alexander): handle error
		}
		rawDumpPath := path.Join(parentDir, p.getDumpFileName(crashID, dumpName))
		data, err := ioutil.ReadFile(rawDumpPath)
		if err == nil {
			return data
		}

	}
	return nil
}

func (p *CrashStorage) SaveProcessed(processedCrash map[string]interface{}) {
	crashID, ok := processedCrash["uuid"].(string)
	if !ok {
		fmt.Println(crashID)
		fmt.Println("Tryig to save processed crash without crashID")
		return
	}

	// Gzip data
	var buf bytes.Buffer
	gz := gzip.NewWriter(&buf)
	json.NewEncoder(gz).Encode(processedCrash)
	gz.Close()
	files := make(map[string][]byte)
	files[crashID+p.config.JsonzFileSuffix] = buf.Bytes()
	p.saveFiles(files, crashID)
}
func (p *CrashStorage) Remove(crashID string) {
	path := path.Join(p.getRadixedParentDirectory(crashID), crashID)
	os.Remove(path)

	parentDir := p.getRadixedParentDirectory(crashID)
	if _, err := os.Stat(parentDir); err == nil {
		if os.IsNotExist(err) {
			// TODO(alexander): handle error
		}
		os.RemoveAll(parentDir)
	}
}

func (p *CrashStorage) visitMinuteSlot(minuteSlotBase string, callback func(string), wg *sync.WaitGroup) {
	crashIDs, _ := ioutil.ReadDir(minuteSlotBase)
	var subWg sync.WaitGroup
	var runningCount int
	for crashID := range crashIDs {
		wg.Add(1)
		subWg.Add(1)
		runningCount++
		go func(crashID string, minuteSlotBase string) {
			defer wg.Done()
			defer subWg.Done()
			nameDir := path.Join(minuteSlotBase, crashID)
			statResult, _ := os.Lstat(nameDir)
			if statResult.Mode()&os.ModeSymlink != 0 {
				s, _ := os.Stat(path.Join(nameDir, crashID+p.config.JsonFileSuffix))
				if !s.IsDir() {
					dateRootPath := nameDir
					callback(crashID)
					// DISABLED FOR DEBUGGING
					os.Remove(dateRootPath)
					os.Remove(nameDir)
				}
			}
		}(crashIDs[crashID].Name(), minuteSlotBase)
		// TODO(alexander): This not ideal, as we have to wait for all 10 to finish before we can start working on the next 10
		if runningCount >= 10 {
			subWg.Wait()
		}
	}
}

func greaterThanEqualsSlot(lhs [2]string, rhs [2]string) bool {
	return lhs[0] >= rhs[0] && lhs[1] >= rhs[1]
}

func (p *CrashStorage) NewCrashes(callback func(string), wg *sync.WaitGroup) {
	currentSlot := p.currentSlot()
	currentDate := getCurrentDate()

	dates, err := ioutil.ReadDir(p.config.FsRoot)
	if err == nil {
		for date := range dates {
			datedBase := path.Join(p.config.FsRoot, dates[date].Name(), p.config.DateBranchBase)
			hourSlots, err := ioutil.ReadDir(datedBase)
			if err != nil {
				continue
			}
			for hourSlotIndex := range hourSlots {
				hourSlot := hourSlots[hourSlotIndex].Name()
				skipDir := false
				hourSlotBase := path.Join(datedBase, hourSlot)
				minuteSlots, _ := ioutil.ReadDir(hourSlotBase)
				for minuteSlotIndex := range minuteSlots {
					minuteSlot := minuteSlots[minuteSlotIndex].Name()
					minuteSlotBase := path.Join(hourSlotBase, minuteSlot)
					slot := [2]string{hourSlot, minuteSlot}
					if greaterThanEqualsSlot(slot, currentSlot) && dates[date].Name() >= currentDate {
						skipDir = true
						continue
					}
					p.visitMinuteSlot(minuteSlotBase, func(crashID string) {
						callback(crashID)
					}, wg)
					os.Remove(minuteSlotBase)
				}
				h, _ := strconv.Atoi(currentSlot[0])
				h2, _ := strconv.Atoi(hourSlot)
				if !skipDir && h2 < h {
					os.Remove(hourSlotBase)
				}
			}
		}
	}
}

func (p *CrashStorage) dumpNameFromPath(pathName string) string {
	baseName := path.Base(pathName)
	dumpName := ""
	if len(baseName)-len(p.config.DumpFileSuffix) > 37 {
		dumpName = baseName[37 : len(baseName)-len(p.config.DumpFileSuffix)]
	}
	if len(dumpName) == 0 {
		dumpName = p.config.DumpField
	}
	return dumpName
}

func (p *CrashStorage) dumpNamesFromPaths(pathNames []string) []string {
	dumpNames := make([]string, 1)
	for _, pathName := range pathNames {
		dumpNames = append(dumpNames, p.dumpNameFromPath(pathName))
	}
	return dumpNames
}

func (p *CrashStorage) GetRawDumpsAsFiles(crashID string) cs_interface.DumpsMapping {
	parentDir := p.getRadixedParentDirectory(crashID)
	if _, err := os.Stat(parentDir); err != nil {
		fmt.Println(err)
	} else {
		if os.IsNotExist(err) {
			fmt.Printf("Unable to find parent dir: " + parentDir)
			// TODO(alexander): handle error
			return nil
		}

		dumps := cs_interface.NewFileDumpsMapping(false)
		dumpFileNames, _ := ioutil.ReadDir(parentDir)
		for _, dumpFileName := range dumpFileNames {
			realDumpFileName := dumpFileName.Name()
			if strings.HasPrefix(realDumpFileName, crashID) && strings.HasSuffix(realDumpFileName, p.config.DumpFileSuffix) {
				dumps.M[p.dumpNameFromPath(path.Join(parentDir, realDumpFileName))] = path.Join(parentDir, realDumpFileName)
			}
		}
		return &dumps
	}
	return nil
}

func (p *CrashStorage) GetProcessedCrash(crashID string) map[string]interface{} {
	var processedCrash interface{}
	parentDir := p.getRadixedParentDirectory(crashID)
	processedJsonPath := path.Join(parentDir, crashID+p.config.JsonzFileSuffix)
	fmt.Println(processedJsonPath)
	f, err := os.Open(processedJsonPath) // Error handling elided for brevity.
	if err != nil {
		return nil
	}
	defer f.Close()
	gz, _ := gzip.NewReader(f)
	json.NewDecoder(gz).Decode(&processedCrash)
	gz.Close()
	return processedCrash.(map[string]interface{})
}

func (p *CrashStorage) GetProcessedCrashes(time time.Time) map[string]interface{} {
	processedCrashes := make(map[string]interface{}, 0)
	dateFormatted := formatDateLong(time)
	rootDir := path.Join(p.config.FsRoot, dateFormatted)
	firstRadixDirs, _ := ioutil.ReadDir(rootDir)
	for _, firstRadixDir := range firstRadixDirs {
		if firstRadixDir.Name() != "dated" {
			secondRadixDirs, _ := ioutil.ReadDir(path.Join(rootDir, firstRadixDir.Name()))
			for _, secondRadixDir := range secondRadixDirs {
				crashIDDirs, _ := ioutil.ReadDir(path.Join(rootDir, firstRadixDir.Name(), secondRadixDir.Name()))
				for _, crashIDDir := range crashIDDirs {
					crashID := crashIDDir.Name()
					processedCrashes[crashID] = p.GetProcessedCrash(crashID)
				}
			}
		}
	}
	return processedCrashes
}

func NewCrashStorage(configFile string) (*CrashStorage, error) {
	config, err := toml.LoadFile(configFile)
	if err != nil {
		fmt.Println("Error ", err.Error())
		return nil, err
	}

	crashStorageConfig := CrashStorageConfig{}
	crashStorageConfig.FsRoot = config.GetDefault("storage.fs.fs_root", "./crashes").(string)
	crashStorageConfig.DumpField = config.GetDefault("storage.fs.dump_field", "upload_file_minidump").(string)
	crashStorageConfig.DumpFileSuffix = config.GetDefault("storage.fs.dump_file_suffix", ".dmp").(string)
	crashStorageConfig.JsonFileSuffix = config.GetDefault("storage.fs.json_file_suffix", ".json").(string)
	crashStorageConfig.JsonzFileSuffix = config.GetDefault("storage.fs.jsonz_file_suffix", ".jsonz").(string)
	crashStorageConfig.DateBranchBase = config.GetDefault("storage.fs.dated_branch_base", "dated").(string)
	crashStorageConfig.MinuteSliceInterval = config.GetDefault("storage.fs.minute_slice_interval", 4).(int)
	crashStorage := &CrashStorage{config: crashStorageConfig}
	return crashStorage, nil
}
