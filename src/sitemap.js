var fetch = require('node-fetch');
var parseString = require('xml2js').parseString;
var filters = require('../filters.json').filters;

var SITEMAP_URL = 'https://www.gjensidige.no/system/sitemap-editors.xml';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function parsXml(xml) {
    return new Promise(function(resolve, reject) {
        parseString(xml, function (err, result) {
            err ? reject(err) : resolve(result);
        });
    });
}

function fetchSiteMap() {
  return fetch(SITEMAP_URL)
    .then(response => response.text())
    .then(parsXml)
    .then(j => j.urlset.url.map(url => url.loc[0]))
    .then(urls => urls.filter(url => !filters.some(filterValue => url.indexOf(filterValue) >= 0)));
}

exports.fetchSiteMap = fetchSiteMap;
