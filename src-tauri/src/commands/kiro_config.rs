use serde::Serialize;
use serde_json::{Map, Value};
use super::error::AppError;
use std::collections::BTreeMap;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KiroAgent {
    pub name: String,
    pub description: String,
    pub tools: Vec<String>,
    pub source: String,
    pub file_path: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KiroSkill {
    pub name: String,
    pub source: String,
    pub file_path: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KiroSteeringRule {
    pub name: String,
    pub always_apply: bool,
    pub source: String,
    pub excerpt: String,
    pub file_path: String,
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct KiroMcpServer {
    pub name: String,
    pub enabled: bool,
    pub transport: String,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub command: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub args: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub env: Option<BTreeMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub headers: Option<BTreeMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub auto_approve: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled_tools: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    pub file_path: String,
}

#[derive(Serialize, Clone, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct KiroConfig {
    pub agents: Vec<KiroAgent>,
    pub skills: Vec<KiroSkill>,
    pub steering_rules: Vec<KiroSteeringRule>,
    pub mcp_servers: Vec<KiroMcpServer>,
}

fn source_str(is_global: bool) -> &'static str {
    if is_global { "global" } else { "local" }
}

fn parse_steering_frontmatter(content: &str) -> (bool, String) {
    let mut always_apply = false;
    let mut body = content;
    if content.starts_with("---") {
        if let Some(end_idx) = content[3..].find("\n---") {
            let fm = &content[3..3 + end_idx];
            body = &content[3 + end_idx + 4..];
            for line in fm.lines() {
                let line = line.trim();
                if line.starts_with("alwaysApply") {
                    if let Some(val) = line.split(':').nth(1) {
                        always_apply = val.trim() == "true";
                    }
                }
            }
        }
    }
    let excerpt = body
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty() && !l.starts_with('#'))
        .take(1)
        .collect::<Vec<_>>()
        .join("");
    let excerpt = if excerpt.len() > 120 { excerpt[..120].to_string() } else { excerpt };
    (always_apply, excerpt)
}

fn scan_agents(base: &Path, is_global: bool) -> Vec<KiroAgent> {
    let dir = base.join("agents");
    let Ok(entries) = fs::read_dir(&dir) else { return vec![] };
    let source = source_str(is_global);
    entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            let name = e.file_name();
            let name = name.to_string_lossy();
            name.ends_with(".json") && !name.starts_with('.')
        })
        .filter_map(|e| {
            let fp = e.path();
            let raw: serde_json::Value = serde_json::from_str(&fs::read_to_string(&fp).ok()?).ok()?;
            let obj = raw.as_object()?;
            let file_name = fp.file_stem()?.to_string_lossy().to_string();
            Some(KiroAgent {
                name: obj.get("name").and_then(|v| v.as_str()).unwrap_or(&file_name).to_string(),
                description: obj.get("description").and_then(|v| v.as_str()).unwrap_or("").to_string(),
                tools: obj.get("tools").and_then(|v| v.as_array()).map(|a| {
                    a.iter().filter_map(|v| v.as_str().map(String::from)).collect()
                }).unwrap_or_default(),
                source: source.to_string(),
                file_path: fp.to_string_lossy().to_string(),
            })
        })
        .collect()
}

fn scan_skills(base: &Path, is_global: bool) -> Vec<KiroSkill> {
    let dir = base.join("skills");
    let Ok(entries) = fs::read_dir(&dir) else { return vec![] };
    let source = source_str(is_global);
    entries
        .filter_map(|e| e.ok())
        .filter(|e| {
            let name = e.file_name();
            !name.to_string_lossy().starts_with('.')
                && (e.file_type().map_or(false, |t| t.is_dir() || t.is_symlink()))
        })
        .map(|e| {
            let skill_md = e.path().join("SKILL.md");
            let file_path = if skill_md.exists() {
                skill_md.to_string_lossy().to_string()
            } else {
                e.path().to_string_lossy().to_string()
            };
            KiroSkill {
                name: e.file_name().to_string_lossy().to_string(),
                source: source.to_string(),
                file_path,
            }
        })
        .collect()
}

fn scan_steering(base: &Path, is_global: bool) -> Vec<KiroSteeringRule> {
    let dir = base.join("steering");
    let Ok(entries) = fs::read_dir(&dir) else { return vec![] };
    let source = source_str(is_global);
    entries
        .filter_map(|e| e.ok())
        .filter(|e| e.file_name().to_string_lossy().ends_with(".md"))
        .filter_map(|e| {
            let fp = e.path();
            let content = fs::read_to_string(&fp).ok()?;
            let (always_apply, excerpt) = parse_steering_frontmatter(&content);
            Some(KiroSteeringRule {
                name: fp.file_stem()?.to_string_lossy().to_string(),
                always_apply,
                source: source.to_string(),
                excerpt,
                file_path: fp.to_string_lossy().to_string(),
            })
        })
        .collect()
}

fn scan_root_steering(kiro_dir: &Path, is_global: bool, existing: &[KiroSteeringRule]) -> Vec<KiroSteeringRule> {
    let Ok(entries) = fs::read_dir(kiro_dir) else { return vec![] };
    let source = source_str(is_global);
    entries
        .filter_map(|e| e.ok())
        .filter(|e| e.file_name().to_string_lossy().ends_with(".md"))
        .filter_map(|e| {
            let fp = e.path();
            let name = fp.file_stem()?.to_string_lossy().to_string();
            if existing.iter().any(|r| r.name == name && r.source == source) {
                return None;
            }
            let content = fs::read_to_string(&fp).ok()?;
            let (always_apply, excerpt) = parse_steering_frontmatter(&content);
            Some(KiroSteeringRule {
                name,
                always_apply,
                source: source.to_string(),
                excerpt,
                file_path: fp.to_string_lossy().to_string(),
            })
        })
        .collect()
}

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct McpConfigPaths {
    pub global_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_path: Option<String>,
}

fn string_array(cfg: &Value, key: &str) -> Option<Vec<String>> {
    cfg.get(key).and_then(|v| v.as_array()).map(|a| {
        a.iter().filter_map(|v| v.as_str().map(String::from)).collect()
    })
}

fn string_map(cfg: &Value, key: &str) -> Option<BTreeMap<String, String>> {
    cfg.get(key).and_then(|v| v.as_object()).map(|obj| {
        obj.iter()
            .filter_map(|(k, v)| v.as_str().map(|s| (k.clone(), s.to_string())))
            .collect()
    }).filter(|m: &BTreeMap<String, String>| !m.is_empty())
}

fn mcp_error(cfg: &Value, transport: &str) -> Option<String> {
    let has_url = cfg.get("url").and_then(|v| v.as_str()).is_some();
    let has_command = cfg.get("command").and_then(|v| v.as_str()).is_some();
    if transport == "stdio" && !has_command {
        return Some("Missing command".to_string());
    }
    if transport != "stdio" && !has_url {
        return Some("Missing url".to_string());
    }
    if let Some(url) = cfg.get("url").and_then(|v| v.as_str()) {
        let is_local_http = url.starts_with("http://localhost")
            || url.starts_with("http://127.0.0.1")
            || url.starts_with("http://[::1]");
        if !(url.starts_with("https://") || is_local_http) {
            return Some("Remote MCP URLs must use HTTPS or localhost HTTP".to_string());
        }
    }
    None
}

fn load_mcp_file(file_path: &Path, enabled_file: bool, is_global: bool, out: &mut Vec<KiroMcpServer>) {
    let Ok(content) = fs::read_to_string(file_path) else { return };
    let Ok(raw) = serde_json::from_str::<serde_json::Value>(&content) else { return };
    let Some(servers) = raw.get("mcpServers").and_then(|v| v.as_object()) else { return };
    let fp = file_path.to_string_lossy().to_string();
    let source = source_str(is_global).to_string();
    for (name, cfg) in servers {
        let has_url = cfg.get("url").and_then(|v| v.as_str()).is_some();
        let transport = if let Some(t) = cfg.get("transport").and_then(|v| v.as_str()) {
            t.to_string()
        } else if has_url {
            "http".to_string()
        } else {
            "stdio".to_string()
        };
        let disabled = cfg.get("disabled").and_then(|v| v.as_bool()).unwrap_or(false);
        let error = mcp_error(cfg, &transport);
        out.push(KiroMcpServer {
            name: name.clone(),
            enabled: enabled_file && !disabled,
            transport,
            source: source.clone(),
            command: cfg.get("command").and_then(|v| v.as_str()).map(String::from),
            args: string_array(cfg, "args"),
            url: cfg.get("url").and_then(|v| v.as_str()).map(String::from),
            env: string_map(cfg, "env"),
            headers: string_map(cfg, "headers"),
            auto_approve: string_array(cfg, "autoApprove"),
            disabled_tools: string_array(cfg, "disabledTools"),
            error,
            file_path: fp.clone(),
        });
    }
}

fn mcp_path(project_path: Option<&str>, disabled: bool) -> Result<PathBuf, AppError> {
    let filename = if disabled { "mcp-disabled.json" } else { "mcp.json" };
    if let Some(project) = project_path {
        return Ok(Path::new(project).join(".kiro").join("settings").join(filename));
    }
    let home = dirs::home_dir().ok_or_else(|| AppError::Other("Could not resolve home directory".to_string()))?;
    Ok(home.join(".kiro").join("settings").join(filename))
}

fn read_mcp_json(path: &Path) -> Result<Value, AppError> {
    if !path.exists() {
        return Ok(serde_json::json!({ "mcpServers": {} }));
    }
    let raw = fs::read_to_string(path)?;
    if raw.trim().is_empty() {
        return Ok(serde_json::json!({ "mcpServers": {} }));
    }
    Ok(serde_json::from_str(&raw)?)
}

fn ensure_mcp_servers_object(root: &mut Value) -> Result<&mut Map<String, Value>, AppError> {
    if !root.is_object() {
        *root = serde_json::json!({ "mcpServers": {} });
    }
    let obj = root.as_object_mut().ok_or_else(|| AppError::Other("Invalid MCP JSON root".to_string()))?;
    let servers = obj.entry("mcpServers").or_insert_with(|| Value::Object(Map::new()));
    if !servers.is_object() {
        *servers = Value::Object(Map::new());
    }
    servers.as_object_mut().ok_or_else(|| AppError::Other("Invalid mcpServers object".to_string()))
}

fn normalize_mcp_config(mut config: Value) -> Result<Value, AppError> {
    let obj = config.as_object_mut().ok_or_else(|| AppError::Other("MCP server config must be a JSON object".to_string()))?;
    obj.remove("name");
    obj.remove("enabled");
    let transport = obj.get("transport").and_then(|v| v.as_str()).unwrap_or_else(|| {
        if obj.get("url").is_some() { "http" } else { "stdio" }
    }).to_string();
    if transport == "stdio" {
        obj.remove("url");
        obj.remove("headers");
    } else {
        obj.remove("command");
        obj.remove("args");
        if transport == "http" {
            obj.remove("transport");
        }
    }
    Ok(config)
}

fn write_mcp_server_to_path(path: &Path, server_name: &str, config: Value) -> Result<(), AppError> {
    let name = server_name.trim();
    if name.is_empty() || name.contains('/') || name.contains('\\') {
        return Err(AppError::Other("MCP server name must not be empty or contain path separators".to_string()));
    }
    let mut root = read_mcp_json(path)?;
    let servers = ensure_mcp_servers_object(&mut root)?;
    servers.insert(name.to_string(), normalize_mcp_config(config)?);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, serde_json::to_string_pretty(&root)?)?;
    Ok(())
}

fn delete_mcp_server_from_path(path: &Path, server_name: &str) -> Result<(), AppError> {
    if !path.exists() {
        return Ok(());
    }
    let mut root = read_mcp_json(path)?;
    if let Some(servers) = root.get_mut("mcpServers").and_then(|v| v.as_object_mut()) {
        servers.remove(server_name);
    }
    fs::write(path, serde_json::to_string_pretty(&root)?)?;
    Ok(())
}

#[tauri::command]
pub fn get_kiro_config(project_path: Option<String>) -> KiroConfig {
    let mut config = KiroConfig::default();

    if let Some(home) = dirs::home_dir() {
        let global_kiro = home.join(".kiro");
        config.agents.extend(scan_agents(&global_kiro, true));
        config.skills.extend(scan_skills(&global_kiro, true));
        config.steering_rules.extend(scan_steering(&global_kiro, true));
        load_mcp_file(&global_kiro.join("settings").join("mcp.json"), true, true, &mut config.mcp_servers);
        load_mcp_file(&global_kiro.join("settings").join("mcp-disabled.json"), false, true, &mut config.mcp_servers);
    }

    if let Some(ref project) = project_path {
        let local_kiro = Path::new(project).join(".kiro");
        config.agents.extend(scan_agents(&local_kiro, false));
        config.skills.extend(scan_skills(&local_kiro, false));
        config.steering_rules.extend(scan_steering(&local_kiro, false));
        let root_rules = scan_root_steering(&local_kiro, false, &config.steering_rules);
        config.steering_rules.extend(root_rules);
        load_mcp_file(&local_kiro.join("settings").join("mcp.json"), true, false, &mut config.mcp_servers);
        load_mcp_file(&local_kiro.join("settings").join("mcp-disabled.json"), false, false, &mut config.mcp_servers);
    }

    config
}

#[tauri::command]
pub fn get_mcp_config_paths(project_path: Option<String>) -> Result<McpConfigPaths, AppError> {
    Ok(McpConfigPaths {
        global_path: mcp_path(None, false)?.to_string_lossy().to_string(),
        project_path: project_path.as_deref()
            .map(|p| mcp_path(Some(p), false).map(|path| path.to_string_lossy().to_string()))
            .transpose()?,
    })
}

#[tauri::command]
pub fn save_mcp_server(project_path: Option<String>, server_name: String, config: Value) -> Result<(), AppError> {
    let path = mcp_path(project_path.as_deref(), false)?;
    write_mcp_server_to_path(&path, &server_name, config)?;
    let disabled_path = mcp_path(project_path.as_deref(), true)?;
    delete_mcp_server_from_path(&disabled_path, &server_name)?;
    Ok(())
}

#[tauri::command]
pub fn delete_mcp_server(project_path: Option<String>, server_name: String) -> Result<(), AppError> {
    delete_mcp_server_from_path(&mcp_path(project_path.as_deref(), false)?, &server_name)?;
    delete_mcp_server_from_path(&mcp_path(project_path.as_deref(), true)?, &server_name)?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_frontmatter_with_always_apply_true() {
        let input = "---\nalwaysApply: true\n---\n# Title\nSome body text";
        let (always_apply, excerpt) = parse_steering_frontmatter(input);
        assert!(always_apply);
        assert_eq!(excerpt, "Some body text");
    }

    #[test]
    fn parse_frontmatter_with_always_apply_false() {
        let input = "---\nalwaysApply: false\n---\nBody here";
        let (always_apply, excerpt) = parse_steering_frontmatter(input);
        assert!(!always_apply);
        assert_eq!(excerpt, "Body here");
    }

    #[test]
    fn parse_frontmatter_missing_returns_false() {
        let input = "# No frontmatter\nJust content";
        let (always_apply, excerpt) = parse_steering_frontmatter(input);
        assert!(!always_apply);
        assert_eq!(excerpt, "Just content");
    }

    #[test]
    fn parse_frontmatter_skips_headings_in_excerpt() {
        let input = "---\nalwaysApply: true\n---\n# Heading\n## Subheading\nActual content";
        let (_, excerpt) = parse_steering_frontmatter(input);
        assert_eq!(excerpt, "Actual content");
    }

    #[test]
    fn parse_frontmatter_truncates_long_excerpt() {
        let long_line = "a".repeat(200);
        let input = format!("---\nalwaysApply: false\n---\n{}", long_line);
        let (_, excerpt) = parse_steering_frontmatter(&input);
        assert_eq!(excerpt.len(), 120);
    }

    #[test]
    fn parse_frontmatter_empty_body() {
        let input = "---\nalwaysApply: true\n---\n";
        let (always_apply, excerpt) = parse_steering_frontmatter(input);
        assert!(always_apply);
        assert_eq!(excerpt, "");
    }

    #[test]
    fn source_str_global() {
        assert_eq!(super::source_str(true), "global");
    }

    #[test]
    fn source_str_local() {
        assert_eq!(super::source_str(false), "local");
    }

    #[test]
    fn scan_agents_nonexistent_dir_returns_empty() {
        let tmp = std::env::temp_dir().join("kirodex_test_nonexistent_agents");
        assert!(super::scan_agents(&tmp, true).is_empty());
    }

    #[test]
    fn scan_skills_nonexistent_dir_returns_empty() {
        let tmp = std::env::temp_dir().join("kirodex_test_nonexistent_skills");
        assert!(super::scan_skills(&tmp, false).is_empty());
    }

    #[test]
    fn scan_steering_nonexistent_dir_returns_empty() {
        let tmp = std::env::temp_dir().join("kirodex_test_nonexistent_steering");
        assert!(super::scan_steering(&tmp, true).is_empty());
    }

    #[test]
    fn scan_agents_reads_json_files() {
        let tmp = tempfile::tempdir().unwrap();
        let agents_dir = tmp.path().join("agents");
        std::fs::create_dir_all(&agents_dir).unwrap();
        std::fs::write(
            agents_dir.join("test-agent.json"),
            r#"{"name": "Test Agent", "description": "A test", "tools": ["tool1", "tool2"]}"#,
        ).unwrap();
        std::fs::write(agents_dir.join(".hidden.json"), r#"{"name": "Hidden"}"#).unwrap();
        let result = super::scan_agents(tmp.path(), true);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "Test Agent");
        assert_eq!(result[0].tools, vec!["tool1", "tool2"]);
        assert_eq!(result[0].source, "global");
    }

    #[test]
    fn scan_steering_reads_md_files() {
        let tmp = tempfile::tempdir().unwrap();
        let dir = tmp.path().join("steering");
        std::fs::create_dir_all(&dir).unwrap();
        std::fs::write(dir.join("my-rule.md"), "---\nalwaysApply: true\n---\n# Rule\nDo this thing").unwrap();
        let result = super::scan_steering(tmp.path(), false);
        assert_eq!(result.len(), 1);
        assert_eq!(result[0].name, "my-rule");
        assert!(result[0].always_apply);
        assert_eq!(result[0].source, "local");
        assert_eq!(result[0].excerpt, "Do this thing");
    }

    #[test]
    fn load_mcp_file_parses_stdio_server() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join("mcp.json");
        std::fs::write(&f, r#"{"mcpServers": {"slack": {"command": "slack-mcp", "args": ["--token", "abc"]}}}"#).unwrap();
        let mut servers = Vec::new();
        super::load_mcp_file(&f, true, false, &mut servers);
        assert_eq!(servers.len(), 1);
        assert_eq!(servers[0].name, "slack");
        assert!(servers[0].enabled);
        assert_eq!(servers[0].transport, "stdio");
        assert_eq!(servers[0].source, "local");
        assert!(servers[0].error.is_none());
    }

    #[test]
    fn load_mcp_file_parses_http_server() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join("mcp.json");
        std::fs::write(&f, r#"{"mcpServers": {"gh": {"url": "https://gh.mcp"}}}"#).unwrap();
        let mut servers = Vec::new();
        super::load_mcp_file(&f, false, false, &mut servers);
        assert_eq!(servers[0].transport, "http");
        assert!(!servers[0].enabled);
    }

    #[test]
    fn load_mcp_file_flags_missing_command_and_url() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join("mcp.json");
        std::fs::write(&f, r#"{"mcpServers": {"broken": {}}}"#).unwrap();
        let mut servers = Vec::new();
        super::load_mcp_file(&f, true, false, &mut servers);
        assert_eq!(servers[0].error.as_deref(), Some("Missing command"));
    }

    #[test]
    fn load_mcp_file_flags_invalid_url() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join("mcp.json");
        std::fs::write(&f, r#"{"mcpServers": {"bad": {"url": "not-a-url"}}}"#).unwrap();
        let mut servers = Vec::new();
        super::load_mcp_file(&f, true, false, &mut servers);
        assert_eq!(servers[0].error.as_deref(), Some("Remote MCP URLs must use HTTPS or localhost HTTP"));
    }

    #[test]
    fn load_mcp_file_nonexistent_is_noop() {
        let mut servers = Vec::new();
        super::load_mcp_file(std::path::Path::new("/nonexistent/mcp.json"), true, false, &mut servers);
        assert!(servers.is_empty());
    }

    #[test]
    fn kiro_config_default_is_empty() {
        let config = super::KiroConfig::default();
        assert!(config.agents.is_empty());
        assert!(config.mcp_servers.is_empty());
    }

    #[test]
    fn parse_frontmatter_only_whitespace_body() {
        let input = "---\nalwaysApply: true\n---\n   \n  \n";
        let (always_apply, excerpt) = super::parse_steering_frontmatter(input);
        assert!(always_apply);
        assert_eq!(excerpt, "");
    }

    #[test]
    fn load_mcp_file_preserves_supported_configuration_keys() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join("mcp.json");
        std::fs::write(&f, r#"{"mcpServers":{"api":{"url":"https://api.example.com/mcp","transport":"sse","headers":{"Authorization":"Bearer ${TOKEN}"},"env":{"DEBUG":"true"},"autoApprove":["read"],"disabledTools":["delete"],"disabled":true}}}"#).unwrap();
        let mut servers = Vec::new();
        super::load_mcp_file(&f, true, true, &mut servers);
        assert_eq!(servers[0].transport, "sse");
        assert_eq!(servers[0].source, "global");
        assert!(!servers[0].enabled);
        assert_eq!(servers[0].headers.as_ref().unwrap().get("Authorization").unwrap(), "Bearer ${TOKEN}");
        assert_eq!(servers[0].env.as_ref().unwrap().get("DEBUG").unwrap(), "true");
        assert_eq!(servers[0].auto_approve.as_ref().unwrap(), &vec!["read".to_string()]);
        assert_eq!(servers[0].disabled_tools.as_ref().unwrap(), &vec!["delete".to_string()]);
    }

    #[test]
    fn write_mcp_server_to_path_saves_pretty_json() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join(".kiro").join("settings").join("mcp.json");
        super::write_mcp_server_to_path(
            &f,
            "api",
            serde_json::json!({
                "url": "https://api.example.com/mcp",
                "headers": { "Authorization": "Bearer ${TOKEN}" },
                "disabled": false,
                "name": "ignored",
                "enabled": true
            }),
        ).unwrap();
        let raw = std::fs::read_to_string(&f).unwrap();
        let json: serde_json::Value = serde_json::from_str(&raw).unwrap();
        let server = &json["mcpServers"]["api"];
        assert_eq!(server["url"], "https://api.example.com/mcp");
        assert!(server.get("name").is_none());
        assert!(server.get("enabled").is_none());
    }

    #[test]
    fn write_mcp_server_to_path_removes_remote_only_keys_for_stdio() {
        let tmp = tempfile::tempdir().unwrap();
        let f = tmp.path().join("mcp.json");
        super::write_mcp_server_to_path(
            &f,
            "local",
            serde_json::json!({
                "transport": "stdio",
                "command": "uvx",
                "args": ["mcp-server-fetch"],
                "url": "https://unused.example.com",
                "headers": { "Authorization": "nope" }
            }),
        ).unwrap();
        let json: serde_json::Value = serde_json::from_str(&std::fs::read_to_string(&f).unwrap()).unwrap();
        let server = &json["mcpServers"]["local"];
        assert_eq!(server["command"], "uvx");
        assert!(server.get("url").is_none());
        assert!(server.get("headers").is_none());
    }
}
