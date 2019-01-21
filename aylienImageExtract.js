/**
 * 
 * Uses the resoomer api to extract short and long summaries from url
 */
var kue = require('kue')
  , jobs = kue.createQueue();

var _ = require('underscore');

require('dotenv').config();
var request = require("request");
const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.API_KEY}).base('appyA5vxxYmLCEW8t');


var AYLIENTextAPI = require('aylien_textapi');
var textapi = new AYLIENTextAPI({
  application_id: "a5e2f566",
  application_key: "66ce98af5d2bb6caf9e7bd7bffe7d0ac"
});


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
          textapi.extract({
            url: record.fields.ArticleURL,
            best_image: true
          }, function(error, response) {
            if (error === null) {
              console.log(response);
              try
                  {
                       //insert the concepts in airtable - later to be moved into neo4j
                        base('MainFeed').update(record.id, {
                            "ArticleFirstImageURL": response.image
                            
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
  //newJob('Fetch_Data', "recha23nySNbgkZOa");
//  newJob('Fetch_Data', "rec1s3V0TKTuzIMgs");
  //newJob('Fetch_Data', "recjMgkF5MFfjNpAi");
//}, 3000);

