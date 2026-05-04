import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const SESSION_DIR = path.join(os.homedir(), ".deep-thinker", "sessions");

export interface SessionData {
  id: string;
  name: string;
  problem?: string;
  createdAt: string;
  updatedAt: string;
  graphSnapshot: unknown;
}

export class SessionManager {
  constructor() {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  save(sessionName: string, data: SessionData): void {
    const filePath = path.join(SESSION_DIR, `${sessionName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  }

  load(sessionName: string): SessionData | null {
    const filePath = path.join(SESSION_DIR, `${sessionName}.json`);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  }

  list(): Array<{ name: string; problem?: string; updatedAt: string; nodeCount: number }> {
    if (!fs.existsSync(SESSION_DIR)) return [];
    return fs.readdirSync(SESSION_DIR)
      .filter(f => f.endsWith(".json"))
      .map(f => {
        const data: SessionData = JSON.parse(fs.readFileSync(path.join(SESSION_DIR, f), "utf-8"));
        return {
          name: data.name,
          problem: data.problem,
          updatedAt: data.updatedAt,
          nodeCount: (data.graphSnapshot as { nodes?: unknown[] })?.nodes?.length ?? 0,
        };
      });
  }

  delete(sessionName: string): boolean {
    const filePath = path.join(SESSION_DIR, `${sessionName}.json`);
    if (!fs.existsSync(filePath)) return false;
    fs.unlinkSync(filePath);
    return true;
  }

  autoSave(graphData: unknown, problem?: string): void {
    this.save("__autosave__", {
      id: "__autosave__",
      name: "__autosave__",
      problem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      graphSnapshot: graphData,
    });
  }
}
