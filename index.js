var fs = require('fs');
var request = require('request');
var twitter = require('twitter');
var { execFile } = require('child_process');

var config = require('./config.json');
var client = new twitter(config.twitter);

var prefix = ':!';
if (config['prefix']) prefix = config.prefix;
var re_prefix = RegExp('^' + prefix);

// see ./bin/(executable)
process.env.PATH = `./bin:${process.env.PATH}`
config.commands = config.commands.concat(fs.readdirSync('./bin'))

function is_allow(command) {
    return (config.commands.indexOf(command) != -1);
}

// before prefix-check
function trim(text) {
    text = text.replace(/[ \.]*@ampeloss */g, '');
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
        console.log('words', words);
        console.log(words[0], words.slice(1));
        execFile(words[0], words.slice(1), (error, stdout, stderr) => {
            if (error) {
                console.log(`Error: ${error}`);
                cont(`Error: ${error}`);
            } else {
                var text = stdout.trim();
                if (stderr) {
                    text = '\nStderr: ' + stderr.trim();
                }
                console.log(text);
                cont(text);
            }
        });
    } else {
        console.log(`command not found: ${words[0]}`);
        cont(`command not found: ${words[0]}`);
    }
}

function reply(username, id) {
    return (text) => {

        var post = (status) => {
            console.log('post', status);
            client.post('statuses/update', {
                status: status,
                in_reply_to_status_id: id
            }, (error, tweet, response) => {
                if (error) console.warn(error);
            });
        };

        var lines = text.split('\n');
        var status = `@${username}`;
        for (var line of lines) {
            status_n = `${status}\n${line}`;
            if (status_n.length > 140) {
                post(status);
                status = `@${username}\n${line}`;
            } else {
                status = status_n;
            }
        }
        post(status);
    }
}

function retweet(url_or_id) {
    const fs = url_or_id.trim().split('/');
    const id = fs[fs.length - 1];
    console.log('RT', id);
    client.post(`statuses/unretweet/${id}`, {}, (err, _, __) => {
        if (err) { console.warn(err); return; }
        client.post(`statuses/retweet/${id}`, {}, (err, _, __) => {
            if (err) { console.warn(err); return; }
        });
    });
}

function broadcast(username, id) {
    return (result) => {

        if (/^RT  */.test(result)) {

            const url_or_id = result.replace(/^RT */, '');
            retweet(url_or_id);

        } else {

            // just post
            reply(username, id)(result);

        }
    }
}

(function () {

    var suicide = () => {
        console.log("Good bye, world");
        process.exit();
    };

    var last_time = (new Date()).getTime();

    client.stream('user', {}, (stream) => {

        setInterval(() => {
            var now = (new Date()).getTime();
            var dmin = (now - last_time) / 1000 / 60;
            if (dmin > 10) suicide();
        }, 60);

        console.log('ready');

        stream.on('data', (tweet) => {
            last_time = (new Date()).getTime();
            if (!tweet || !tweet.user || !tweet.text) return;
            var username = tweet.user.screen_name;
            var id = tweet.id_str;
            var text = trim(tweet.text);
            if (text.indexOf(prefix) == 0) {
                run(text, broadcast(username, id));
            }
        });

        stream.on('end', () => suicide());
        stream.on('disconnect', () => suicide());
        stream.on('destroy', () => suicide());
        stream.on('close', () => suicide());
        stream.on('error', () => suicide());
    });

}());
