import { showToast, Toast, showHUD } from "@raycast/api";
import { existsSync } from "fs";
import { homedir } from "os";
import { getMostRecentProject } from "./lib/project-discovery";
import { getMostRecentSession } from "./lib/session-parser";
import { launchClaudeCode } from "./lib/terminal";
import { ensureClaudeInstalled } from "./lib/claude-cli";

export default async function QuickContinue() {
  try {
    // Check if Claude is installed first
    if (!(await ensureClaudeInstalled())) return;

    // First try to get the most recent session
    const recentSession = await getMostRecentSession();

    if (recentSession && existsSync(recentSession.projectPath)) {
      await showHUD(`Continuing session in ${recentSession.projectName}...`);
      await launchClaudeCode({
        projectPath: recentSession.projectPath,
        continueSession: true,
        permissionMode: recentSession.permissionMode,
      });
      return;
    }

    // Fall back to most recent project (no session to restore settings from)
    const recentProject = await getMostRecentProject();

    if (recentProject && existsSync(recentProject.path)) {
      await showHUD(`Starting new session in ${recentProject.name}...`);
      await launchClaudeCode({
        projectPath: recentProject.path,
      });
      return;
    }

    // No sessions or projects anywhere — start a fresh session in the home
    // directory instead of dead-ending with an error.
    await showHUD("No previous session — starting a new one...");
    await launchClaudeCode({
      projectPath: homedir(),
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
