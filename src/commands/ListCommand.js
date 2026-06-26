'use strict';

class ListCommand {
  constructor({ profileService, ui }) {
    this._service = profileService;
    this._ui = ui;
  }

  execute() {
    const profiles = this._service.list();
    console.log();

    if (profiles.length === 0) {
      this._ui.info(`No profiles yet. Run ${this._ui.c.label('gsp init')} to add one.`);
      console.log();
      return;
    }

    console.log(this._ui.c.title('  Profiles'));
    console.log(this._ui.divider());
    profiles.forEach((p) => {
      console.log(this._ui.profileLine(p.name, p.isActive));
      console.log(`     ${this._ui.c.muted(p.gitEmail)}`);
    });
    console.log(this._ui.divider());
    console.log();
  }
}

module.exports = { ListCommand };
