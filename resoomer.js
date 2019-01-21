/**
 * 
 * Uses the resoomer api to extract short and long summaries from url
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
            url: 'https://resoomer.pro/summarizer/size/',
            qs: 
            { API_KEY: '72A6C7D9F9799DF8CA43B38AAEC4719F',
                url: record.fields.ArticleURL }
            };

            request(options, function (error, response, body) 
            {
            if (error) throw new Error(error);

            else
            {
                try{

                    // take the summary and update the field with the summary
                console.log(typeof(body));
                var resJson = JSON.parse(body);
                console.log(resJson.smallText.content);
                console.log(resJson.mediumText.content);
                console.log(resJson.longText.content);
                
                base('MainFeed').update(record.id, {
                    "ShortSummary": resJson.smallText.content,
                    "LongSummary": resJson.mediumText.content
                  }, function(err, record) {
                      if (err) { console.error(err); return; }
                      console.log("updated", record.id);
                      done && done();
                  }); 

                }
                catch(error)
                {
                    console.log(error);
                }
                
            }

            });
        }
    });
});

module.exports = newJob;

//setInterval(function (){
//  newJob('Fetch_Data', "recha23nySNbgkZOa");
//  newJob('Fetch_Data', "rec1s3V0TKTuzIMgs");
  //newJob('Fetch_Data', "recjMgkF5MFfjNpAi");
//}, 3000);

