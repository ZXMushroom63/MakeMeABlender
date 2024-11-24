// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[derive(serde::Serialize)]
struct Output {
  stdout: Vec<u8>,
  stderr: Vec<u8>,
  status: i32,
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn run_command(command: String, args: Vec<String>, dir: Option<String>) -> Output {
    // Create a new Command instance
    let mut cmd = std::process::Command::new(command);

    // Set the current directory if provided
    if let Some(directory) = dir {
        cmd.current_dir(directory);
    }

    // Set the arguments and execute the command
    let output = cmd.args(args)
        .output()
        // TODO: handle error
        .unwrap();

    Output {
        stdout: output.stdout,
        stderr: output.stderr,
        status: output.status.code().unwrap_or_default(),
    }
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_cors_fetch::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![run_command])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
