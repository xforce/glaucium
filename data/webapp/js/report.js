let vm = new Vue({
  el: '#app',
  delimiters: ['${', '}'],
  data: {
      report: {
          signature: "",
          date_processed: "",
          product: "",
          version: "",
          os: "",
          os_version: "",
          architecture: "",
          address: "",
          uuid: ""
      },
      stack_trace: [],
      modules_headers: [
          { text: 'Filename', value: 'filename', left: true },
          { text: 'Version', value: 'version', left: true  },
          { text: 'Debug Identifier', value: 'debug_identifier', left: true  },
          { text: 'Debug Filename', value: 'debug_filename', left: true  }
      ],
      modules_items: [],
  }
});

function loadCrashReport() {
    let meow = {
        "columns": ["signature","product","version"],
        "filters": [
            {"name": "uuid","value" : crashID},
        ],
    }

    let xhr = new XMLHttpRequest();
    let url = "/api/search";
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            let hit = jsonResponse.hits[0];
            vm.report.uuid = hit.processed_crash.uuid;
            vm.report.signature = hit.processed_crash.signature;
            vm.report.date_processed =  moment(hit.processed_crash.date_processed).format("YYYY-MM-DD HH:MM:SS");
            vm.report.product = hit.processed_crash.product;
            vm.report.version = hit.processed_crash.version;
            vm.report.address = hit.processed_crash.address;
            vm.report.os = hit.processed_crash.os_name;
            vm.report.os_version = hit.processed_crash.os_version;
        }
    }
    xhr.send(JSON.stringify(meow));
}

function loadStackTrace() {
    let xhr = new XMLHttpRequest();
    let url = "/api/report/" + crashID;
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status == 200) {
            let jsonResponse = JSON.parse(xhr.responseText);
            let resultArray = [];
            vm.stack_trace = [];
            jsonResponse.json_dump.crashing_thread.frames.forEach((frame) => {
                frame_object = {};
                if (frame.function !== undefined) {
                    frame_object.display_name = frame.module + "___" + frame.function;
                } else {
                    frame_object.display_name = frame.module + "+" + frame.module_offset + "[" + frame.offset +"]"
                }

				if (frame.file !== undefined) {
					frame_object.file = frame.file;
					frame_object.line = frame.line;
					frame_object.show_file = true;
				} else {
					frame_object.show_file = false;
				}
				frame_object.module = frame.module;
				frame_object.module_offset = frame.module_offset;

				if (frame.function_offset !== undefined) {
					frame_object.function_offset = frame.function_offset;
					frame_object.show_function_offset = true;
				} else {
					frame_object.show_function_offset = false;
				}
				

                vm.stack_trace.push(frame_object);
            });
            jsonResponse.json_dump.modules.forEach((module) => {
                resultArray.push({
                    filename: module.filename,
                    version: module.version,
                    debug_identifier: module.debug_id,
                    debug_filename: module.debug_file,
                    missing_symbols: module.missing_symbols
                });
            });
            vm.modules_items = resultArray;
        }
    }
    xhr.send();
}

document.getElementById("download_raw_dump_button").onclick = function () {
    document.location = "/api/report/" + crashID + "/download/raw";
};

loadCrashReport();
loadStackTrace();