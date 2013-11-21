var csv = require("fast-csv"),
	https = require("https"),
	querystring = require('querystring'),
	kmeans = require('node-kmeans');


var complete_data = []; 
csv("shots-10000.csv")
 .on("data", function(data){

 	complete_data.push(data);
 })
 .on("end", function(){
 	doKMeans();
 })
 .parse();

 function doKMeans(){
	var vectors = new Array();
	for (var i = 0 ; i < complete_data.length ; i++)
	  vectors[i] = [ complete_data[i][6] , complete_data[i][1]];

	kmeans.clusterize(vectors, {k: 10}, function(err,res) {
	  	if (err){console.error(err); return;}

		var body = {
			"un": "Vinit",
			"key":"pj28077pzl",
			"origin": "plot",
		    "platform": "lisp",
		    "kwargs": {
		        "filename": "KMeans",
		        "fileopt": "overwrite",
			    "world_readable": true,
			},
		    "args":[]
		}

		for(var i =0; i<res.length; i++){
			var all_x = [];
			var all_y = [];
			for( var j = 0; j<res[i].cluster.length; j++){
				all_x.push( res[i].cluster[j][0]);
				all_y.push( res[i].cluster[j][1]);
			}
			var cluster = {"x": all_x, "y": all_y, "type": "scatter", "mode": "markers"}
			body.args.push(cluster);
		}

	  	var options = {
		  hostname: 'www.plot.ly',
		  port: 443,
		  path: '/clientresp',
		  method: 'POST',
		  headers: {
	          'Content-Type': 'application/x-www-form-urlencoded',
	          'Content-Length': body.length
	      }
		};


		var req = https.request(options, function(res) {
		  console.log('STATUS: ' + res.statusCode);
		  console.log('HEADERS: ' + JSON.stringify(res.headers));
		  res.setEncoding('utf8');
		  res.on('data', function (chunk) {
		    console.log('BODY: ' + chunk);
		  });
		});

		req.on('error', function(e) {
		  console.log('problem with request: ' + e.message);
		});

		// write data to request body
		req.write(body);
		req.end();
		});	
	 }