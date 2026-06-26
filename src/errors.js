'use strict';

class GspError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

class ProfileNotFoundError extends GspError {
  constructor(name) {
    super(`Profile "${name}" not found. Run 'gsp list' to see available profiles.`);
    this.profileName = name;
  }
}

class ProfileAlreadyExistsError extends GspError {
  constructor(name) {
    super(`Profile "${name}" already exists. Use a different name or run 'gsp remove ${name}' first.`);
    this.profileName = name;
  }
}

class SSHKeyError extends GspError {}
class GitConfigError extends GspError {}
class SSHConfigError extends GspError {}

module.exports = {
  GspError,
  ProfileNotFoundError,
  ProfileAlreadyExistsError,
  SSHKeyError,
  GitConfigError,
  SSHConfigError,
};
