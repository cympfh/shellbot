const { execSync } = require('child_process');

function post(url, data, opts) {
    var cmd = `curl -s "${url}"`;

    if (data.data) {
        cmd = `${cmd} --data "${data.data}"`;
    } else if (data.form) {
        cmd = `${cmd} --form "${data.form}"`;
    }

    if (opts) {
        if (opts.headers) {
            for (var hd of opts.headers) {
                cmd = `${cmd} -H "${hd}"`;
            }
        }
        if (opts.debug) {
            console.warn(cmd);
        }
    }
    var ret = execSync(cmd).toString();
    return ret;
}

module.exports = {
    post: post
};
