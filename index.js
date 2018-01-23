const fs = require('fs');
const request = require('request');
const twitter = require('twitter');
const { execFile } = require('child_process');

const config = require('./config.json');
const client = new twitter(config.twitter);

const prefix = config.prefix === undefined ? ':!' : config.prefix;
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
                    text += '\nStderr: ' + stderr.trim();
                }
                console.log(text);
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

function reply_with_medias(username, id) {
    return (text, paths) => {

        function post(media_ids) {
            console.log('post', text, media_ids);
            const status = `@${username}`.slice(0, 140);
            client.post('statuses/update', {
                status: status,
                in_reply_to_status_id: id,
                media_ids: media_ids.join(',')
            }, (error, tweet, response) => {
                if (error) console.warn(error);
            });
        };

        // upload
        function loop(i, media_ids) {

            if (i >= paths.length) {
                return post(media_ids);
            }

            const path = paths[i];
            const data = fs.readFileSync(path);
            client.post('media/upload', {media: data}, (err, media, response) => {
                if (err) {
                    console.warn(err);
                }
                const media_id = media.media_id_string;
                media_ids.push(media_id);
                loop(i + 1, media_ids);
            });
        }
        loop(0, []);
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

        } else if (/^IMAGE */.test(result)) {

            const lines = result.split('\n');
            const paths = lines[0].split(' ').slice(1);
            const text = lines.slice(1).join('\n');
            reply_with_medias(username, id)(text, paths);

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
            if (re_prefix.test(text)) {
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
