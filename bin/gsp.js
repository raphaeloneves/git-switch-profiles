#!/usr/bin/env node
'use strict';

const { Command } = require('commander');
const { bootstrap } = require('../src/bootstrap');
const { GspError, ProfileNotFoundError } = require('../src/errors');
const pkg = require('../package.json');

const { commands, profileService, ui } = bootstrap();

const program = new Command();

program
  .name('gsp')
  .description('Manage and switch between multiple git accounts')
  .version(pkg.version, '-v, --version');

program
  .command('init')
  .alias('add')
  .description('Add a new git profile interactively')
  .action(() => run(commands.init.execute()));

program
  .command('use <name>')
  .description('Switch to a profile by name')
  .action((name) => run(commands.use.execute(name)));

program
  .command('list')
  .alias('ls')
  .description('List all profiles')
  .action(() => run(commands.list.execute()));

program
  .command('remove <name>')
  .alias('rm')
  .description('Remove a profile')
  .action((name) => run(commands.remove.execute(name)));

program
  .command('current')
  .description('Show the active profile')
  .action(() => run(commands.current.execute()));

program
  .command('info <name>')
  .description('Show detailed info for a profile')
  .action((name) => run(commands.info.execute(name)));

program
  .command('edit <name>')
  .description('Edit an existing profile')
  .action((name) => run(commands.edit.execute(name)));

// `gsp <name>` as shorthand for `gsp use <name>`
program.on('command:*', ([unknown]) => {
  try {
    profileService.getByName(unknown);
    run(commands.use.execute(unknown));
  } catch (err) {
    if (err instanceof ProfileNotFoundError) {
      ui.error(`Unknown command or profile: "${unknown}"`);
      ui.info(`Run ${ui.c.label('gsp --help')} for usage, or ${ui.c.label('gsp list')} to see profiles.`);
    } else {
      handleError(err);
    }
    process.exit(1);
  }
});

// Default: show list when called with no arguments
if (process.argv.length < 3) {
  commands.list.execute();
} else {
  program.parse(process.argv);
}

function run(promise) {
  Promise.resolve(promise).catch(handleError);
}

function handleError(err) {
  if (err instanceof GspError) {
    ui.error(err.message);
  } else {
    ui.error(`Unexpected error: ${err.message}`);
    if (process.env.DEBUG) console.error(err.stack);
  }
  process.exit(1);
}
