var invoke = window.__TAURI__.core.invoke;
async function installationDir() {
    const result = await invoke('get_executable_file_path', {});
    return result;
}