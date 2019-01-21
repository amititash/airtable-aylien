var _ = require('underscore'),
    AYLIENTextAPI = require("aylien_textapi");

var textapi = new AYLIENTextAPI({
    application_id: "a5e2f566",
    application_key: "66ce98af5d2bb6caf9e7bd7bffe7d0ac"
});

function escapeRegExp(r) {
  return r.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

var titleWeight = 3,
    articleWeight = 1;

textapi.combined({
    url: 'http://techcrunch.com/2016/02/01/nasas-super-guppy-gives-mars-bound-spacecraft-a-lift/',
    endpoint: ['extract', 'concepts']
}, function(err, result) {
  if (err === null) {
    var title;
    var article;
    var concepts;
    var summary;
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
        var inArticle = (article.match(e)  || []).length;
        var inTitle = (title.match(e) || []).length;
        return (inTitle * titleWeight) + (inArticle * articleWeight);
      }).reduce(function(memo, num) { return memo + num; }, 0).value();

      return {'concept': c, 'weight': w};
    }).sortBy(function(i) { return -i.weight; }).value();

    console.log(cw);
    
  }
});