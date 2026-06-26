'use strict';

const { spawnSync, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { SSHKeyError } = require('../errors');

class SSHService {
  generateKeyPair({ keyPath, email, passphrase = '', keyType = 'rsa' }) {
    const fullPath = this._expand(keyPath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(fullPath)) {
      throw new SSHKeyError(`Key already exists at ${fullPath}. Choose a different path or remove it first.`);
    }

    const KEY_BITS = { rsa: '4096', ecdsa: '521' };
    const args = ['-t', keyType, '-C', email, '-f', fullPath, '-N', passphrase];
    if (KEY_BITS[keyType]) args.push('-b', KEY_BITS[keyType]);

    const result = spawnSync('ssh-keygen', args, { encoding: 'utf8' });

    if (result.status !== 0) {
      throw new SSHKeyError(`Failed to generate SSH key: ${result.stderr}`);
    }

    return fullPath;
  }

  getPublicKey(keyPath) {
    const pubPath = `${this._expand(keyPath)}.pub`;
    if (!fs.existsSync(pubPath)) {
      throw new SSHKeyError(`Public key not found at ${pubPath}`);
    }
    return fs.readFileSync(pubPath, 'utf8').trim();
  }

  loadKey(keyPath) {
    const fullPath = this._expand(keyPath);
    if (!fs.existsSync(fullPath)) {
      throw new SSHKeyError(`SSH key not found at ${fullPath}`);
    }

    const args = process.platform === 'darwin' ? ['--apple-use-keychain', fullPath] : [fullPath];
    spawnSync('ssh-add', args, { encoding: 'utf8' });
  }

  clearAgent() {
    try {
      execSync('ssh-add -D', { stdio: 'ignore' });
    } catch {
      // non-fatal: agent may not be running
    }
  }

  keyExists(keyPath) {
    return fs.existsSync(this._expand(keyPath));
  }

  _expand(keyPath) {
    if (keyPath.startsWith('~/')) {
      return path.join(os.homedir(), keyPath.slice(2));
    }
    return keyPath;
  }
}

module.exports = { SSHService };
