use std::{os::windows::process::CommandExt, path::PathBuf};

#[derive(serde::Serialize)]
struct Output {
    stdout: Vec<u8>,
    stderr: Vec<u8>,
    status: i32,
}


#[tauri::command]
async fn run_command(command: String, args: Vec<String>, dir: Option<String>) -> Output {
    // Create a new Command instance
    let mut cmd = std::process::Command::new(command);

    // Set the current directory if provided
    if let Some(directory) = dir {
        cmd.current_dir(directory);
    }
    cmd.creation_flags(0x08000000);

    // Set the arguments and execute the command
    let output = cmd.args(args).output();
    match output {
        Ok(v) => {
            return Output {
                stdout: v.stdout,
                stderr: v.stderr,
                status: v.status.code().unwrap_or_default(),
            };
        }
        Err(e) => {
            return Output {
                stdout: Vec::new(),
                stderr: e.to_string().as_bytes().to_vec(),
                status: e.raw_os_error().unwrap_or_default(),
            };
        }
    }
}


#[tauri::command]
fn get_executable_file_path() -> Result<PathBuf, String> {
    match std::env::current_exe() {
        Ok(path) => {
            if let Some(parent) = path.parent() {
                return Ok(parent.to_path_buf());
            } else {
                return Err(format!("signal_error"));
            }
        }
        Err(_) => return Err(format!("signal_error")),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_cors_fetch::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![get_executable_file_path, run_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
