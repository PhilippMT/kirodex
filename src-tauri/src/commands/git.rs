use serde::Serialize;
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;

use crate::commands::acp::AcpState;

// ── Return types matching frontend expectations ────────────────────────

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LocalBranch {
    pub name: String,
    pub current: bool,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct RemoteBranch {
    pub name: String,
    pub full_ref: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BranchInfo {
    pub local: Vec<LocalBranch>,
    pub remotes: HashMap<String, Vec<RemoteBranch>>,
    pub current_branch: String,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct BranchResult {
    pub branch: String,
}

// ── Helpers ────────────────────────────────────────────────────────────

fn run_git(cwd: &str, args: &[&str]) -> Result<String, String> {
    let output = Command::new("git")
        .current_dir(cwd)
        .args(args)
        .output()
        .map_err(|e| e.to_string())?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).trim().to_string())
    }
}

fn resolve_workspace(state: &AcpState, task_id: &str) -> Result<String, String> {
    let tasks = state.tasks.lock().map_err(|e| e.to_string())?;
    tasks
        .get(task_id)
        .map(|t| t.workspace.clone())
        .ok_or_else(|| format!("Task not found: {task_id}"))
}

// ── Commands ───────────────────────────────────────────────────────────

#[tauri::command]
pub fn git_detect(path: String) -> bool {
    Path::new(&path).join(".git").exists()
}

#[tauri::command]
pub fn git_list_branches(cwd: String) -> Result<BranchInfo, String> {
    let current = run_git(&cwd, &["rev-parse", "--abbrev-ref", "HEAD"])
        .unwrap_or_default();
    let local_out = run_git(&cwd, &["branch", "--format=%(refname:short)"])?;
    let local: Vec<LocalBranch> = local_out
        .lines()
        .filter(|s| !s.is_empty())
        .map(|s| LocalBranch {
            name: s.to_string(),
            current: s == current,
        })
        .collect();
    let remote_out = run_git(&cwd, &["branch", "-r", "--format=%(refname:short)"])
        .unwrap_or_default();
    let mut remotes: HashMap<String, Vec<RemoteBranch>> = HashMap::new();
    for line in remote_out.lines().filter(|s| !s.is_empty()) {
        let full_ref = line.to_string();
        if let Some((remote, branch)) = line.split_once('/') {
            remotes
                .entry(remote.to_string())
                .or_default()
                .push(RemoteBranch {
                    name: branch.to_string(),
                    full_ref,
                });
        }
    }
    Ok(BranchInfo {
        local,
        remotes,
        current_branch: current,
    })
}

#[tauri::command]
pub fn git_checkout(cwd: String, branch: String) -> Result<BranchResult, String> {
    run_git(&cwd, &["checkout", &branch])?;
    Ok(BranchResult { branch })
}

#[tauri::command]
pub fn git_create_branch(cwd: String, branch: String) -> Result<BranchResult, String> {
    run_git(&cwd, &["checkout", "-b", &branch])?;
    Ok(BranchResult {
        branch: branch.clone(),
    })
}

#[tauri::command]
pub fn git_commit(
    state: tauri::State<'_, AcpState>,
    task_id: String,
    message: String,
) -> Result<String, String> {
    let cwd = resolve_workspace(&state, &task_id)?;
    run_git(&cwd, &["add", "-A"])?;
    run_git(&cwd, &["commit", "-m", &message])
}

#[tauri::command]
pub fn git_push(state: tauri::State<'_, AcpState>, task_id: String) -> Result<String, String> {
    let cwd = resolve_workspace(&state, &task_id)?;
    run_git(&cwd, &["push"])
}

#[tauri::command]
pub fn git_stage(
    state: tauri::State<'_, AcpState>,
    task_id: String,
    file_path: String,
) -> Result<String, String> {
    let cwd = resolve_workspace(&state, &task_id)?;
    run_git(&cwd, &["add", &file_path])
}

#[tauri::command]
pub fn git_revert(
    state: tauri::State<'_, AcpState>,
    task_id: String,
    file_path: String,
) -> Result<String, String> {
    let cwd = resolve_workspace(&state, &task_id)?;
    run_git(&cwd, &["checkout", "--", &file_path])
}

#[tauri::command]
pub fn task_diff(state: tauri::State<'_, AcpState>, task_id: String) -> Result<String, String> {
    let cwd = resolve_workspace(&state, &task_id)?;
    let staged = run_git(&cwd, &["diff", "--cached"]).unwrap_or_default();
    let unstaged = run_git(&cwd, &["diff"]).unwrap_or_default();
    Ok(format!("{}\n{}", staged, unstaged))
}
