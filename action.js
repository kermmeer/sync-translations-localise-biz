
const request = require('request');
const http = require('request-promise-native');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

module.exports = async function(options) {
    const locales = await http({
        uri: 'https://localise.biz/api/locales',
        auth: {
            user: options.apiKey,
            pass: ''
        },
        json: true
    });

    await mkdirp(options.destination);

    var updatedFiles = [];

    let query = {};
    if(options.noComments)
        query["no-comments"] = "true";
    if(options.fallbackLanguage != null)
        query["fallback"] = options.fallbackLanguage;

    let queryString = Object.keys(query).map(key => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(query[key])}`;
    }).join('&');
    if(queryString && queryString.length > 0)
        queryString = "?" + queryString

    for(let locale of locales) {
        let fileName = locale.code + '.' + options.format;
        let savedFileName = options.fileNameOverrides[locale.code];
        if(!savedFileName || savedFileName === ''){
            savedFileName = options.filePrefix + fileName;
        }
        let filePath = path.join(options.destination, savedFileName);
        let lastModifiedFilePath = path.join(options.destination, '.' + savedFileName + '.txt');

        let mtime = 0;

        try {
            mtime = fs.readFileSync(lastModifiedFilePath, 'utf8');
        } catch(e) {
            try {
                const stats = fs.statSync(filePath);
                mtime = stats.mtime;
            } catch(e) {

            }
        }

        console.log(mtime ? 'Updating' : 'Downloading', 'locale', locale.code, "(" + locale.name + ")", 'to', filePath);

        let status = await new Promise(function(resolve, reject) {
            let req = request('https://localise.biz/api/export/locale/' + fileName + queryString, {
                auth: {
                    user: options.apiKey,
                    pass: ''
                },
                headers: (mtime && {
                    'If-Modified-Since': new Date(mtime).toUTCString(),
                }) || null
            })
            .on('response', response => {
                if(response.statusCode == 200) {
                    let lastModification = response.headers['last-modified'];

                    req
                        .pipe(fs.createWriteStream(filePath))
                        .on('close', function() {
                            const stats = fs.statSync(filePath);
                            fs.utimes(filePath, new Date(stats.atime), new Date(lastModification), function() {
                                fs.writeFile(lastModifiedFilePath, lastModification, { encoding: 'utf8' }, (error) => error ? reject(error) : resolve(true));
                            });
                        });
                } else if(response.statusCode == 304) {
                    console.log('Locale', locale.code, 'is up to date.');
                    resolve(false);
                }
            })
            .on('error', reject);
        });

        if(status) {
            updatedFiles.push(fileName);
        }
    }

    if(!updatedFiles.length && options.failIfNotChanged) {
        throw new Error('No changes has been made to any file.');
    }

    console.log(updatedFiles.length, 'files are updated.');

    return updatedFiles.length;
}
