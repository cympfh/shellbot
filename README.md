# Mastodon Shell bot

Executing toots as shell commands.

## Usage

Command Tweets forms like

```
PREFIX shell-command comment
```

`PREFIX` is `:` by default, and this is configuable.
`comment` is optional, and must begins with `#`. This can use to avoid toot duplication.
`shell-command` string will be executed.

### example

```
:date  # this is a comment
```

### NOTE

In fact, commands will be executed not through shell (contrary to the name).
Pipe (`|`), if-syntax, for-syntax cannot use.
Moreover allowing commands are specified by a white list for security.

## config (YAML file)

```bash
$ cat config.yml
mastodon:
    server: mstdn.jp
    access_token: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    port: 8080
prefix: ":!"
commands:
  - echo
  - date
  - tenki
```

### `prefix`

`PREFIX` can be specified as `prefix` in `config.yml`.
This is written as regular expression.

#### Example

```yaml
prefix: "(:|~)"
```

### allowed executable `commands`

`commands` is the list of allowed commands.
Each command should be executable (note to PATH).

Additionally, all executable files under `./bin` is executable (no need to write in `commands`).

## protocol

All script has no input (stdin).

The output (stdout + stderr if exsists) will be posted (as a reply tweet).

### RT

When stdout forms

```
RT (status-url)
```

, bot will RT it (please see `bin/ika` as a sample).

### Image (text with medias)

Follow the local paths of the images (separated by space) after `IMAGE` at the 1st line.

```
IMAGE (path1) (path2) (path3)
(text)
```

The bot will tweets the text with medias.


## dependencies

- node
    - ([nodebrew](https://github.com/hokaccha/nodebrew) is recommended)
- node modules
    - type `npm install`
