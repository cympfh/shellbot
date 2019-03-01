const fs = require('fs');
const mastodon = require('./core/mastodon');
const { execFile } = require('child_process');
const yaml = require('node-yaml');

const config = yaml.readSync('./config.yml');

const mast = new mastodon.Client(config.mastodon);

const prefix = config.prefix === undefined ? ':' : config.prefix;
const re_prefix = RegExp('^' + prefix);

const ignore_unknown_command =
    config.ignore_unknown_command === undefined ? false : config.ignore_unknown_command;

// see ./bin/(executable)
process.env.PATH = `./bin:${process.env.PATH}`
config.commands = config.commands.concat(fs.readdirSync('./bin'))

function is_allow(command) {
    return (config.commands.indexOf(command) != -1);
}

// before prefix-check
function trim(text) {
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/[ \.]*@ampeloss[^ ]* */g, '');
    text = text.replace(/#.*$/, '');
    return text;
}

function parse(line) {
    line = line.replace(re_prefix, '');
    var words = line.split(' ').filter((x) => x != '');
    return words;
}

function run(line, cont) {
    var words = parse(line);
    if (is_allow(words[0])) {
        console.log('RUN', words[0], words.slice(1));
        execFile(words[0], words.slice(1), (error, stdout, stderr) => {
            if (error) {
                console.log(`Error: ${error}`);
                cont(`Error: ${error}`);
            } else {
                var text = stdout.trim();
                if (stderr) {
                    text += '\nStderr: ' + stderr.trim();
                }
                cont(text);
            }
        });
    } else {
        console.log(`command not found: ${words[0]}`);
        if (! ignore_unknown_command) {
            cont(`command not found: ${words[0]}`);
        }
    }
}


function broadcast(username, id) {
    return (result) => {
        if (/^RT  */.test(result)) {
            const url_or_id = result.replace(/^RT */, '');
            mast.retweet(url_or_id);
        } else if (/^IMAGE */.test(result)) {
            const lines = result.split('\n');
            const paths = lines[0].split(' ').slice(1);
            const text = lines.slice(1).join('\n');
            mast.reply_with_medias(username, id, text, paths);
        } else {
            mast.reply(username, id, result);
        }
    }
}

mastodon.stream((event) => {
    if (event.event_type == 'update') {
        var data = event.data;
        var username = data.account.acct;
        var id = data.id;
        var text = trim(data.content);
        if (re_prefix.test(text)) {
            run(text, broadcast(username, id));
        }
    }
}, (config.mastodon.port ? config.mastodon.port : 8080));
