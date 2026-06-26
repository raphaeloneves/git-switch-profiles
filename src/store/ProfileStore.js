'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_CONFIG_PATH = path.join(os.homedir(), '.git-switch', 'profiles.json');

class ProfileStore {
  constructor(configPath = DEFAULT_CONFIG_PATH) {
    this._configPath = configPath;
    this._configDir = path.dirname(configPath);
  }

  getAll() {
    return this._load().profiles;
  }

  get(name) {
    return this._load().profiles[name] || null;
  }

  set(name, profile) {
    const data = this._load();
    data.profiles[name] = { ...profile, updatedAt: new Date().toISOString() };
    this._persist(data);
  }

  remove(name) {
    const data = this._load();
    delete data.profiles[name];
    if (data.active === name) data.active = null;
    this._persist(data);
  }

  setActive(name) {
    const data = this._load();
    data.active = name;
    this._persist(data);
  }

  getActive() {
    return this._load().active;
  }

  exists(name) {
    return Object.prototype.hasOwnProperty.call(this._load().profiles, name);
  }

  _load() {
    this._ensureDir();
    if (!fs.existsSync(this._configPath)) {
      return { profiles: {}, active: null };
    }
    try {
      return JSON.parse(fs.readFileSync(this._configPath, 'utf8'));
    } catch {
      return { profiles: {}, active: null };
    }
  }

  _persist(data) {
    this._ensureDir();
    fs.writeFileSync(this._configPath, JSON.stringify(data, null, 2), 'utf8');
  }

  _ensureDir() {
    if (!fs.existsSync(this._configDir)) {
      fs.mkdirSync(this._configDir, { recursive: true });
    }
  }
}

module.exports = { ProfileStore, DEFAULT_CONFIG_PATH };
