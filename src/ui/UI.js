'use strict';

const chalk = require('chalk');
const ora = require('ora');

class UI {
  get c() {
    return {
      title:   chalk.bold.cyan,
      success: chalk.bold.green,
      error:   chalk.bold.red,
      warn:    chalk.bold.yellow,
      info:    chalk.cyan,
      profile: chalk.bold.magenta,
      active:  chalk.bold.green,
      label:   chalk.bold,
      muted:   chalk.gray,
      dim:     chalk.dim,
      value:   chalk.white,
    };
  }

  spinner(text) {
    return ora({ text, color: 'cyan' });
  }

  divider() {
    return chalk.dim('─'.repeat(50));
  }

  profileLine(name, isActive) {
    return isActive
      ? `  ${this.c.active('●')} ${this.c.profile(name)} ${chalk.green('(active)')}`
      : `  ${this.c.muted('○')} ${this.c.profile(name)}`;
  }

  success(msg) {
    console.log(`${this.c.success('✓')} ${msg}`);
  }

  error(msg) {
    console.error(`${this.c.error('✗')} ${msg}`);
  }

  info(msg) {
    console.log(`${this.c.info('ℹ')} ${msg}`);
  }

  warn(msg) {
    console.log(`${this.c.warn('⚠')} ${msg}`);
  }

  field(label, value) {
    const val = value != null && value !== '' ? this.c.value(value) : chalk.dim('not set');
    console.log(`  ${this.c.label(label.padEnd(14))} ${val}`);
  }

  banner() {
    console.log();
    console.log(this.c.title('  git-switch-profiles'));
    console.log(this.c.dim('  Manage multiple git accounts with ease'));
    console.log();
  }

  publicKeyBox(pubKey, hosts) {
    console.log();
    console.log(chalk.bold.yellow('  Add this public key to your git host:'));
    if (hosts && hosts.length > 0) {
      hosts.forEach((h) => console.log(`  ${chalk.dim('→')} ${chalk.cyan(h)}`));
    }
    console.log();
    const border = chalk.dim('─'.repeat(64));
    console.log(`  ${border}`);
    const chunks = pubKey.match(/.{1,62}/g) || [pubKey];
    chunks.forEach((chunk) => console.log(`  ${chalk.green(chunk)}`));
    console.log(`  ${border}`);
    console.log();
  }
}

module.exports = { UI };
