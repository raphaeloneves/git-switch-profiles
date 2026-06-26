# git-switch-profiles

[![npm version](https://img.shields.io/npm/v/git-switch-profiles)](https://www.npmjs.com/package/git-switch-profiles)
[![npm downloads](https://img.shields.io/npm/dm/git-switch-profiles)](https://www.npmjs.com/package/git-switch-profiles)
[![license](https://img.shields.io/npm/l/git-switch-profiles)](https://github.com/raphaeloneves/git-switch-profiles/blob/main/LICENSE)
[![node](https://img.shields.io/node/v/git-switch-profiles)](https://www.npmjs.com/package/git-switch-profiles)

Switching between a work and a personal git account is painful. You forget to change your email, push a personal commit under your company name, or spend five minutes figuring out why SSH authentication is broken.

**git-switch-profiles** fixes this. One command switches your entire git identity — name, email, and SSH key — and actively blocks the other accounts so nothing leaks through.

```bash
gsp work      # everything switches to your work identity
gsp personal  # everything switches back
```

---

## Install

```bash
npm install -g git-switch-profiles
```

**Requirements:** Node.js 14+, `git`, `ssh-keygen`, and a running `ssh-agent` (standard on macOS and most Linux distros).

---

## Setting up a profile

```bash
gsp init
```

This walks you through everything interactively:

- A name for the profile (`work`, `personal`, `freelance`, anything)
- The author name and email that will appear on your commits
- An SSH key — generate a fresh one or pick an existing key from `~/.ssh/`
- Which git hosts this profile owns (`github.com`, `gitlab.com`, `bitbucket.org`, or your own)

That's it. Your SSH host keys are trusted automatically so the first push just works.

---

## Switching profiles

```bash
gsp <name>
```

Under the hood this does three things atomically:

- Sets `user.name` and `user.email` in your global `~/.gitconfig`
- Loads the right SSH key into the agent
- Updates `~/.ssh/config` to route the active profile's hosts to the correct key, and **hard blocks** every other profile's hosts

That last part matters. When you switch to `personal`, your work hosts get `PubkeyAuthentication no` — the wrong key literally cannot authenticate, no matter what's left in the agent or macOS Keychain.

---

## All commands

| Command | Description |
|---|---|
| `gsp init` | Add a new profile |
| `gsp <name>` | Switch to a profile |
| `gsp list` | See all profiles and which is active |
| `gsp current` | Show the active profile |
| `gsp info <name>` | Full details — key path, hosts, status |
| `gsp edit <name>` | Update a profile |
| `gsp remove <name>` | Delete a profile |

---

## SSH key types

When creating a new key you can choose:

| Type | Notes |
|---|---|
| **RSA 4096** | Default. Works everywhere. |
| **Ed25519** | Modern and faster. Recommended for new setups. |
| **ECDSA 521** | Elliptic curve alternative. |

---

## Where profiles are stored

`~/.git-switch/profiles.json` — plain JSON, yours to inspect or back up.

---

## License

MIT © [Raphael Neves](https://github.com/raphaeloneves)
