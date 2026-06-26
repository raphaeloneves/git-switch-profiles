'use strict';

class CurrentCommand {
  constructor({ profileService, ui }) {
    this._service = profileService;
    this._ui = ui;
  }

  execute() {
    const profile = this._service.getCurrent();
    console.log();

    if (!profile) {
      this._ui.info(`No active profile. Run ${this._ui.c.label('gsp <name>')} to switch.`);
      console.log();
      return;
    }

    console.log(this._ui.c.title('  Active profile'));
    console.log(this._ui.divider());
    this._ui.field('Profile', profile.name);
    this._ui.field('Author name', profile.gitName);
    this._ui.field('Email', profile.gitEmail);
    if (profile.sshKeyPath) this._ui.field('SSH key', profile.sshKeyPath);
    if (profile.sshHosts && profile.sshHosts.length > 0) {
      this._ui.field('Hosts', profile.sshHosts.join(', '));
    }
    console.log(this._ui.divider());
    console.log();
  }
}

module.exports = { CurrentCommand };
