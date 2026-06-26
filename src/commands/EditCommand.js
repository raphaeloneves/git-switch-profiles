'use strict';

class EditCommand {
  constructor({ profileService, sshService, prompts, ui }) {
    this._service = profileService;
    this._ssh = sshService;
    this._prompts = prompts;
    this._ui = ui;
  }

  async execute(name) {
    const profile = this._service.getByName(name);

    const usedKeyPaths = this._service
      .list()
      .filter((p) => p.name !== name)
      .map((p) => p.sshKeyPath)
      .filter(Boolean);

    console.log();
    this._ui.info(`Editing profile ${this._ui.c.profile(name)} — press Enter to keep current values`);
    console.log();

    const updates = await this._prompts.askEditProfile(profile, usedKeyPaths);

    console.log();
    const spin = this._ui.spinner('Saving changes...');
    spin.start();

    if (updates.isNew && updates.sshKeyPath) {
      this._ssh.generateKeyPair({
        keyPath: updates.sshKeyPath,
        email: updates.gitEmail,
        passphrase: updates.passphrase || '',
        keyType: updates.keyType || 'rsa',
      });
    }

    this._service.edit(name, {
      gitName: updates.gitName,
      gitEmail: updates.gitEmail,
      sshKeyPath: updates.sshKeyPath,
      sshHosts: updates.sshHosts,
    });

    const isActive = this._service.getCurrent()?.name === name;
    if (isActive) {
      this._service.switchTo(name);
    }

    spin.succeed(`Profile ${this._ui.c.profile(name)} updated${isActive ? ' and re-applied' : ''}`);

    if (updates.isNew && updates.sshKeyPath) {
      const pubKey = this._ssh.getPublicKey(updates.sshKeyPath);
      this._ui.publicKeyBox(pubKey, updates.sshHosts);
    }

    console.log();
  }
}

module.exports = { EditCommand };
