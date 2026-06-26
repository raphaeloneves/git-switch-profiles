'use strict';

class RemoveCommand {
  constructor({ profileService, prompts, ui }) {
    this._service = profileService;
    this._prompts = prompts;
    this._ui = ui;
  }

  async execute(name) {
    this._service.getByName(name); // validates existence before prompting

    const confirmed = await this._prompts.confirmRemove(name);
    if (!confirmed) {
      this._ui.info('Cancelled.');
      return;
    }

    const wasActive = this._service.remove(name);
    this._ui.success(`Profile ${this._ui.c.profile(name)} removed`);

    if (wasActive) {
      this._ui.warn(`This was the active profile. Run ${this._ui.c.label('gsp <name>')} to switch to another.`);
    }

    console.log();
  }
}

module.exports = { RemoveCommand };
