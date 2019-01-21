/**
 * Uses the meaningcloud api to extract short summary from url
 */

var kue = require('kue')
  , jobs = kue.createQueue()
  ;

require('dotenv').config();
var request = require("request");
const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.API_KEY}).base('appyA5vxxYmLCEW8t');

function newJob (name, data){
  name = name || 'Default_Name';
  var job = jobs.create('new job', {
    name: name,
    data: data
  });

  job
    .on('complete', function (){
      console.log('Job', job.id, 'with name', job.data.name, 'is done');
    })
    .on('failed', function (){
      console.log('Job', job.id, 'with name', job.data.name, 'has failed');
    })
    .on('progress', function(progress, data){
        console.log('\r  job #' + job.id + ' ' + progress + '% complete with data ', data );
      
      });

  job.save();
}

jobs.process('new job', function (job, done){
  /* carry out all the job function here */
  console.log(job.data.data);
     // fetch each record and process it for summary via meaningcloud
    base('MainFeed').find(job.data.data, function(err, record) {
        if (err) { console.error(err); return; }
        else
        {
            console.log(record.fields.ArticleURL);
            var options = { method: 'POST',
            url: 'https://api.meaningcloud.com/summarization-1.0',
            headers: { 'content-type': 'application/x-www-form-urlencoded' },
            form: 
            { key: '67475795920f681cf2f466de88e6fbf7',
                txt: '',
               // url: 'https://factordaily.com/inside-haidian-park-the-worlds-first-artificial-intelligence-park/',
                url: record.fields.ArticleURL,
                doc: '',
                sentences: 10 } };
            request(options, function (error, response, body) {
            if (error) throw new Error(error);
            else
            {
                // take the summary and update the field with the summary
                console.log(typeof(JSON.parse(body)));

                var resJson = JSON.parse(body);
                console.log(resJson.status);
                console.log(resJson.summary);
                base('MainFeed').update(record.id, {
                    "ArticleContent": resJson.summary
                  }, function(err, record) {
                      if (err) { console.error(err); return; }
                      console.log("updated", record.id);
                      done && done();
                  });
                
            }
            });
        }
    });
});

module.exports = newJob;

//setInterval(function (){
//  newJob('Fetch_Data', "recXOf9TFbv1aQZBF");
//  newJob('Fetch_Data', "rec1s3V0TKTuzIMgs");
  //newJob('Fetch_Data', "recjMgkF5MFfjNpAi");
//}, 3000);

