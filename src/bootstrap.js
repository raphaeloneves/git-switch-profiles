'use strict';

const { ProfileStore }     = require('./store/ProfileStore');
const { GitService }       = require('./services/GitService');
const { SSHService }       = require('./services/SSHService');
const { SSHConfigService } = require('./services/SSHConfigService');
const { ProfileService }   = require('./services/ProfileService');
const { ProfilePrompts }   = require('./prompts/ProfilePrompts');
const { UI }               = require('./ui/UI');
const { InitCommand }      = require('./commands/InitCommand');
const { UseCommand }       = require('./commands/UseCommand');
const { ListCommand }      = require('./commands/ListCommand');
const { RemoveCommand }    = require('./commands/RemoveCommand');
const { CurrentCommand }   = require('./commands/CurrentCommand');
const { InfoCommand }      = require('./commands/InfoCommand');
const { EditCommand }      = require('./commands/EditCommand');

function bootstrap() {
  const store          = new ProfileStore();
  const gitService     = new GitService();
  const sshService     = new SSHService();
  const sshConfigService = new SSHConfigService();
  const ui             = new UI();
  const prompts        = new ProfilePrompts();

  const profileService = new ProfileService({ store, gitService, sshService, sshConfigService });

  const deps = { profileService, sshService, prompts, ui };

  return {
    ui,
    profileService,
    commands: {
      init:    new InitCommand(deps),
      use:     new UseCommand(deps),
      list:    new ListCommand(deps),
      remove:  new RemoveCommand(deps),
      current: new CurrentCommand(deps),
      info:    new InfoCommand(deps),
      edit:    new EditCommand(deps),
    },
  };
}

module.exports = { bootstrap };
