require('dotenv').config();

const Airtable = require('airtable');
const base = new Airtable({apiKey: process.env.API_KEY}).base('appnMFTR9pdwCgCzF');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const uuidv1 = require('uuid/v1');



app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/getplatforms', (req, res) => {

    var recordSet = [];
    var chosenSkill = req.query.chosenskill;
    console.log("fetching "+chosenSkill);

    base('MasterList').select({
        // Selecting the first 3 records in Grid view:
        maxRecords: 200,
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function(record) {
            //console.log('Retrieved', record.get('Id'));
            if(record.fields.Skills)
            {
                var skillArr = record.fields.Skills;
                //console.log(skillArr);
                if (skillArr.includes(chosenSkill))
                {
                    var result = {
                        id:uuidv1(),
                        sitename : record.fields.Sitename,
                        sitetype : record.fields.SiteType,
                        desc: record.fields.Description,
                        url : record.fields.URL,
                        usagetype : record.fields.Usagetype,
                        skills : record.fields.Skills,
                        country : record.fields.Country,
                        logo: record.fields.Logo[0]["url"]
                    }
                    recordSet.push(result);
                }
                else
                {
                    //console.log("skip");
                }
            }
            
        });
		
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    
    }, function done(err) {
        if (err) { console.error(err); return; }
        else{
            res.json(recordSet);
    
        }
    });
    


})


app.get('/getskills', (req, res) => {

    var recordSet = [];
    var chosenSkill = req.query.chosenskill;
    console.log("fetching "+chosenSkill);

    base('MasterList').select({
        // Selecting the first 3 records in Grid view:
        maxRecords: 200,
        view: "Grid view"
    }).eachPage(function page(records, fetchNextPage) {
        // This function (`page`) will get called for each page of records.
        records.forEach(function(record) {
            //console.log('Retrieved', record.get('Id'));

            if(record.fields.Skills)
            {

                var skillArr = record.fields.Skills;
                //console.log(skillArr);
    
                    skillArr.forEach(function(skill){

                        if(!recordSet.includes(skill))
                        {
                            recordSet.push(skill);
                        }
                    })
                  
            }
           

            
        });
		
        // To fetch the next page of records, call `fetchNextPage`.
        // If there are more records, `page` will get called again.
        // If there are no more records, `done` will get called.
        fetchNextPage();
    
    }, function done(err) {
        if (err) { console.error(err); return; }
        else{
            res.json(recordSet);
    
        }
    });
    


})


app.get('/getskillsold',(req, res) => {

    var recordSet = [];
    console.log("fetching");

base('MasterList').select({
        view: 'Grid view'
    }).firstPage(function(err, records) {
        if (err) { console.error(err); return; }
        records.forEach(function(record) {
            //console.log('Retrieved', record.get('Id'));

            if(record.fields.Skills)
            {

                var skillArr = record.fields.Skills;
                //console.log(skillArr);
    
                    skillArr.forEach(function(skill){

                        if(!recordSet.includes(skill))
                        {
                            recordSet.push(skill);
                        }
                    })
                  
            }
           

            
        });
		res.json(recordSet);
    });
});

app.listen(process.env.PORT, () => {
    console.log('Airtable app listening on port port!', process.env.PORT);
});
