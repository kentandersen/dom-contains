'use strict';

let fs = require('fs');
let fetch = require('node-fetch');
let parseString = require('xml2js').parseString;
let filters = require('../filters.json').filters;

let sitemapCachePath = './cache/sitemap.xml';
let SITEMAP_URL = 'https://www.gjensidige.no/system/sitemap-editors.xml';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

function getCachedSitemap() {
  return new Promise((resolve, reject) => {
    fs.readFile(sitemapCachePath, 'utf8', (e, d) => e ? reject(e) : resolve(d));
  });
}

function writeSitemapToCache(data) {
  return new Promise((resolve, reject) => {
    fs.writeFile(sitemapCachePath, data, 'utf8', e  => e ? reject(e) : resolve(data));
  });
}

function parsXml(xml) {
    return new Promise(function(resolve, reject) {
        parseString(xml, function (err, result) {
            err ? reject(err) : resolve(result);
        });
    });
}

function fetchSiteMap() {
  return getCachedSitemap()
    .catch(() => {
      console.log('Fetching site map');
      return fetch(SITEMAP_URL)
               .then(response => response.text())
               .then(writeSitemapToCache)
    })
    .then(parsXml)
    .then(j => j.urlset.url.map(url => url.loc[0]))
    .then(urls => urls.filter(url => !filters.some(filterValue => url.indexOf(filterValue) >= 0)));
}

exports.fetchSiteMap = fetchSiteMap;
