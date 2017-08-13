package app

import (
	"crypto/rand"
	"errors"
	"flag"
	"fmt"
	"io"
	"net/http"
	"strconv"
	"time"

	"github.com/BurntSushi/toml"
	"github.com/xforce/glaucium/pkg/crashstorage"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"
)

var crashStorage cs_interface.CrashStorage

type StorageConfig struct {
	Classes []string
}
type CollectorConfig struct {
	Port    int
	Host    string
	Storage StorageConfig
}

type Config struct {
	Collector CollectorConfig
}

func newUUID() string {
	uuid := make([]byte, 16)
	n, err := io.ReadFull(rand.Reader, uuid)
	if n != len(uuid) || err != nil {
		return ""
	}
	// variant bits; see section 4.1.1
	uuid[8] = uuid[8]&^0xc0 | 0x80
	// version 4 (pseudo-random); see section 4.1.3
	uuid[6] = uuid[6]&^0xf0 | 0x40
	return fmt.Sprintf("%x-%x-%x-%x-%x", uuid[0:4], uuid[4:6], uuid[6:8], uuid[8:10], uuid[10:])
}

func createNewOoid(timestamp time.Time, depth int) string {
	uuid := newUUID()
	return fmt.Sprintf("%s%d%02d%02d%02d", uuid[:len(uuid)-7], depth, timestamp.Year()%100, timestamp.Month(), timestamp.Day())
}

func getRawCrashFromForm(w http.ResponseWriter, r *http.Request) (map[string]interface{}, cs_interface.DumpsMapping, error) {
	rawCrash := make(map[string]interface{})
	dumpsMapping := cs_interface.NewMemoryDumpsMapping()
	r.ParseForm()
	const _24K = (1 << 20) * 24
	if err := r.ParseMultipartForm(_24K); nil != err {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return nil, nil, errors.New("Failed to parse multipart form")
	}
	for key, value := range r.MultipartForm.Value {
		if len(value) == 1 {
			rawCrash[key] = value[0]
		} else {
			rawCrash[key] = value
		}
	}
	for key, value := range r.MultipartForm.File {
		for i := range value {
			file, err := value[i].Open()
			defer file.Close()
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return nil, nil, errors.New("Failed to open uploaded file")
			}
			fileSize, _ := file.Seek(0, io.SeekEnd)
			file.Seek(0, io.SeekStart)
			data := make([]byte, fileSize)
			file.Read(data)
			dumpsMapping.M[key] = data
		}

	}
	return rawCrash, &dumpsMapping, nil
}

func handleDumpSubmit(w http.ResponseWriter, r *http.Request) {
	if r.Method == "POST" {
		rawCrash, dumpsMapping, err := getRawCrashFromForm(w, r)
		if err != nil {
			fmt.Println(err)

		} else {
			crashID := createNewOoid(time.Now(), 2)
			rawCrash["uuid"] = crashID
			crashStorage.SaveRawCrash(rawCrash, dumpsMapping, crashID)
			w.WriteHeader(http.StatusOK)
		}
	}
}

func Run() error {
	var conf Config
	configFilePath := flag.String("config", "/etc/glaucium/config.toml", "the config location")
	flag.Parse()
	if _, err := toml.DecodeFile(*configFilePath, &conf); err != nil {
		return err
	}
	if len(conf.Collector.Storage.Classes) > 1 {
		crashStorage = crashstorage.GetCrashStorage("poly", *configFilePath, conf.Collector.Storage.Classes)
	} else {
		crashStorage = crashstorage.GetCrashStorage(conf.Collector.Storage.Classes[0], *configFilePath, nil)
	}
	http.HandleFunc("/submit", handleDumpSubmit)
	fmt.Println("Starting collector on " + conf.Collector.Host + ":" + strconv.FormatInt(int64(conf.Collector.Port), 10))
	return http.ListenAndServe(conf.Collector.Host+":"+strconv.FormatInt(int64(conf.Collector.Port), 10), nil)
}
