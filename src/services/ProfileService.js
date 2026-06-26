'use strict';

const { ProfileNotFoundError, ProfileAlreadyExistsError } = require('../errors');

class ProfileService {
  constructor({ store, gitService, sshService, sshConfigService }) {
    this._store = store;
    this._git = gitService;
    this._ssh = sshService;
    this._sshConfig = sshConfigService;
  }

  add(name, profileData) {
    if (this._store.exists(name)) throw new ProfileAlreadyExistsError(name);
    this._store.set(name, profileData);
    return this._store.get(name);
  }

  edit(name, updates) {
    if (!this._store.exists(name)) throw new ProfileNotFoundError(name);
    const current = this._store.get(name);
    this._store.set(name, { ...current, ...updates });
    return this._store.get(name);
  }

  switchTo(name) {
    const profile = this._store.get(name);
    if (!profile) throw new ProfileNotFoundError(name);

    this._git.apply(profile);

    if (profile.sshKeyPath) {
      this._ssh.clearAgent();
      this._ssh.loadKey(profile.sshKeyPath);
    }

    this._rebuildSSHConfig(name);
    this._store.setActive(name);
    return profile;
  }

  remove(name) {
    if (!this._store.exists(name)) throw new ProfileNotFoundError(name);
    const wasActive = this._store.getActive() === name;
    this._store.remove(name);

    if (wasActive) {
      this._sshConfig.clearBlock();
    } else {
      // Rebuild so the removed profile's blocked entries are no longer emitted.
      const active = this._store.getActive();
      if (active) this._rebuildSSHConfig(active);
    }

    return wasActive;
  }

  _rebuildSSHConfig(activeName) {
    const allProfiles = Object.entries(this._store.getAll()).map(([n, data]) => ({ name: n, ...data }));
    const activeProfile = this._store.get(activeName);
    if (!activeProfile) return this._sshConfig.clearBlock();
    this._sshConfig.applyProfile({ name: activeName, ...activeProfile }, allProfiles);
  }

  list() {
    const profiles = this._store.getAll();
    const active = this._store.getActive();
    return Object.entries(profiles).map(([name, data]) => ({
      name,
      ...data,
      isActive: name === active,
    }));
  }

  getCurrent() {
    const active = this._store.getActive();
    if (!active) return null;
    const profile = this._store.get(active);
    if (!profile) return null;
    return { name: active, ...profile, isActive: true };
  }

  getByName(name) {
    const profile = this._store.get(name);
    if (!profile) throw new ProfileNotFoundError(name);
    return { name, ...profile };
  }
}

module.exports = { ProfileService };
