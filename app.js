var csv = require("fast-csv"),
	https = require("https"),
	querystring = require('querystring'),
	kmeans = require('node-kmeans');

function getTrainingSetSize(total_size){
	var portion_of_test_data = 1/2;
	return total_size - total_size*portion_of_test_data;
}
var complete_data = []; 

csv("shots-10000.csv")
 .on("data", function(data){
 	complete_data.push(data);
 })
 .on("end", function(){
 	plot_velocity_angle(60);
 })
 .parse();

function plot_velocity_angle( bucketSize ){
 	var number_of_buckets = 360/bucketSize;
 	var buckets = new Array(number_of_buckets);
 	var probabilities = new Array(number_of_buckets);
 	for(var i = 0; i < getTrainingSetSize(complete_data.length); i++){
 		var velocity_angle = complete_data[i][8];
 		var bucket_index = Math.floor((parseInt(velocity_angle)+180)/bucketSize);
 		if(typeof buckets[bucket_index] == 'undefined'){
 			buckets[bucket_index] = [];
 			buckets[bucket_index][0] = 1;	
 		}else{
 			buckets[bucket_index][0] = buckets[bucket_index][0] + 1;
 		}

 		if(complete_data[i][0] == 1)
	 		if(typeof buckets[bucket_index][1] == 'undefined')
	 			buckets[bucket_index][1] = 1;
	 		else
	 			buckets[bucket_index][1]++;
 	}
 	for(var i = 0; i < number_of_buckets; i++){
 		probabilities[i] = buckets[i][1]/buckets[i][0];
 	}
 	plot(probabilities, "velocity_angle");

 }

function plot(data, filename){
	x = [];
	for(var i = 0; i < data.length; i++)
		x[i] = i;

	var barGraph = {
		"x": x,
		"y": data,
		"type": "bar"
	};
	sendData(barGraph, filename);
}

function sendData(data, filename){
	var body = {
		"un": "MirzaSikander",
		//"un":"demorestuser",
		"version":1,
		"key":"00l0hjwgzm",
		//"key": "a3oigqo33b",
		"origin": "plot",
	    "platform": "rest",
	    "kwargs": {
	        "fileopt": "overwrite",
		    "world_readable": true,
		},
	    "args": [ data ]
	}
	if(typeof filename !== 'undefined'){
		body.kwargs['filename'] = filename;
	}

	console.log(JSON.stringify(body.kwargs));
	console.log(JSON.stringify(body.args));
	body.kwargs = JSON.stringify(body.kwargs); 
	body.args = JSON.stringify(body.args);

	var encoded = querystring.stringify(body);	
	console.log();
	console.log(encoded);
	console.log();
  	var options = {
	  hostname: 'www.plot.ly',
	  path: '/clientresp',
	  method: 'POST',
	  headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': encoded.length
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
	req.write(encoded);
	req.end();
	console.log("Request sent");
}

