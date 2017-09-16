# Twitter Shell bot

Executing tweets as shell command.

## Usage

Tweet begins with `:!`.

example)

```
:!date
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

## dependencies

- node
    - ([nodebrew](https://github.com/hokaccha/nodebrew) is recommended)
- node modules
    - type `npm install`
