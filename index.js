'use strict';

let fs = require('fs');
let cheerio = require('cheerio');
var fetch = require('node-fetch');
let Duration = require('duration');
let dateFormat = require('dateformat');
let ProgressBar = require('progress');
let fetchSiteMap = require('./src/sitemap').fetchSiteMap;

var listOfPagesPath = './pages.txt';
let numberOfProcesses = 4;
let startTime = new Date();

function appendListOfPages(data) {
  return new Promise((resolve, reject) => {
    fs.appendFile(listOfPagesPath, data, e => e ? reject(e) : resolve())
  });
}

function getDocumentForUrl(url) {
  return fetch(url)
          .then(resp => resp.text())
          .then(html => cheerio.load(html));
}

function checkPage(url) {
  return getDocumentForUrl(url).then($ => {
    // there is a bug when using the :not selector with context
    // https://github.com/fb55/css-select/issues/21
    if($('table').filter(':not(.table)').length) {
      let title = $('title').text().trim();
      return appendListOfPages(`${title}\n${url}\n\n`)
    }
  });
}



console.log('\nFetching site map');
appendListOfPages(`\n\n${dateFormat(new Date(), 'mmmm dS yyyy, HH:MM')}\n------------------\n\n`)
  .then(fetchSiteMap)
  .then(sitemap => {
    console.log(`${sitemap.length} urls loaded`);

    let bar = new ProgressBar('Matching [:bar] :percent', {
      complete: '=',
      incomplete: ' ',
      width: 30,
      total: sitemap.length
    });

    let checkNextPage = () => {
      if(!sitemap.length) {
        return;
      }

      let url = sitemap.splice(0, 1)[0];
      checkPage(url)
        .then(() => bar.tick(1))
        .then(checkNextPage)
    };

    for (let i = 0; i < numberOfProcesses; i++) {
      checkNextPage();
    };

  })
  .catch(console.log.bind(console));

process.on('exit', () =>
  console.log(`\nMatching took ${new Duration(startTime, new Date()).toString(1, 1)}`)
);
