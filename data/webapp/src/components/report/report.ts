import Vue from 'vue';
import { Component, Watch, Prop } from 'vue-property-decorator';
import moment from 'moment';

@Component({
    template: require('./report.html')
})
export class Report extends Vue {

    @Prop()
    id: string;

    stack_trace = [];
    modules_items = [];
    report = {
        signature: '',
        date_processed: '',
        product: '',
        version: '',
        os: '',
        os_version: '',
        architecture: '',
        address: '',
        uuid: '',
        reason: ''
    };
    threads = [];
    call_stacks = [];
    current_call_stack = [];
    current_thread = null;
    current_registers = {};
    modules_headers = [
        { text: 'Filename', value: 'filename', align: 'left' },
        { text: 'Version', value: 'version', align: 'left' },
        { text: 'Debug Identifier', value: 'debug_identifier', align: 'left' },
        { text: 'Debug Filename', value: 'debug_filename', align: 'left' }
    ];

    mounted() {
        this.loadCrashingStackTrace();
    }

    callStackEntryToDisplayPrimary(entry) {
        if (entry.function === undefined) {
            if (entry.module === undefined) {
                return entry.offset;
            }
            return entry.offset;
        } else {
            return entry.function;
        }
    }
    callStackEntryToDisplaySecondary(entry) {
        if (entry.function === undefined) {
            if (entry.module === undefined) {
                return '';
            }
        }

        return entry.module;
    }

    onThreadItemClicked(item) {
        item.selected = true;
        this.current_thread.selected = false;
        this.current_thread = item;
        this.current_call_stack = this.call_stacks[item.thread_id];
    }

    onDonwloadRaw() {
        window.location.href = '/api/report/' + this.id + '/download/raw';
    }

    onDonwloadJson() {
        // window.location.href = '/api/report/' + this.id + '/download/raw';
    }

    onDeleteClicked() {
         window.location.href = '/api/report/' + this.id + '/delete';
    }

    async loadCrashingStackTrace() {
        let xhr = new XMLHttpRequest();
        let url = '/api/report/' + this.id;
        xhr.open('GET', url, true);
        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                let jsonResponse = JSON.parse(xhr.responseText);
                let resultArray = [];
                this.stack_trace = [];

                this.report.uuid = jsonResponse.uuid;
                this.report.signature = jsonResponse.signature;
                const date = jsonResponse.crash_time && jsonResponse.crash_time !== undefined ? jsonResponse.crash_time : jsonResponse.date_processed;
                this.report.date_processed =  moment(date).format('YYYY-MM-DD HH:mm:ss');
                this.report.product = jsonResponse.product;
                this.report.version = jsonResponse.version;
                this.report.address = jsonResponse.address;
                this.report.os = jsonResponse.os_name;
                this.report.os_version = jsonResponse.os_version;
                this.report.reason = jsonResponse.reason;

                jsonResponse.json_dump.crashing_thread.frames.forEach((frame) => {
                    let frame_object = { display_name: null, file: null, line: null, show_file: null, show_address: null, module: null, offset: null, function_offset: null, module_offset: null, show_function_offset: null };
                    let no_function = false;
                    if (frame.function !== undefined) {
                        frame_object.display_name = frame.module + '___' + frame.function;
                    } else {
                        frame_object.display_name = frame.module + '+' + frame.module_offset + '[' + frame.offset + ']';
                        no_function = true;
                    }

                    if (frame.file !== undefined) {
                        frame_object.file = frame.file;
                        frame_object.line = frame.line;
                        frame_object.show_file = true;
                    } else {
                        frame_object.show_file = false;
                        if (!no_function) {
                            frame_object.show_address = true;
                        }
                    }
                    frame_object.module = frame.module;
                    frame_object.module_offset = frame.module_offset;
                    frame_object.offset = frame.offset;

                    if (frame.function_offset !== undefined) {
                        frame_object.function_offset = frame.function_offset;
                        frame_object.show_function_offset = true;
                    } else {
                        frame_object.show_function_offset = false;
                    }

                    this.stack_trace.push(frame_object);
                });
                jsonResponse.json_dump.modules.forEach((module) => {
                    let missing_symbols: boolean = ((module.missing_symbols === undefined || module.missing_symbols) && !(module.loaded_symbols !== undefined && module.loaded_symbols)) ? true : false;
                    resultArray.push({
                        filename: module.filename,
                        version: module.version,
                        debug_identifier: module.debug_id,
                        debug_filename: module.debug_file,
                        missing_symbols: missing_symbols
                    });
                });
                this.modules_items = resultArray;

                // Add the crashing thread first
                {
                    let thread = jsonResponse.json_dump.threads[jsonResponse.json_dump.crashing_thread.threads_index];
                     let display_name = thread.frames[0].normalized;
                    if (display_name === undefined) {
                        display_name = thread.frames[0].module + ' ' + thread.frames[0].offset;
                    }
                    const crashing_thread = jsonResponse.json_dump.crashing_thread.threads_index === jsonResponse.json_dump.threads.indexOf(thread);
                    this.threads.push({
                            frames: thread.frames,
                            frame_count: thread.frame_count,
                            display_name: display_name,
                            thread_id: jsonResponse.json_dump.threads.indexOf(thread),
                            crashing_thread: crashing_thread,
                            selected: true
                    });
                    this.current_thread = this.threads[0];
                    this.current_registers = jsonResponse.json_dump.crashing_thread.frames[0].registers;
                }

                jsonResponse.json_dump.threads.forEach((thread) => {
                    let display_name = thread.frames[0].normalized;
                    if (display_name === undefined) {
                        display_name = thread.frames[0].module + ' ' + thread.frames[0].offset;
                    }
                    const crashing_thread = jsonResponse.json_dump.crashing_thread.threads_index === jsonResponse.json_dump.threads.indexOf(thread);
                    if (!crashing_thread) {
                        this.threads.push({
                            frames: thread.frames,
                            frame_count: thread.frame_count,
                            display_name: display_name,
                            thread_id: jsonResponse.json_dump.threads.indexOf(thread),
                            crashing_thread: crashing_thread
                        });
                    }
                    let call_stack = [];
                    thread.frames.forEach((frame) => {
                        call_stack.push({
                            module: frame.module,
                            function: frame.function,
                            function_offset: frame.function_offset,
                            registers: frame.registers,
                            offset: frame.offset,
                            missing_symbols: frame.missing_symbols
                        });
                    });
                    this.call_stacks.push(call_stack);
                    if (crashing_thread) {
                        this.current_call_stack = call_stack;
                    }
                });
            }
        };
        xhr.send();
    }
}