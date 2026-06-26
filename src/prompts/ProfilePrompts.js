'use strict';

const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ProfilePrompts {
  async askProfileDetails(existingNames = []) {
    return inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Profile name:',
        filter: (v) => v.trim().toLowerCase(),
        validate: (v) => {
          const trimmed = v.trim();
          if (!trimmed) return 'Name is required';
          if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return 'Only letters, numbers, hyphens, and underscores are allowed';
          if (existingNames.includes(trimmed)) return `Profile "${trimmed}" already exists`;
          return true;
        },
      },
      {
        type: 'input',
        name: 'gitName',
        message: 'Author name (shown in git commits):',
        filter: (v) => v.trim(),
        validate: (v) => v.trim() ? true : 'Display name is required',
      },
      {
        type: 'input',
        name: 'gitEmail',
        message: 'Git email:',
        filter: (v) => v.trim().toLowerCase(),
        validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? true : 'Enter a valid email address',
      },
    ]);
  }

  async askSSHSetup(profileName, gitEmail, usedKeyPaths = []) {
    const { sshChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'sshChoice',
        message: 'SSH key setup:',
        choices: [
          { name: 'Generate a new SSH key', value: 'create' },
          { name: 'Use an existing SSH key', value: 'existing' },
          { name: 'Skip (configure later)', value: 'skip' },
        ],
      },
    ]);

    if (sshChoice === 'skip') return { sshKeyPath: null, sshHosts: [] };
    if (sshChoice === 'create') return this._askNewKey(profileName, gitEmail);
    return this._askExistingKey(usedKeyPaths);
  }

  async askEditProfile(profile, usedKeyPaths = []) {
    const details = await inquirer.prompt([
      {
        type: 'input',
        name: 'gitName',
        message: 'Author name (shown in git commits):',
        default: profile.gitName,
        filter: (v) => v.trim(),
        validate: (v) => v.trim() ? true : 'Display name is required',
      },
      {
        type: 'input',
        name: 'gitEmail',
        message: 'Git email:',
        default: profile.gitEmail,
        filter: (v) => v.trim().toLowerCase(),
        validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? true : 'Enter a valid email address',
      },
    ]);

    const currentKey = profile.sshKeyPath
      ? `current: ${profile.sshKeyPath}`
      : 'none configured';

    const { changeSSH } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'changeSSH',
        message: `Change SSH key? (${currentKey})`,
        default: false,
      },
    ]);

    let sshKeyPath = profile.sshKeyPath || null;
    let sshHosts = profile.sshHosts || [];

    if (changeSSH) {
      const sshData = await this.askSSHSetup(profile.name, details.gitEmail, usedKeyPaths);
      sshKeyPath = sshData.sshKeyPath;
      sshHosts = sshData.sshHosts;
    } else if (profile.sshKeyPath) {
      const currentHosts = (profile.sshHosts || []).join(', ') || 'none';
      const { changeHosts } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'changeHosts',
          message: `Update SSH hosts? (current: ${currentHosts})`,
          default: false,
        },
      ]);
      if (changeHosts) {
        sshHosts = await this._askSSHHosts(profile.sshHosts);
      }
    }

    return { ...details, sshKeyPath, sshHosts };
  }

  async confirmRemove(name) {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `Remove profile "${name}"? This cannot be undone.`,
        default: false,
      },
    ]);
    return confirmed;
  }

  async _askNewKey(profileName) {
    const { keyType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'keyType',
        message: 'Key type:',
        default: 'rsa',
        choices: [
          { name: 'RSA 4096     — widely supported, safe default', value: 'rsa', short: 'RSA 4096' },
          { name: 'Ed25519      — modern, faster, recommended for new setups', value: 'ed25519', short: 'Ed25519' },
          { name: 'ECDSA 521    — elliptic curve alternative', value: 'ecdsa', short: 'ECDSA 521' },
        ],
      },
    ]);

    const defaultPath = `~/.ssh/id_${keyType}_${profileName}`;

    const { keyPath, passphrase } = await inquirer.prompt([
      {
        type: 'input',
        name: 'keyPath',
        message: 'Key file path:',
        default: defaultPath,
        filter: (v) => v.trim(),
      },
      {
        type: 'password',
        name: 'passphrase',
        message: 'Passphrase (leave empty for none):',
        mask: '*',
      },
    ]);

    const sshHosts = await this._askSSHHosts();
    return { sshKeyPath: keyPath, passphrase, keyType, sshHosts, isNew: true };
  }

  async _askExistingKey(usedKeyPaths = []) {
    const available = this._listSSHPrivateKeys();

    let keyPath;

    if (available.length > 0) {
      const choices = available.map((k) => {
        const alreadyUsed = usedKeyPaths.includes(k);
        return {
          name: alreadyUsed ? `${k}  ⚠  already assigned to another profile` : k,
          value: k,
          short: k,
        };
      });
      choices.push({ name: 'Enter path manually', value: '__manual__', short: 'manual' });

      const { selected } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selected',
          message: 'Select an SSH key:',
          choices,
        },
      ]);

      if (selected === '__manual__') {
        keyPath = await this._askKeyPathManually();
      } else {
        keyPath = selected;

        if (usedKeyPaths.includes(keyPath)) {
          const { proceed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'proceed',
              message:
                'This key is already used by another profile. Both profiles will share the same key — switching between them will reload the same key in the agent. Continue?',
              default: false,
            },
          ]);
          if (!proceed) return this._askExistingKey(usedKeyPaths);
        }
      }
    } else {
      keyPath = await this._askKeyPathManually();
    }

    const sshHosts = await this._askSSHHosts();
    return { sshKeyPath: keyPath, sshHosts, isNew: false };
  }

  async _askKeyPathManually() {
    const { keyPath } = await inquirer.prompt([
      {
        type: 'input',
        name: 'keyPath',
        message: 'Path to private key:',
        filter: (v) => v.trim(),
        validate: (v) => {
          if (!v.trim()) return 'Path is required';
          const expanded = v.startsWith('~/') ? path.join(os.homedir(), v.slice(2)) : v;
          return fs.existsSync(expanded) ? true : `File not found: ${expanded}`;
        },
      },
    ]);
    return keyPath;
  }

  _listSSHPrivateKeys() {
    const sshDir = path.join(os.homedir(), '.ssh');
    if (!fs.existsSync(sshDir)) return [];

    const SKIP = new Set(['config', 'known_hosts', 'known_hosts.old', 'authorized_keys', 'environment']);

    try {
      return fs
        .readdirSync(sshDir)
        .filter((file) => {
          if (SKIP.has(file) || file.endsWith('.pub')) return false;
          const fullPath = path.join(sshDir, file);
          if (!fs.statSync(fullPath).isFile()) return false;
          try {
            const first = fs.readFileSync(fullPath, 'utf8').split('\n')[0];
            return first.includes('BEGIN') && (first.includes('KEY') || first.includes('OPENSSH'));
          } catch {
            return false;
          }
        })
        .map((file) => `~/.ssh/${file}`);
    } catch {
      return [];
    }
  }

  async _askSSHHosts(preSelected = []) {
    const KNOWN = ['github.com', 'gitlab.com', 'bitbucket.org'];
    const extraPreSelected = preSelected.filter((h) => !KNOWN.includes(h));

    const choices = [
      ...KNOWN.map((h) => ({ name: h, value: h, checked: preSelected.includes(h) || (preSelected.length === 0 && h === 'github.com') })),
      ...extraPreSelected.map((h) => ({ name: h, value: h, checked: true })),
      { name: 'Add custom host...', value: '__custom__' },
    ];

    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message: 'Which hosts should use this key?',
        choices,
      },
    ]);

    const known = selected.filter((h) => h !== '__custom__');

    if (!selected.includes('__custom__')) return known;

    const { custom } = await inquirer.prompt([
      {
        type: 'input',
        name: 'custom',
        message: 'Custom host(s) — separate multiple with spaces:',
        filter: (v) => v.trim(),
        validate: (v) => v.trim() ? true : 'Enter at least one host',
      },
    ]);

    const customHosts = custom.split(/\s+/).filter(Boolean);
    return [...known, ...customHosts];
  }
}

module.exports = { ProfilePrompts };
