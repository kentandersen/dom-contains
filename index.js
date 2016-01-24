'use strict';

let fs = require('fs');
let jsdom = require('node-jsdom');
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
  return new Promise((resolve, reject) => {
    jsdom.env(url, (e, w) => {
      e ? reject(e) : resolve(w.document, w);
      w.close();
    });
  });
}

function checkPage(url) {
  return getDocumentForUrl(url).then((document, window)=> {
    if(document.querySelector('table:not(.table)')) {
      let title = document.head.querySelector('title').textContent;
      return appendListOfPages(`${title}\n${url}\n\n`).then(() => window);
    }

    return Promise.resovle(window);
  }).then(w => w.close());
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
      if(sitemap.length === 0) {
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
  console.log(`Matching took ${new Duration(startTime, new Date()).toString(1, 1)}`)
);
