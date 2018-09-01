const curl = require('./curl');
const fs = require('fs');

class Client {

    constructor(config) {
        this.server = config.server;
        this.access_token = config.access_token;
    }

    reply(username, id, msg) {
        var url = `https://${this.server}/api/v1/statuses`;
        var status = encodeURIComponent(`@${username} ${msg}`);
        var data = `visibility=unlisted&in_reply_to_id=${id}&status=${status}`;
        curl.post(url, {data: data}, {headers: [`Authorization: Bearer ${this.access_token}`]});
    }

    reply_with_medias(username, id, msg, media_paths) {

        // uploading
        var media_ids = [];
        for (var p of media_paths) {
            var url = `https://${this.server}/api/v1/media`;
            var ret = curl.post(url, {form: `file=@${p}`}, {headers: [`Authorization: Bearer ${this.access_token}`]});
            media_ids.push(JSON.parse(ret).id);
        }

        // create status
        var url = `https://${this.server}/api/v1/statuses`;
        var status = encodeURIComponent(`@${username} ${msg}`);
        var data = `visibility=unlisted&in_reply_to_id=${id}&status=${status}`;
        for (var id of media_ids) {
            data = `${data}&media_ids[]=${id}`;
        }
        curl.post(url, {data: data}, {headers: [`Authorization: Bearer ${this.access_token}`]});
    }

    retweet(url_or_id) {
        // TODO (not implemented)
        const fs = url_or_id.trim().split('/');
        const id = fs[fs.length - 1];
        console.log('RT', id);
    }


}

function stream(callback, port=8080) {

    var app = require('express')();

    app.post('/', (req, res) => {
        var body = '';
        req.on('data', (chunk) => {
            body += chunk;
        });
        req.on('end', () => {
            var data = JSON.parse(body);
            callback(data);
            res.send('OK');
        });
    });

    app.listen(port, () => console.log(`listen on ${port}`));
}

module.exports = {
    Client: Client,
    stream: stream
};
