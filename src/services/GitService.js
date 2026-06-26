'use strict';

const { execSync } = require('child_process');
const { GitConfigError } = require('../errors');

class GitService {
  apply(profile) {
    this._exec(`git config --global user.name "${profile.gitName}"`);
    this._exec(`git config --global user.email "${profile.gitEmail}"`);
    if (profile.signingKey) {
      this._exec(`git config --global user.signingkey "${profile.signingKey}"`);
      this._exec(`git config --global commit.gpgsign true`);
    }
  }

  getCurrent() {
    return {
      name: this._tryExec('git config --global user.name'),
      email: this._tryExec('git config --global user.email'),
      signingKey: this._tryExec('git config --global user.signingkey'),
    };
  }

  _exec(cmd) {
    try {
      return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (err) {
      throw new GitConfigError(`Git command failed: ${err.message}`);
    }
  }

  _tryExec(cmd) {
    try {
      return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch {
      return null;
    }
  }
}

module.exports = { GitService };
