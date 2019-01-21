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

var titleWeight = 3,
    articleWeight = 1;

function escapeRegExp(r) {
      return r.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    function stripRegExp(r) {
      return r.replace(/[-\/\\^$*+?.()|[\]{}]/g, '');
    }

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
          textapi.combined({
            url: record.fields.ArticleURL,
            endpoint: ['extract', 'concepts']
        }, function(err, result) {
          if (err === null) {
            var title;
            var article;
            var concepts;
            _(result.results).each(function(r) {
              if (r.endpoint == 'extract') {
                title = r.result.title;
                article = r.result.article;
              } else if (r.endpoint = 'concepts') {
                concepts = r.result.concepts;
              }
        
            });
            var cw = _.chain(concepts).map(function(o, c) {
              var w = _.chain(o.surfaceForms).map(function(sf) {
                var e = new RegExp('\\b' + escapeRegExp(sf.string) + '\\b', 'g');
                //console.log(e);
                var inArticle = (article.match(e)  || []).length;
                var inTitle = (title.match(e) || []).length;
                return (inTitle * titleWeight) + (inArticle * articleWeight);
              }).reduce(function(memo, num) { return memo + num; }, 0).value();
              
              //temporary hack - remove dbpedia
              console.log(c);
              return {'concept': c.replace("http://dbpedia.org/resource/",""), 'weight': w};
            }).sortBy(function(i) { return -i.weight; }).value();
        
            //insert the concepts in airtable - later to be moved into neo4j

            if(cw)
            {
              try
                  {
                        base('MainFeed').update(record.id, {
                            "category1": cw[0].concept,
                            "category2": cw[1].concept
                            
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

