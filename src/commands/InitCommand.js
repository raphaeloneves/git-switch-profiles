'use strict';

class InitCommand {
  constructor({ profileService, sshService, prompts, ui }) {
    this._service = profileService;
    this._ssh = sshService;
    this._prompts = prompts;
    this._ui = ui;
  }

  async execute() {
    this._ui.banner();

    const existing = this._service.list();
    const existingNames = existing.map((p) => p.name);
    const usedKeyPaths = existing.map((p) => p.sshKeyPath).filter(Boolean);

    const details = await this._prompts.askProfileDetails(existingNames);
    const sshData = await this._prompts.askSSHSetup(details.name, details.gitEmail, usedKeyPaths);

    console.log();
    const spin = this._ui.spinner('Creating profile...');
    spin.start();

    if (sshData.isNew && sshData.sshKeyPath) {
      this._ssh.generateKeyPair({
        keyPath: sshData.sshKeyPath,
        email: details.gitEmail,
        passphrase: sshData.passphrase || '',
        keyType: sshData.keyType || 'rsa',
      });
    }

    this._service.add(details.name, {
      gitName: details.gitName,
      gitEmail: details.gitEmail,
      sshKeyPath: sshData.sshKeyPath || null,
      sshHosts: sshData.sshHosts || [],
      createdAt: new Date().toISOString(),
    });

    spin.succeed(`Profile ${this._ui.c.profile(details.name)} created`);

    if (sshData.sshHosts && sshData.sshHosts.length > 0) {
      const hostSpin = this._ui.spinner('Trusting host keys...');
      hostSpin.start();
      const { trusted, failed } = this._ssh.trustHosts(sshData.sshHosts);
      if (failed.length > 0) {
        hostSpin.warn(`Could not reach: ${failed.join(', ')} — add manually with ssh-keyscan`);
      } else {
        hostSpin.succeed(trusted.length > 0
          ? `Host keys trusted: ${trusted.join(', ')}`
          : 'Host keys already trusted');
      }
    }

    if (sshData.isNew && sshData.sshKeyPath) {
      const pubKey = this._ssh.getPublicKey(sshData.sshKeyPath);
      this._ui.publicKeyBox(pubKey, sshData.sshHosts);
    }

    this._ui.info(`Run ${this._ui.c.label(`gsp ${details.name}`)} to activate this profile.`);
    console.log();
  }
}

module.exports = { InitCommand };
