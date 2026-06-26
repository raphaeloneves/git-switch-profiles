# git-switch-profiles

> Painlessly manage and switch between multiple git accounts — work, personal, or any other.

If you've ever had to remember to change your `~/.gitconfig`, juggle SSH keys, and wonder why your personal commits keep showing up under your work email (or worse, the other way around) — this tool is for you.

`gsp` wraps each git identity into a named profile. One command switches everything: git config, SSH key in the agent, and `~/.ssh/config`. Inactive profiles are actively blocked so the wrong key can never sneak through.

---

## Install

```bash
npm install -g git-switch-profiles
```

---

## Quick start

```bash
# Add your first profile
gsp init

# Add another
gsp init

# List profiles
gsp list

# Switch
gsp work
gsp personal
```

---

## Commands

| Command | Alias | Description |
|---|---|---|
| `gsp init` | `gsp add` | Add a new profile interactively |
| `gsp <name>` | `gsp use <name>` | Switch to a profile |
| `gsp list` | `gsp ls` | List all profiles |
| `gsp current` | | Show the active profile |
| `gsp info <name>` | | Show full details for a profile |
| `gsp edit <name>` | | Edit an existing profile |
| `gsp remove <name>` | `gsp rm <name>` | Remove a profile |

---

## What `gsp init` sets up

Running `gsp init` walks you through an interactive setup:

- **Profile name** — a short identifier like `work` or `personal`
- **Author name** — shown in git commits (`user.name`)
- **Email** — shown in git commits (`user.email`)
- **SSH key** — generate a new one (RSA 4096, Ed25519, or ECDSA 521) or pick an existing key from `~/.ssh/`
- **Hosts** — which git hosts this key covers (`github.com`, `gitlab.com`, `bitbucket.org`, or custom)

Host keys are added to `~/.ssh/known_hosts` automatically so your first push never fails with a host verification error.

---

## What switching does

Running `gsp work` (or any profile name):

1. Updates `~/.gitconfig` — sets `user.name` and `user.email` globally
2. Reloads the SSH agent — clears existing keys and loads the profile's key
3. Rewrites the managed block in `~/.ssh/config`:
   - Active profile's hosts → routed to the correct identity file
   - All other profiles' hosts → `PubkeyAuthentication no` (hard blocked)

This means switching to `personal` makes it impossible to accidentally push to a work repo under the wrong identity, and vice versa.

```
# ~/.ssh/config (managed block, updated on every switch)

# active: personal
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_personal
  IdentitiesOnly yes

# blocked: work
Host bitbucket.org
  PubkeyAuthentication no
```

Only the block between the markers is managed — everything else in your `~/.ssh/config` is left untouched.

---

## SSH key types

When generating a new key, `gsp` supports:

| Type | Flag | Notes |
|---|---|---|
| RSA 4096 | `-t rsa -b 4096` | Default — widest compatibility |
| Ed25519 | `-t ed25519` | Modern, faster, recommended for new setups |
| ECDSA 521 | `-t ecdsa -b 521` | Elliptic curve alternative |

---

## Profile storage

Profiles are stored in `~/.git-switch/profiles.json`. The file is plain JSON — you can inspect or back it up manually at any time.

---

## License

MIT © [Raphael Neves](https://github.com/raphaeloneves)
