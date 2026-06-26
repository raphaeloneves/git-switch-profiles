'use strict';

class UseCommand {
  constructor({ profileService, ui }) {
    this._service = profileService;
    this._ui = ui;
  }

  async execute(name) {
    const spin = this._ui.spinner(`Switching to ${this._ui.c.profile(name)}...`);
    spin.start();

    const profile = this._service.switchTo(name);
    spin.succeed(`Switched to ${this._ui.c.profile(name)}`);

    console.log();
    this._ui.field('Author name', profile.gitName);
    this._ui.field('Email', profile.gitEmail);
    if (profile.sshKeyPath) this._ui.field('SSH key', profile.sshKeyPath);
    if (profile.sshHosts && profile.sshHosts.length > 0) {
      this._ui.field('Hosts', profile.sshHosts.join(', '));
    }
    console.log();
  }
}

module.exports = { UseCommand };
