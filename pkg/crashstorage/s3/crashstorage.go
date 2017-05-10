package s3

import (
	"bytes"
	"fmt"
	"io/ioutil"

	"encoding/json"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/credentials"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/s3"
	toml "github.com/pelletier/go-toml"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"
)

type CrashStorageConfig struct {
	Bucket          string
	AccessKey       string
	SecretAccessKey string
	Region          string
}

type CrashStorage struct {
	cs_interface.CrashStorageBase
	config CrashStorageConfig
	svc    *s3.S3
}

func NewCrashStorage(configFile string) (*CrashStorage, error) {
	config, err := toml.LoadFile(configFile)
	if err != nil {
		fmt.Println("Error ", err.Error())
		return nil, err
	}
	crashStorageConfig := CrashStorageConfig{}
	crashStorageConfig.Bucket = config.GetDefault("storage.s3.bucket", "glaucium").(string)
	crashStorageConfig.AccessKey = config.GetDefault("storage.s3.access_key", "meow").(string)
	crashStorageConfig.SecretAccessKey = config.GetDefault("storage.s3.secret_access_key", "meow").(string)
	crashStorageConfig.Region = config.GetDefault("storage.s3.region", "us-west-1").(string)

	creds := credentials.NewStaticCredentials(crashStorageConfig.AccessKey, crashStorageConfig.SecretAccessKey, "")
	_, err = creds.Get()
	if err != nil {
		fmt.Printf("bad credentials: %s", err)
		return nil, err
	}
	cfg := aws.NewConfig().WithRegion(crashStorageConfig.Region).WithCredentials(creds)
	svc := s3.New(session.New(), cfg)
	meow := s3.CreateBucketInput{Bucket: &crashStorageConfig.Bucket}
	svc.CreateBucket(&meow)
	crashStorage := &CrashStorage{svc: svc, config: crashStorageConfig}

	return crashStorage, nil
}

func (p *CrashStorage) SaveRawCrash(rawCrash map[string]interface{}, dumps cs_interface.DumpsMapping, crashID string) {
	var rawCrashData bytes.Buffer
	json.NewEncoder(&rawCrashData).Encode(rawCrash)
	r := bytes.NewReader(rawCrashData.Bytes())
	_, err := p.svc.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(p.config.Bucket),
		Key:    aws.String("raw_crash/" + crashID),
		Body:   r})

	if err != nil {
		fmt.Println(err)
	}

	memoryMapping := dumps.AsMemoryDumpsMapping().(*cs_interface.MemoryDumpsMapping)
	useDumpExtensionName := false
	if len(memoryMapping.M) > 1 {
		useDumpExtensionName = true
	}
	for k, v := range memoryMapping.M {
		data, _ := v.([]byte)
		r := bytes.NewReader(data)
		dumpExtensionName := ""
		if useDumpExtensionName {
			dumpExtensionName = k
		}
		_, err := p.svc.PutObject(&s3.PutObjectInput{
			Bucket: aws.String(p.config.Bucket),
			Key:    aws.String("dumps/" + crashID + dumpExtensionName),
			Body:   r})
		if err != nil {
			fmt.Println(err)
		}
	}
}

func (p *CrashStorage) SaveProcessed(processedCrash map[string]interface{}) {
	crashID, ok := processedCrash["uuid"].(string)
	if !ok {
		fmt.Println(crashID)
		fmt.Println("Tryig to save processed crash without crashID")
		return
	}

	var processedCrashData bytes.Buffer
	json.NewEncoder(&processedCrashData).Encode(processedCrash)
	r := bytes.NewReader(processedCrashData.Bytes())
	_, err := p.svc.PutObject(&s3.PutObjectInput{
		Bucket: aws.String(p.config.Bucket),
		Key:    aws.String("processed_crash/" + crashID),
		Body:   r})

	if err != nil {
		fmt.Println(err)
	}
}

func (p *CrashStorage) SaveRawAndProcessed(rawCrash map[string]interface{}, dumps cs_interface.DumpsMapping, processedCrash map[string]interface{}, crashID string) {
	p.SaveRawCrash(rawCrash, dumps, crashID)
	p.SaveProcessed(processedCrash)
}

func (p *CrashStorage) GetRawCrash(crashID string) map[string]interface{} {
	output, err := p.svc.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(p.config.Bucket),
		Key:    aws.String("raw_crash/" + crashID)})

	if err != nil {
		fmt.Println(err)
		return nil
	}
	var rawCrash map[string]interface{}
	err = json.NewDecoder(output.Body).Decode(&rawCrash)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return rawCrash
}

func (p *CrashStorage) GetRawDump(crashId string, dumpName string) []byte {

	return nil
}

func (p *CrashStorage) GetRawDumps(crashID string) cs_interface.DumpsMapping {
	output, err := p.svc.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(p.config.Bucket),
		Key:    aws.String("dumps/" + crashID)})

	if err != nil {
		fmt.Println(err)
		return nil
	}
	b, err := ioutil.ReadAll(output.Body)
	if err != nil {
		fmt.Println(err)
		return nil
	}

	dumps := cs_interface.NewMemoryDumpsMapping()
	dumps.M["upload_file_minidump"] = b
	return &dumps
}

func (p *CrashStorage) GetRawDumpsAsFiles(crashID string) cs_interface.DumpsMapping {
	memoryDumps := p.GetRawDumps(crashID).(*cs_interface.MemoryDumpsMapping)
	return memoryDumps.AsFileDumpsMapping(crashID, "/tmp/glaucium/", "dmp")
}

func (p *CrashStorage) GetProcessedCrash(crashID string) map[string]interface{} {
	output, err := p.svc.GetObject(&s3.GetObjectInput{
		Bucket: aws.String(p.config.Bucket),
		Key:    aws.String("processed_crash/" + crashID)})

	if err != nil {
		fmt.Println(err)
		return nil
	}
	var processedCrash map[string]interface{}
	err = json.NewDecoder(output.Body).Decode(&processedCrash)
	if err != nil {
		fmt.Println(err)
		return nil
	}
	return processedCrash
}

func (p *CrashStorage) Remove(crashID string) {
	p.svc.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(p.config.Bucket),
		Key:    aws.String("processed_crash/" + crashID)})
	p.svc.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(p.config.Bucket),
		Key:    aws.String("raw_crash/" + crashID)})
	p.svc.DeleteObject(&s3.DeleteObjectInput{
		Bucket: aws.String(p.config.Bucket),
		Key:    aws.String("dumps/" + crashID)})
}
