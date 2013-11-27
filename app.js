var csv = require("fast-csv"),
	https = require("https"),
	querystring = require('querystring'),
	kmeans = require('node-kmeans');

var complete_data = []; 
var listOfThingsToBeDone = [];

csv("shots-10000.csv")
 .on("data", function(data){
 	complete_data.push(data);
 })
 .on("end", function(){
 	listOfThingsToBeDone[0] = function(){ BucketsForOutliers(8, 60, -180, 180, 'velocity_angle'); }
 	listOfThingsToBeDone[1] = function(){ BucketsForOutliers(8, 10, -180, 180, 'velocity_angle'); }

 	listOfThingsToBeDone[2] = function(){ BucketsForOutliers(9, 10, 0, 30, 'dplayer_dist'); }
	listOfThingsToBeDone[3] = function(){ BucketsForOutliers(9, 2, 0, 30, 'dplayer_dist'); }

 	listOfThingsToBeDone[4] = function(){ BucketsForOutliers(10, 60, -180, 180, 'dplayer_angle'); }
 	listOfThingsToBeDone[5] = function(){ BucketsForOutliers(10, 10, -180, 180, 'dplayer_angle'); }

 	listOfThingsToBeDone[6] = function(){ BucketsForOutliers(11, 10, -40, 40, 'dplayer_velocity_mag'); }
 	listOfThingsToBeDone[7] = function(){ BucketsForOutliers(11, 2, -40, 40, 'dplayer_velocity_mag'); }

 	listOfThingsToBeDone[8] = function(){ BucketsForOutliers(12, 2, -10, 10, 'dplayer_velocity_angle'); }
 	listOfThingsToBeDone[9] = function(){ BucketsForOutliers(12, 1, -10, 10, 'dplayer_velocity_angle'); }

 	listOfThingsToBeDone.shift()();
 })
 .parse();

function getTrainingSetSize(total_size){
	var portion_of_test_data = 1/2;
	return total_size - total_size*portion_of_test_data;
}
function getTestSetSize(total_size){
	return total_size - getTrainingSetSize(total_size);
}

function fixedSizeBuckets(featureIndex, bucketSize, min, max, name ){
 	var number_of_buckets = (max-min)/bucketSize;
 	var buckets = new Array(number_of_buckets);
 	var probabilities = new Array(number_of_buckets);
 	for(var i = 0; i < getTrainingSetSize(complete_data.length); i++){
 		var velocity_angle = complete_data[i][featureIndex];
 		var bucket_index = Math.floor((parseInt(velocity_angle)+min*-1)/bucketSize);
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
 	plot(probabilities, "velocity_angle_"+bucketSize);

 	var error = 0;
 	var testSetSize = getTestSetSize(complete_data.length);
	for(var i = 5000; i< testSetSize; i++){ 		//the index of the bucket where the test entry would fall
 		var velocity_angle = complete_data[i][featureIndex];
 		var bucket_index = Math.floor((parseInt(velocity_angle)+180)/bucketSize);
 		error += Math.pow( complete_data[i][0] - probabilities[bucket_index] , 2);
 	}
 	console.log("Error rate for velocity_angle with bucketSize ("+bucketSize+"): "+error/getTestSetSize(complete_data.length));
}

function findBucketIndex(FeatureValue, min, bucketSize, number_of_buckets){
		//a little convoluted function
		//sort of creates a mapping between the values and the bucketindices
	var bucket_index = Math.floor(( parseFloat(FeatureValue)+ min*-1)/bucketSize)+1;
	//anything greater than max should be mapped to the last index
	if(bucket_index >= number_of_buckets)
		bucket_index = number_of_buckets - 1;
	if(bucket_index < 0)
		bucket_index = 0;
	return bucket_index;
}
function BucketsForOutliers(featureIndex, bucketSize, min, max, name ){
 	var number_of_buckets = (max-min)/bucketSize;
 	//adding two buckets for values less than min and anything greater than max
 	number_of_buckets+=2;
 	var buckets = new Array(number_of_buckets);
 	var probabilities = new Array(number_of_buckets);

 	for(var i = 0; i < getTrainingSetSize(complete_data.length); i++){
 		var FeatureValue = complete_data[i][featureIndex];
 		var bucket_index = findBucketIndex(FeatureValue, min, bucketSize, number_of_buckets);
 		if(typeof buckets[bucket_index] == 'undefined'){
 			buckets[bucket_index] = [];
 			buckets[bucket_index][0] = 1;	
	 		if(complete_data[i][0] == 1)
	 			buckets[bucket_index][1] = 1;
	 		else
	 			buckets[bucket_index][1] = 0;

 		}else{
 			buckets[bucket_index][0] = buckets[bucket_index][0] + 1;
	 		if(complete_data[i][0] == 1)
	 			buckets[bucket_index][1]++;
 		}

 	}

 	for(var i = 0; i < number_of_buckets; i++){
 		if(typeof buckets[i] != "undefined")
	 		probabilities[i] = buckets[i][1]/buckets[i][0];
 	}

 	var error = 0;
 	var testSetSize = getTestSetSize(complete_data.length);
 	for(var i = 5000; i < 5000 + testSetSize; i++){
 		//the index of the bucket where the test entry would fall
 		var FeatureValue = complete_data[i][featureIndex];
 		var bucket_index = findBucketIndex(FeatureValue, min, bucketSize, number_of_buckets);
 		error += Math.pow( complete_data[i][0] - probabilities[bucket_index] , 2);
 	}
 	console.log("Error rate for "+name+" with bucketSize ("+bucketSize+"): "+error/getTestSetSize(complete_data.length));
 	//
 	if(typeof probabilities[0] == 'undefined'){
 		number_of_buckets--;
 		probabilities = probabilities.slice(1, probabilities.length);
 	}
 	plot(probabilities, name+"_"+bucketSize);
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

/*	console.log(JSON.stringify(body.kwargs));
	console.log(JSON.stringify(body.args));
*/	body.kwargs = JSON.stringify(body.kwargs); 
	body.args = JSON.stringify(body.args);

	var encoded = querystring.stringify(body);	
/*	console.log();
	console.log(encoded);
	console.log();
*/  	var options = {
	  hostname: 'plot.ly',
	  path: '/clientresp',
	  port: 443,
	  method: 'POST',
	  headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': encoded.length
      }
	};
	var req = https.request(options, function(res) {
	  console.log('STATUS: ' + res.statusCode);
/*	  console.log('HEADERS: ' + JSON.stringify(res.headers));
	  res.setEncoding('utf8');
	  res.on('data', function (chunk) {
	    console.log('BODY: ' + chunk);
	  });

*/		if(listOfThingsToBeDone.length !=0)	
			listOfThingsToBeDone.shift()();
	});

	req.on('error', function(e) {
	  console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write(encoded);
	req.end();
	console.log("Request sent");
}

