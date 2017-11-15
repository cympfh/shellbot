# Twitter Shell bot

Executing tweets as shell command.

## Usage

Command Tweets forms `PREFIX + shell-command + comment`.
`PREFIX` is `:!` by default, and this is configuable.
`comment` is optional, and must begins with `#`.
`comment` will be ignored in running (this avoid tweet duplicate).

example)

```
:!date  # this is a comment
```

Pipe (`|`), if-syntax, for-syntax cannot use.
Just one process can be executed,
and allowing commands are specified by a white list (for security).

## config

```bash
$ cat .config.json
{
    "twitter": {
        "consumer_key": "******************1F*Q",
        "consumer_secret": "J************************************BEGtg",
        "access_token_key": "************************************************FC",
        "access_token_secret": "t********************************************"
    },
    "commands": [
        "date"
    ]
}
```

The `commands` is a white list, executables.

### allowed executable scripts

All under `./bin` and global command listed in `commands` filed of `.config.json` are allowed to executable.

#### protocol

All script has no input (stdin).

The output (stdout + stderr if exsists) will be posted (as a reply tweet).

##### RT

When stdout forms

```
RT (status-url)
```

, bot will RT it (please see `bin/ika` as a sample).

## dependencies

- node
    - ([nodebrew](https://github.com/hokaccha/nodebrew) is recommended)
- node modules
    - type `npm install`
