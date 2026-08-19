import { DurableObject } from "cloudflare:workers";
import worker from "./index.js";

const SETTINGS_KEY = "dashboard-settings-v1";

export class DashboardSettingsStore extends DurableObject {
  async getSettings() {
    return (await this.ctx.storage.get(SETTINGS_KEY)) || null;
  }

  async saveSettings(settings) {
    const stored = { ...settings, savedAt: new Date().toISOString() };
    await this.ctx.storage.put(SETTINGS_KEY, stored);
    return stored;
  }
}

export default worker;
