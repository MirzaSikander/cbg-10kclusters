var csv = require("fast-csv"),
	fs = require('fs'),
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
	  	var output_array = [];
		for(var i =0; i<res.length; i++){
			for( var j = 0; j<res[i].cluster.length; j++){
				if(typeof output_array[j] === 'undefined')
					output_array[j] = [];
				output_array[j][2*i] = res[i].cluster[j][0];
				output_array[j][2*i+1] = res[i].cluster[j][1];
			}
		}
		var text = "";
		for(var i = 0; i< output_array.length; i++){
			text += output_array[i].join()+'\n';
		}
		fs.writeFile("test.csv", text, function(err) {
		    if(err) {
		        console.log(err);
		    } else {
		        console.log("The file was saved!");
		    }
		}); 
	  	
	});	
 }