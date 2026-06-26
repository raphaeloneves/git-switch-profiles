'use strict';

class InfoCommand {
  constructor({ profileService, sshService, ui }) {
    this._service = profileService;
    this._ssh = sshService;
    this._ui = ui;
  }

  execute(name) {
    const profile = this._service.getByName(name);
    const current = this._service.getCurrent();
    const isActive = current && current.name === name;

    console.log();
    console.log(this._ui.c.title(`  Profile: ${name}`));
    console.log(this._ui.divider());
    this._ui.field('Status', isActive ? this._ui.c.active('active') : this._ui.c.muted('inactive'));
    this._ui.field('Author name', profile.gitName);
    this._ui.field('Email', profile.gitEmail);

    if (profile.sshKeyPath) {
      this._ui.field('SSH key', profile.sshKeyPath);
      const exists = this._ssh.keyExists(profile.sshKeyPath);
      this._ui.field('Key on disk', exists ? this._ui.c.active('yes') : this._ui.c.error('no — key missing'));

      if (exists) {
        try {
          const pub = this._ssh.getPublicKey(profile.sshKeyPath);
          const preview = pub.split(' ').slice(0, 2).join(' ');
          this._ui.field('Public key', preview.length > 50 ? preview.slice(0, 50) + '…' : preview);
        } catch {
          // public key unreadable, skip silently
        }
      }
    }

    if (profile.sshHosts && profile.sshHosts.length > 0) {
      this._ui.field('Hosts', profile.sshHosts.join(', '));
    }

    const created = profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : null;
    this._ui.field('Created', created);
    console.log(this._ui.divider());
    console.log();
  }
}

module.exports = { InfoCommand };
