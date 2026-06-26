'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { SSHConfigError } = require('../errors');

const DEFAULT_SSH_CONFIG = path.join(os.homedir(), '.ssh', 'config');
const BLOCK_START = '# --- git-switch:start ---';
const BLOCK_END = '# --- git-switch:end ---';

class SSHConfigService {
  constructor(sshConfigPath = DEFAULT_SSH_CONFIG) {
    this._configPath = sshConfigPath;
  }

  applyProfile(activeProfile, allProfiles = []) {
    const block = this._buildBlock(activeProfile, allProfiles);
    const updated = this._replaceBlock(this._read(), block);
    this._write(updated);
  }

  clearBlock() {
    const updated = this._replaceBlock(this._read(), '');
    this._write(updated);
  }

  _buildBlock(activeProfile, allProfiles) {
    const lines = [BLOCK_START, ''];
    const activeHosts = new Set(activeProfile.sshHosts || []);

    if (activeProfile.sshKeyPath && activeHosts.size > 0) {
      lines.push(`# active: ${activeProfile.name}`);
      for (const host of activeHosts) {
        lines.push(`Host ${host}`);
        lines.push(`  HostName ${host}`);
        lines.push(`  User git`);
        lines.push(`  IdentityFile ${activeProfile.sshKeyPath}`);
        lines.push(`  IdentitiesOnly yes`);
        lines.push('');
      }
    }

    // Block every host belonging to inactive profiles so they cannot
    // accidentally authenticate using a key still in the ssh-agent or keychain.
    for (const profile of allProfiles) {
      if (profile.name === activeProfile.name || !profile.sshHosts) continue;
      const blockedHosts = profile.sshHosts.filter((h) => !activeHosts.has(h));
      if (blockedHosts.length === 0) continue;

      lines.push(`# blocked: ${profile.name}`);
      for (const host of blockedHosts) {
        lines.push(`Host ${host}`);
        lines.push(`  PubkeyAuthentication no`);
        lines.push('');
      }
    }

    lines.push(BLOCK_END);
    return lines.join('\n');
  }

  _replaceBlock(content, newBlock) {
    const startIdx = content.indexOf(BLOCK_START);
    const endIdx = content.indexOf(BLOCK_END);

    if (startIdx !== -1 && endIdx !== -1) {
      const before = content.slice(0, startIdx).trimEnd();
      const after = content.slice(endIdx + BLOCK_END.length).trimStart();
      const parts = [newBlock, before, after].filter(Boolean);
      return parts.join('\n\n') + '\n';
    }

    if (!newBlock) return content;
    const trimmed = content.trim();
    return trimmed ? `${newBlock}\n\n${trimmed}\n` : `${newBlock}\n`;
  }

  _read() {
    if (!fs.existsSync(this._configPath)) return '';
    return fs.readFileSync(this._configPath, 'utf8');
  }

  _write(content) {
    const dir = path.dirname(this._configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    try {
      fs.writeFileSync(this._configPath, content, { encoding: 'utf8', mode: 0o600 });
    } catch (err) {
      throw new SSHConfigError(`Failed to write ~/.ssh/config: ${err.message}`);
    }
  }
}

module.exports = { SSHConfigService, DEFAULT_SSH_CONFIG };
