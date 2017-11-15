const express = require('express');
const app = express();
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const mongoose = require('mongoose');
const fetch = require('node-fetch');

const Search = require('./model/Search');

const DEFAULT_OFFSET = 0;

// Connect to the DB
mongoose.connect(process.env.DB_URI, { useMongoClient: true });
mongoose.Promise = global.Promise; 

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// Configure webpack 
const config = require('../webpack.dev.config');
const compiler = webpack(config);
app.use(webpackDevMiddleware(compiler, {
  publicPath: config.output.publicPath,
  stats: {colors: true}
}));


// Make a search based on the keys? in the URL
app.get('/api/search/:term', async (req, res) => {
  
  // Get the keys
  const term = req.params.term;
  const offset = req.query.offset || DEFAULT_OFFSET;
  
  // Use the Qwant Images API (it does not need a key)
  const query = "https://api.qwant.com/api/search/images?count=10&offset="+offset+"&q="+term;
  const response = await fetch(query);
  const data = await response.json();
  const results = data.data.result.items.slice();
  
  // Filter properties to only keep the interesting ones
  // url, snippet, thumbnail, context, desc 
  const resultsFiltered = results.map( (result) => {
    return {
      url: result.media,
      snippet: result.title,
      thumbnail: result.thumbnail,
      context: result.url      
    }
  });
  
  // Display the result
  res.json(resultsFiltered);
  
  // Add the search to the database
  const search = new Search({ term:term , when: new Date() });
  search.save();
  res.end();
});


// Show searches, with the latest first
app.get('/api/latest', async (req, res) => {
  
  let searches = await Search.find();
  searches.sort((a,b) => { return b.when - a.when });
  searches = searches.slice(0,10); // Limit to 10 results
  
  res.json(searches.map(search => search.toObject()));
});


// listen for requests
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
