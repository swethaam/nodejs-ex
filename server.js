//  OpenShift sample Node application
var express = require('express'),
    app     = express(),
    morgan  = require('morgan');
var path = require('path');
var fs = require('fs');
var mongodb = require('mongodb');
var ObjectID = mongodb.ObjectID;
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser'); 
var multer = require('multer');
var upload = multer({dest:'/home/swetha/uploads/'});

Object.assign=require('object-assign')

app.engine('html', require('ejs').renderFile);
app.use(morgan('combined'))

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
    ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
    mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
    mongoURLLabel = "";

if (mongoURL == null) {
  var mongoHost, mongoPort, mongoDatabase, mongoPassword, mongoUser;
  // If using plane old env vars via service discovery
  if (process.env.DATABASE_SERVICE_NAME) {
    var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase();
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'];
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'];
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'];
    mongoPassword = process.env[mongoServiceName + '_PASSWORD'];
    mongoUser = process.env[mongoServiceName + '_USER'];

  // If using env vars from secret from service binding  
  } else if (process.env.database_name) {
    mongoDatabase = process.env.database_name;
    mongoPassword = process.env.password;
    mongoUser = process.env.username;
    var mongoUriParts = process.env.uri && process.env.uri.split("//");
    if (mongoUriParts.length == 2) {
      mongoUriParts = mongoUriParts[1].split(":");
      if (mongoUriParts && mongoUriParts.length == 2) {
        mongoHost = mongoUriParts[0];
        mongoPort = mongoUriParts[1];
      }
    }
  }

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' +  mongoPort + '/' + mongoDatabase;
  }
}
var db = null,
    dbDetails = new Object();

var initDb = function(callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function(err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.get('/', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    var col = db.collection('counts');
    // Create a document with request IP and current time of request
    col.insert({ip: req.ip, date: Date.now()});
    col.count(function(err, count){
      if (err) {
        console.log('Error running count. Message:\n'+err);
      }
      res.render('index.html', { pageCountMessage : count, dbInfo: dbDetails });
    });
  } else {
    res.render('index.html', { pageCountMessage : null});
  }
});
app.get('/pagecount', function (req, res) {
  // try to initialize the db on every request if it's not already
  // initialized.
  if (!db) {
    initDb(function(err){});
  }
  if (db) {
    db.collection('counts').count(function(err, count ){
      res.send('{ pageCount: ' + count + '}');
    });
  } else {
    res.send('{ pageCount: -1 }');
  }
});
//nudity detection
app.post('/checkNude',upload.single('image'),(request,response,next)=>
{
console.log(request.file);
console.log(request.file.path);
var sightengine = require('sightengine')('450909543', '7VewSL5BPtc54hrVHXmg');
var client = request.body;
sightengine.check(['nudity','wad','offensive','scam']).set_file(request.file.path).then(function(result) 
{
console.log(result);
console.log('-------------------------------------------------------------------------------------------------------------');
var nudity = splitter('nudity',result);
var weapon = splitter('weapon',result);
var drugs = splitter('drugs',result);
var alcohol = splitter('alcohol',result);
var offence = splitter('offensive',result);
var offenceprob = splitter('prob',offence);
var scam = splitter('scam',result);
var raw = splitter('raw',nudity);
var safe = splitter('safe',nudity);
var partial = splitter('partial',nudity);
console.log(nudity);
console.log(offenceprob);
console.log(weapon);
console.log(scam);
console.log(drugs);
console.log(alcohol);
console.log(raw);
console.log(safe);
console.log(partial);
if(partial > 0.5 || raw > 0.5)
{
var res = 'Nudity not allowed !';
response.send(res);
}
else if(offenceprob > 0.5)
{
var res = 'Offencive content not allowed !';
response.send(res);
}
else if(weapon > 0.5)
{
var res = 'Offencive content not allowed !';
response.send(res);
}
else if(alcohol > 0.5 || drugs > 0.5)
{
var res = 'Drugs are not allowed !';
response.send(res);
}
else if(scam > 0.5)
{
var res = 'Scam contents not allowed !';
response.send(res);
}
else
{
var res = "Image Good";
response.send(res);
fs.readdir("/home/swetha/uploads/",(err,files)=>
{
if(err)throw err;
for(file of files)
{
fs.unlink(path.join("/home/swetha/uploads/",file),err => 
{
if(err) throw err;
});
}
});
}
function splitter(checker,jsonobj)
{
var string = JSON.stringify(jsonobj);
var objectValue = JSON.parse(string);
var result = objectValue[checker];
return result;
};
}).catch(function(err) {
console.log(err);
response.send(err);
});
});
// error handling
app.use(function(err, req, res, next){
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function(err){
  console.log('Error connecting to Mongo. Message:\n'+err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app ;
