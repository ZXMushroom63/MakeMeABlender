const invoke = window.__TAURI__.core.invoke;
window.__TAURI__.event.listen("stdout", (data) => {
    logToConsole(data.payload.message);
});
async function execCommand(command, args, cd) {
    var decoder = new TextDecoder("utf-8")
    const result = await invoke('run_command', { command: command, args: args, dir: cd });
    return {
        status: result.status,
        stdout: decoder.decode(new Uint8Array(result.stdout)),
        stderr: decoder.decode(new Uint8Array(result.stderr))
    };
}

const repoUrl = "https://projects.blender.org/blender/blender.git";
function checkSSL() {
    return !document.querySelector("#ssl").checked;
}
function getFastPull() {
    return document.querySelector("#fastpull").checked;
}
async function gitpull() {
    var instance = getInstallations()[globalThis.selectedIndex];
    var pullrequests = PRs.filter(x => {
        return instance.features.includes(x.id) && instance.branch === x.branch;
    }).flatMap(x => x.id);
    var branch = instance.branch;
    var folder = instance.name;

    var { localDataDir, join } = window.__TAURI__.path;

    setLoadInfo("Clearing cache...");
    document.documentElement.classList.add("loading");
    
    const appDir = await join(await localDataDir(), 'makemeablender', instance.name);
    const gitDir = await join(await localDataDir(), 'makemeablender', instance.name, ".git");
    var ssl = checkSSL() ? [] : ["-c", "http.sslVerify=false", "-c", "http.sslbackend=schannel"];
    if (getFastPull() && (await __TAURI__.fs.exists(gitDir))) {
        setLoadInfo("Resetting local to head...");
        logToConsole("Resetting to master...");
        const fetchRemoteCommand = await execCommand('cmd', ['/C', 'start', 'cmd.exe', '.', '/C', 'git'].concat(ssl.concat(['fetch', '--depth=1', 'origin', branch])), appDir);
        const resetCommand = await execCommand('git', ssl.concat(['reset', '--hard', 'origin/'+branch]), appDir);
        logToConsole("Local up-to-date.");
    } else {
        logToConsole("Deleting previous pull...");
        try {
            await window.__TAURI__.fs.remove(appDir, { recursive: true });
        } catch (error) {
            console.log(error);
        }
        const totalDir = await join(await localDataDir(), 'makemeablender');
        logToConsole("Deleted previous pull.");
        logToConsole("Preparing to clone...");
        setLoadInfo("Cloning repository...");
        const cloneCommand = await execCommand('cmd', ['/C', 'start', 'cmd.exe', '.', '/C', 'git'].concat(ssl.concat(['clone', '--branch', branch, '--depth=1', '--recurse-submodules', repoUrl, folder])), totalDir);
    }

    setLoadInfo("Pulling features...");
    for (const prNumber of pullrequests) {
        logToConsole("Fetching #" + prNumber + "...");
        const fetchCommand = await execCommand('git', ssl.concat(['fetch', '--allow-unrelated-histories', '--depth=1', 'origin', `pull/${prNumber}/head:pr-${prNumber}`]), appDir);
        logToConsole("Merging #" + prNumber + "...");
        const mergeCommand = await execCommand('git', ssl.concat(['merge', '-X', 'theirs', '--allow-unrelated-histories', `pr-${prNumber}`]), appDir);
        logToConsole(mergeCommand.stdout);
    }
    logToConsole("Pull complete!");
    document.documentElement.classList.remove("loading");
}
async function makebuild() {
    setLoadInfo("Running make.bat...");
    document.documentElement.classList.add("loading")
    logToConsole("Running make.bat");
    var instance = getInstallations()[globalThis.selectedIndex];
    var folder = instance.name;

    var { localDataDir, join } = window.__TAURI__.path;

    const appDir = await join(await localDataDir(), 'makemeablender', instance.name);
    const totalDir = await join(await localDataDir(), 'makemeablender');
    const buildCommand = await execCommand('cmd', ['/C', 'start', 'cmd.exe', '.', '/C', 'make.bat'], appDir);
    if (buildCommand.stdout > 0) {
        logToConsole(buildCommand.stdout);
    } else if (buildCommand.stderr > 0) {
        logToConsole(buildCommand.stderr);
        logToConsole("BUILD COMMAND FAILED!");
        logToConsole("Make sure you've pulled the repo and installed required libraries and software.");
    }
    var blenderDirectory = (await __TAURI__.fs.readDir(totalDir)).find((dir) => {
        return dir.isDirectory && !dir.isFile && !dir.isSymlink && dir.name.toLowerCase().startsWith("build_") && dir.name.toLowerCase().endsWith("_release");
    });
    if (!blenderDirectory) {
        logToConsole("Build directory not found?");
    } else {
        setLoadInfo("Moving binaries...");
        logToConsole("Moving binaries...");
        const binDir = await join(await localDataDir(), 'makemeablender', blenderDirectory.name);
        const outDir = await join(await localDataDir(), 'makemeablender', instance.name, 'compiled_binary');
        const moveCommand = await execCommand('cmd', ['/C', 'move', '/Y', binDir, outDir], totalDir);
        if (moveCommand.stdout > 0) {
            logToConsole(moveCommand.stdout);
        } else if (moveCommand.stderr > 0) {
            logToConsole(moveCommand.stderr);
        }
        logToConsole("Moved binary. Ready to execute!");
    }
    document.documentElement.classList.remove("loading");
}
async function execbuild() {
    setLoadInfo("Running blender...");
    var instance = getInstallations()[globalThis.selectedIndex];
    document.documentElement.classList.add("loading")
    var { localDataDir, join } = window.__TAURI__.path;
    const binaryDir = await join(await localDataDir(), 'makemeablender', instance.name, 'compiled_binary', 'bin');
    if (await __TAURI__.fs.exists(binaryDir)) {
        var targetFolder = (await __TAURI__.fs.readDir(binaryDir)).find(x=>x.isDirectory);
        if (targetFolder) {
            const blenderDir = await join(await localDataDir(), 'makemeablender', instance.name, 'compiled_binary', 'bin', targetFolder.name);
            logToConsole("Starting Blender...");
            execCommand('cmd', ['/C', 'start', 'blender.exe'], blenderDir).then(res => {
                logToConsole("Blender process exited!");
            });
        }
    } else {
        logToConsole("Build directory not found!");
    }
    

    document.documentElement.classList.remove("loading");
}
window.addEventListener("load", () => {
    document.querySelector("#gitpull").addEventListener("click", gitpull);
    document.querySelector("#makebuild").addEventListener("click", makebuild);
    document.querySelector("#execbuild").addEventListener("click", execbuild);
});