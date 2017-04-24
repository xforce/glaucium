package app

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"regexp"
	"strings"
	"time"

	"github.com/pelletier/go-toml"
	"github.com/xforce/glaucium/pkg/crashstorage"
	"github.com/xforce/glaucium/pkg/crashstorage/interface"
)

var sourceCrashStorage cs_interface.CrashStorage
var destinationCrashStorage cs_interface.CrashStorage
var newCrashCrashStorage cs_interface.CrashStorage

type ProcessorConfig struct {
	SourceStorage            []string
	DestinationStorage       []string
	NewCrashSource           string
	SymbolPath               string
	RemoveRawDumpFromSource  bool
	SaveRawDumpInDestination bool
}

func extractCrashingThread(rawCrash map[string]interface{}, processedCrash map[string]interface{}) map[string]interface{} {
	return processedCrash
}

func extractCPUInfo(rawCrash map[string]interface{}, processedCrash map[string]interface{}) map[string]interface{} {
	return processedCrash
}

func extractOSInfo(rawCrash map[string]interface{}, processedCrash map[string]interface{}) map[string]interface{} {
	return processedCrash
}

func extractOSPrettyVersion(rawCrash map[string]interface{}, processedCrash map[string]interface{}) map[string]interface{} {
	return processedCrash
}

func extractMissingSymbols(rawCrash map[string]interface{}, processedCrash map[string]interface{}) map[string]interface{} {
	return processedCrash
}

func collapse(functionSignature string, openString string, replacementOpenString string, closeString string, replacementCloseString string) string {

	return ""
}

func normalizeSignature(frame map[string]interface{}) string {
	module, ok := frame["module"].(string)
	if !ok {
		module = ""
	}
	function, ok := frame["function"].(string)
	if !ok {
		function = ""
	}
	file, ok := frame["file"].(string)
	if !ok {
		file = ""
	}
	line, ok := frame["line"].(string)
	if !ok {
		line = ""
	}
	moduleOffset, ok := frame["module_offset"].(string)
	if !ok {
		moduleOffset = ""
	}
	offset, ok := frame["offset"].(string)
	if !ok {
		offset = ""
	}
	normalized, ok := frame["normalized"].(string)
	if !ok {
		normalized = ""
	}

	if len(normalized) > 0 {
		return normalized
	}

	if len(function) > 0 {
		function = collapse(function, "<", "<", ">", "T>")

		// TOOD(alexander): siglist
		function = fmt.Sprintf("%s:%s", function, line)
		fixupSpace, _ := regexp.Compile(" (?=[\\*&,])")
		fixupComma, _ := regexp.Compile(",(?! )")
		function = fixupSpace.ReplaceAllString(function, "")
		function = fixupComma.ReplaceAllString(function, ", ")
		return function
	}
	if len(file) > 0 && len(line) > 0 {
		file = strings.TrimRight(file, "/\\")
		if strings.Contains(file, "\\") {
			file = strings.Split(file, "\\")[0]
		} else {
			file = strings.Split(file, "/")[0]
		}
		return fmt.Sprintf("%s#%s", file, line)
	}
	if len(module) == 0 && len(moduleOffset) == 0 && len(offset) > 0 {
		return fmt.Sprintf("@%s", offset)
	}
	return fmt.Sprintf("%s@%s", module, moduleOffset)
}

func createFramelist(crashingThreadMapping map[string]interface{}) []string {
	frameSignatureList := make([]string, 0)

	frames, ok := crashingThreadMapping["frames"].([]interface{})
	if ok {
		if len(frames) > 40 {
			frames = frames[:40]
		}
		for _, frameI := range frames {
			frame, ok := frameI.(map[string]interface{})
			if !ok {
				return nil
			}
			normalizedSignature, ok := frame["normalized"].(string)
			normalizedSignature = normalizeSignature(frame)
			if !ok {
				frame["normalized"] = normalizedSignature
			}
			frameSignatureList = append(frameSignatureList, normalizedSignature)
		}
	}

	return frameSignatureList
}

func getFileContents(path string) []string {
	file, err := os.Open(path)
	if err != nil {
		log.Fatal(err)
	}
	defer file.Close()
	lines := make([]string, 0)
	scanner := bufio.NewScanner(file)
	i := 0
	for scanner.Scan() {
		line := scanner.Text()
		line = strings.TrimSpace(line)
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}
		_, err := regexp.Compile(line)
		if err != nil {
			fmt.Printf("Invalid regex in %s at line %d\n", path, i)
			return nil
		}
		lines = append(lines, line)
		i++
	}
	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}
	return lines
}

func internalGenerateSignature(signatureList []string, crashedThread *int) (string, []string) {
	signatureNotes := make([]string, 0)
	//sentinelLocations := make([]string, 0)

	newSignatureList := make([]string, 0)
	for _, aSignature := range signatureList {
		/*  # If the signature matches the irrelevant signatures regex,
		    # skip to the next frame.
		    if self.irrelevant_signature_re.match(a_signature):
		        continue
		*/
		// glaucium := []string{"glaucium", ""}
		// trimDllSignatureRe, _ := regexp.Compile(strings.Join(glaucium, "|"))
		// if trimDllSignatureRe.MatchString(aSignature) {
		// 	aSignature = strings.Split(aSignature, "@")[0]
		// 	if len(newSignatureList) > 0 && newSignatureList[len(newSignatureList)-1] == aSignature {
		// 		continue
		// 	}
		// }
		/*
			# If the signature matches the trim dll signatures regex,
			# rewrite it to remove all but the module name.
			if self.trim_dll_signature_re.match(a_signature):
				a_signature = a_signature.split('@')[0]

				# If this trimmed DLL signature is the same as the previous
				# frame's, we do not want to add it.
				if (
					new_signature_list and
					a_signature == new_signature_list[-1]
				):
					continue
		*/

		newSignatureList = append(newSignatureList, aSignature)
		// TODO(alexander): This is horrible
		prefixSignatureRe, _ := regexp.Compile(strings.Join(getFileContents("data/etc/glaucium/prefix_signature_re.txt"), "|"))
		if !prefixSignatureRe.MatchString(aSignature) {
			break
		}
	}

	signature := strings.Join(newSignatureList, " | ")
	if len(signature) == 0 {
		if crashedThread == nil {
			signatureNotes = append(signatureNotes, "No signature could be created because we do not know which thread crashed")
			signature = "EMPTY: no crashing thread identified"
		} else {
			signatureNotes = append(signatureNotes, fmt.Sprintf("No proper signature could be created because no good data for the crashing thread (%d) was found", *crashedThread))
			if len(signatureList) > 0 {
				signature = signatureList[0]
			} else {
				signature = "EMPTY: no frame data available"
			}
		}
	}
	return signature, signatureNotes
}

func generateSignature(rawCrash map[string]interface{}, processedCrash map[string]interface{}) map[string]interface{} {

	jsonDump, ok := processedCrash["json_dump"].(map[string]interface{})
	if !ok {
		return processedCrash
	}
	crashInfo, ok := jsonDump["crash_info"].(map[string]interface{})
	if !ok {
		return processedCrash
	}
	crashingThread, ok := crashInfo["crashing_thread"].(float64)
	if !ok {
		return processedCrash
	}
	threads, ok := jsonDump["threads"].([]interface{})
	if ok {
		signatureList := createFramelist(threads[int(crashingThread)].(map[string]interface{}))
		crashingThreadInt := int(crashingThread)
		signature, signatureNotes := internalGenerateSignature(signatureList, &crashingThreadInt)
		processedCrash["proto_signature"] = strings.Join(signatureList, " | ")
		processedCrash["signature"] = signature
		fmt.Println(signature)
		if signatureNotes != nil {
			processedCrash["processor_notes"] = signatureNotes
		}
	}

	return processedCrash
}

func processCrash(rawCrash map[string]interface{}, dumps *cs_interface.FileDumpsMapping) map[string]interface{} {

	processedCrash := make(map[string]interface{})
	processedCrash["uuid"] = rawCrash["uuid"]
	for k, v := range dumps.M {
		if !strings.HasPrefix(k, "upload_file_minidump") {
			continue
		}
		cmd := exec.Command("vendor/breakpad/stackwalker", "--raw-json glaucium.json", v.(string))
		var out bytes.Buffer
		cmd.Stdout = &out
		cmd.Run()
		var f map[string]interface{}
		json.Unmarshal(out.Bytes(), &f)
		processedCrash["json_dump"] = f
	}

	processedCrash["product"] = rawCrash["ProductName"]
	processedCrash["version"] = rawCrash["Version"]
	processedCrash["productid"] = rawCrash["ProductID"]
	processedCrash["notes"] = rawCrash["Notes"]

	processedCrash = extractCrashingThread(rawCrash, processedCrash)
	processedCrash = extractCPUInfo(rawCrash, processedCrash)
	processedCrash = extractOSInfo(rawCrash, processedCrash)
	processedCrash = extractOSPrettyVersion(rawCrash, processedCrash)
	processedCrash = extractMissingSymbols(rawCrash, processedCrash)
	processedCrash = generateSignature(rawCrash, processedCrash)

	// Anything beyond this point will be done by the user using some for of hook into this thing here....
	// Maybe just call an external program?

	return processedCrash
}

func Run() error {
	configFilePath := flag.String("config", "/etc/glaucium/config.toml", "the config location")
	config, err := toml.LoadFile(*configFilePath)
	if err != nil {
		fmt.Println("Error ", err.Error())
		return err
	}

	processorConfig := ProcessorConfig{}

	/*
		new_crash_source = ["rabbitmq"]
		destination_storage = ["fs"]
		source_storage = ["fs"]
		symbol_path = glaucium/test/symbols
	*/
	processorConfig.SourceStorage = config.GetDefault("processor.source_storage", []string{"fs"}).([]string)
	processorConfig.DestinationStorage = config.GetDefault("processor.destination_storage", []string{"fs"}).([]string)
	processorConfig.NewCrashSource = config.GetDefault("processor.new_crash_source", "fs").(string)
	processorConfig.SymbolPath = config.GetDefault("processor.symbol_path", "").(string)
	processorConfig.RemoveRawDumpFromSource = config.GetDefault("processor.remove_raw_dump", false).(bool)
	processorConfig.SaveRawDumpInDestination = config.GetDefault("processor.save_raw_dump", false).(bool)

	if len(processorConfig.SourceStorage) > 1 {
		sourceCrashStorage = crashstorage.GetCrashStorage("poly", *configFilePath, processorConfig.SourceStorage)
	} else {
		sourceCrashStorage = crashstorage.GetCrashStorage(processorConfig.SourceStorage[0], *configFilePath, nil)
	}
	if len(processorConfig.DestinationStorage) > 1 {
		destinationCrashStorage = crashstorage.GetCrashStorage("poly", *configFilePath, processorConfig.DestinationStorage)
	} else {
		destinationCrashStorage = crashstorage.GetCrashStorage(processorConfig.DestinationStorage[0], *configFilePath, nil)
	}
	newCrashCrashStorage = crashstorage.GetCrashStorage(processorConfig.NewCrashSource, *configFilePath, nil)

	stop := false
	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)
	go func() {
		for sig := range c {
			// sig is a ^C, handle it
			fmt.Println(sig)
			stop = true
		}
	}()

	// TOOD(alexander): Not really nice
	// this currently is hard coded to check every 5 minutes to process the next crashes
	// all the crashes processing actually runs in go routines so that is nice-ish
	for {
		newCrashCrashStorage.NewCrashes(func(crashID string) {

			fmt.Println("Processing new crash: " + crashID)

			rawCrash := sourceCrashStorage.GetRawCrash(crashID)
			dumps := sourceCrashStorage.GetRawDumpsAsFiles(crashID).(*cs_interface.FileDumpsMapping)
			processedCrash := processCrash(rawCrash, dumps)
			if processedCrash == nil {
				fmt.Println("Failed to process crash: " + crashID)
				return
			}
			// We are done
			if processorConfig.SaveRawDumpInDestination {
				destinationCrashStorage.SaveRawAndProcessed(rawCrash, dumps, processedCrash, crashID)
			} else {
				destinationCrashStorage.SaveProcessed(processedCrash)
			}
			if processorConfig.RemoveRawDumpFromSource {
				sourceCrashStorage.Remove(crashID)
			}
			newCrashCrashStorage.AckCrash(crashID)
		})
		time.Sleep(5 * time.Second)
		if stop {
			return nil
		}
	}
	return nil
}
