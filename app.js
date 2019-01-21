require('dotenv').config();

const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.API_KEY}).base('appyA5vxxYmLCEW8t');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();

//const summaryEngine = require('./summaryengine.js');
const summaryEngine = require('./aylienSummary.js');
const categoryEngine = require('./aylienConcept.js');
const imageEngine = require('./aylienImageExtract.js');

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.post('/airtablecreate', (req, res) => {

    console.log(req.body);
    
    base('MainFeed').create({
        "ArticleTitle": req.body.title,
        "ArticleContent": req.body.content,
        "ArticleURL": req.body.url,
        "ArticleCategories": req.body.categories,
        "SourceTitle": req.body.sourceTitle,
        "SourceURL": req.body.sourceURL,
        "ArticleFirstImageURL": req.body.articleImage,
    }, function(err, record) {
        if (err) { 
            res.status(500).json({
                success: false,
                err: err.message
            })    
        }
        console.log(record.getId());
        res.status(200).json({
            success: true,
            id: record.getId()
        })
    });
});

app.get('/airtablesummarise',(req, res) => {

    var recordSet = [];

    base('MainFeed').select({
        // Selecting the first 3 records in Grid view:
        //maxRecords: 10,
        pageSize: 100,
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
    
        records.forEach(function(record) {
            console.log('Processing ... ', record.id);

            // fetch each record and send it to queue for further processing 
           // summaryEngine('Fetch_Data', record.id);
            categoryEngine('Fetch_Category', record.id);
           // imageEngine('Fetch_Image', record.id);
        });
    
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        //fetchNextPage();
    
    }, function done(err) {
        if (err) { console.error(err); 
            res.send("err") }
        else { res.send("job sent");}
    });
});

app.get('/airtablefetchpage',(req, res) => {

    var recordSet = [];

base('MainFeed').select({
        view: 'Grid view'
    }).firstPage(function(err, records) {
        if (err) { console.error(err); return; }
        records.forEach(function(record) {
            console.log('Retrieved', record.get('Id'));

            var result = {
                artTitle : record.fields.ArticleTitle,
                shortSummari : record.fields.ShortSummary,
                longSummari: record.fields.LongSummary,
                artUrl : record.fields.ArticleURL,
                srcTitle : record.fields.sourceTitle,
                articleFirstImgURL : record.fields.ArticleFirstImageURL
            }
            recordSet.push(result);
        });
		res.json(recordSet);
    });
});

app.listen(process.env.PORT, () => {
    console.log('Airtable app listening on port port!', process.env.PORT);
});
