var fs = require('fs');
var sys = require("sys"); 
var WebSocketServer = new require('ws');
var express = require('express');
var path = require('path');
var Sequelize = require('sequelize');
var app = express();

app.use(express.static('public'));

var dbJSON = "db.json";
var playersJSON = "players.json";
var categoriesJSON = "categories.json";
var clone = function(data) {
	return JSON.parse(JSON.stringify(data));
}
//------------------Init DataBase-------------------
var sequelize = new Sequelize('beta_database', 'admin', 'admin', {
  host: 'localhost',
  dialect: 'postgres',
});

var Players = sequelize.define('players', {
  number: {
    type: Sequelize.INTEGER,
    primaryKey: true,
  },
  full_name: Sequelize.STRING,
  from: Sequelize.STRING
});

var Categories = sequelize.define('categories', {
  index: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  full_name: Sequelize.STRING,
  short_name: Sequelize.STRING,
  factors: Sequelize.ARRAY(Sequelize.INTEGER),
  completed: Sequelize.ARRAY(Sequelize.BOOLEAN),
});

sequelize.sync();

var PlayersCategories = sequelize.define('playersCategories', {
  judges: Sequelize.ARRAY(Sequelize.ARRAY(Sequelize.INTEGER)),
  sum: Sequelize.ARRAY(Sequelize.INTEGER),
  rank: Sequelize.ARRAY(Sequelize.INTEGER),
  total_sum: Sequelize.INTEGER,
  total_rank: Sequelize.INTEGER,
});

sequelize.sync();

Players.belongsToMany(Categories, { through: PlayersCategories})
Categories.belongsToMany(Players, { through: PlayersCategories})

sequelize.sync();
//--------DB function----------------
updateModels = function() {
	updateListPlayers();
	updateListCategories();
	updateListPlayersCategories();
};
updateListPlayers = function() {
	Players.findAll().then(function(temp) {
  		updateModelPlayers(temp);
  	});
};
updateModelPlayers = function(data) {
	DBPlayers = clone(data);	
}
updateListCategories = function() {
	Categories.findAll().then(function(temp) {
  		updateModelCategories(temp);
  	});
};
updateModelCategories= function(data) {
	DBCategories = clone(data);	
}
updateListPlayersCategories = function() {
	PlayersCategories.findAll().then(function(temp) {
  		updateModelPlayersCategories(temp);
  	});
};
updateModelPlayersCategories = function(data) {
	DBPlayersCategories = clone(data);	
}
//---------------Work with JSON files-------------------------
LoadFromJSONFile = function(fileName){
	return JSON.parse(fs.readFileSync("./" + fileName, 'utf8'));
};

SaveToJSONFile = function(fileName, data){
	fs.open("./" + fileName, "w+", 0644, function(err, file_handle) {
		if (!err) {
		    console.log("File "+fileName+" Open Success");
		    fs.write(file_handle, JSON.stringify(data), null, 'utf8', function(err, written) {
		        if (!err) {
		            console.log("Writing to File "+fileName+" Success");
		            fs.close(file_handle);
		            console.log("File "+fileName+" Close Success");
		        } else {
		            console.log("EWF!");
		        }
		    });
		} else {
		    console.log("EOF!");
		}
	});
};

//-------------Web Server----------------------
var server = app.listen(3000, function () {	
  var host = server.address().address;
  var port = server.address().port;
  console.log('HttpServer listening at http://%s:%s', host, port);
});

app.get('/server', function(req, res){
	res.sendFile(path.resolve('./server.html'))
});
app.get('/judge', function(req, res){
	res.sendFile(path.resolve('./judge.html'))
});
//---------------------Users-----------------------------------
var users = [
	{login: "admin", pass: "admin", jn: -1, websocket: null, id: 0},
	{login: "judge1", pass: "judge1", jn: 0, websocket: null, id: 1},
	{login: "judge2", pass: "judge2", jn: 1, websocket: null, id: 2},
	{login: "judge3", pass: "judge3", jn: 2, websocket: null, id: 3},
	{login: "judge4", pass: "judge4", jn: 3, websocket: null, id: 4},
	{login: "judge5", pass: "judge5", jn: 4, websocket: null, id: 5},
	{login: "judge6", pass: "judge6", jn: 5, websocket: null, id: 6},
	{login: "judge7", pass: "judge7", jn: 6, websocket: null, id: 7},
	{login: "judge8", pass: "judge8", jn: 7, websocket: null, id: 8},
	{login: "judge9", pass: "judge9", jn: 8, websocket: null, id: 9},
];
//----------------------Categories-----------------------------
var categories = LoadFromJSONFile(dbJSON);
var confirmations = [false, false, false, false, false, false, false, false, false];
selectedCategory = 0;
openedFlag = false;
compareFlag = false;
openedCategory = -1;
openedRound = -1;

var DBNodes = [];

status = {
	isProtocolOpened: false,
}

console.log(typeof(categories));
console.log(categories);

var DBPlayers = {};
var DBCategories = {};
var DBPlayersCategories = {};

updateModels();

//__init__ competition
addCategory = function(data) {

	categories[categories.length] = {
		fullName: data.fullName,
		shortName: data.shortName,
		rounds: [],
		complete: [],
		players: [],
	}
	
	addRound = function(factor) {
		temp = {
			factorOfRound: factor,
			opened: false,
			complete: false,
		};
		return temp;
	}
	
	var factors = [parseInt(data.round1, 10),];
	var completed = [false,];

	categories[categories.length - 1].rounds[0] = addRound(parseInt(data.round1, 10));
	categories[categories.length - 1].complete[0] = false;
	
	if (data.round2 != "0") {
		factors[1] = parseInt(data.round2, 10);
		completed[1] = false; 

		categories[categories.length - 1].rounds[1] = addRound(parseInt(data.round2, 10));
		categories[categories.length - 1].complete[1] = false;
	}

	Categories.create({
		full_name: data.fullName,
		short_name: data.shortName,
		factors: factors,
		completed: completed,
	});
	sequelize.sync();
	updateListCategories();
	//stub
	SaveToJSONFile(dbJSON, categories);
};
delCategory = function(data) {
	categories.splice(selectedCategory,1);
	SaveToJSONFile(dbJSON, categories);
};
editCategory = function(data) {
	categories[selectedCategory].shortName = data.shortName;
	ategories[selectedCategory].fullName = data.fullName;
	SaveToJSONFile(dbJSON, categories);
};
addPlayer = function(data) {
	//with db
	Players.findOrCreate({
	    where: {number: data.number},
	    defaults: {
	      full_name: data.fullName,
	      from: data.from,
	    }
	});

	sequelize.sync();

	var newPlId = categories[selectedCategory].players.length;
	
	categories[selectedCategory].players[newPlId] = {
		number: data.number,
		fullName: data.fullName,
		from: data.from,
		rounds: [],
		sum: 0,
		rank: 0,
		compare: false,
		count: 0,
	}
	
	for (var i = 0; i < categories[selectedCategory].rounds.length; i++) {
		categories[selectedCategory].players[newPlId].rounds[i] = {
			judges: [0, 0, 0, 0, 0, 0, 0, 0, 0],
			sum: 0,
			rank: 0,
		}
	}

	// var judges = [];
	// var sum = [];
	// var rank = [];
	// for (var i = 0; i < 2; i++) {
	// 	judges[i] = [0, 0, 0, 0, 0, 0, 0, 0, 0];
	// 	sum[i] = 0;
	// 	rank[i] = 0;
	// }
	// PlayersCategories.findOrCreate({
	// 	where: {
	// 		categoryIndex: 1,
	// 		playerNumber: 5,
	// 	},
	// 	defaults: {
	// 		judges: judges,
	// 		sum: sum,
	// 		rank: rank,
	// 		total_sum: 0,
	// 		total_rank: 0,
	// 	}
	// });
	// sequelize.sync();
	updateListPlayers();
	//stub
	SaveToJSONFile(dbJSON, categories);
};
delPlayer = function(data) {
	if (categories[i].players.length == 1) {
		categories[selectedCategory].players = [];
	} else {
		categories[selectedCategory].players.splice(data.index, data.index);
	}
	SaveToJSONFile(dbJSON, categories);
};
delAllPlayer = function(data) {
	for (var i = 0; i < categories.length; i++) {
		len = categories[i].players.length;
		while (len > 0) {
			len--;
			if (categories[i].players[len].number == data.number) {
				categories[i].players.splice(len,len);
			}
		}
		if (categories[i].players.length == 1) {
			if (categories[i].players[0].number == data.number) {
				categories[i].players = [];
			}
		}
	} 
	SaveToJSONFile(dbJSON, categories);
};
editPlayer = function(data) {
	categories[selectedCategory].players[data.index].fullName = data.fullName;
	categories[selectedCategory].players[data.index].from = data.from;
	SaveToJSONFile(dbJSON, categories);
};

//----------------------------------------------------
var clients = {};

// WebSocket
var webSocketServer = new WebSocketServer.Server({
  port: 8081
});
console.log("WebSocketServer address: localhost:8081");
webSocketServer.on('connection', function(ws) {

  var id = Math.random();
  clients[id] = ws;
  console.log("new connect " + id);

  ws.on('message', function(message) {//add type to message
    console.log('resv message ' + message);
    var data = JSON.parse(message);
    
	if (data.type == "chat") {
	    for (var key in clients) {
    		clients[key].send(message);
    	}
	};
	if (data.type == "login") {
		var auth = false;
		var id = -1;

		for (var i = 0; i < users.length; i++) {
			if (data.login == users[i].login) {
				if (data.pass == users[i].pass) {
					auth = true;
					id = users[i].id;
					break;
				} else {
					break;
				}
			}
		}
		
		var answer = {
			type: "login",
			auth: auth,
			id: id,
			error: "",
		};
		
		if (auth) {
			ws.send(JSON.stringify(answer));
		} else {
			//answer.error = DBPlayers;
			answer.error = "Uncorrect login or pass! Try again!";
			ws.send(JSON.stringify(answer));
		}
		
		if (openedFlag) {
			answer = {
				type: "openprotocol",
				opened: openedFlag,
				category: openedCategory,
				round: openedRound,
				confirmations: confirmations,
			};
			ws.send(JSON.stringify(answer));
			
			protocol = [];
			node = {nubmer: 0, rank: 0};
			for (var i = 0; i < categories[openedCategory].players.length; i++) {
				protocol[i] = {
					number: categories[openedCategory].players[i].number,
					rank: categories[openedCategory].players[i].rounds[openedRound].judges[data.judge - 1],
				}
			};
			var answer = {
				type: "protocol",
				protocol: protocol,
			};
	    	ws.send(JSON.stringify(answer));

		}
		if (compareFlag) {
			var answer = {
				type: "opencompare",
				numbers: [],
			};
			
			for (var i = 0; i < categories[openedCategory].players.length; i++) {
				answer.numbers[i] = categories[openedCategory].players[i].number;
			}
			
	    	ws.send(JSON.stringify(answer));
		}
		
	};
	if (data.type == "choosecategory") {
		selectedCategory = data.index;
		sendListPlayers();
	};
	if (data.type == "addcategory") {
		addCategory(data);
		console.log(categories);
		sendListCategories();
	};
	if (data.type == "deletecategory") {
		delCategory(data);
		console.log(categories);
		sendListCategories();
	};
	if (data.type == "editcategory") {
		editCategory(data);
		console.log(categories);
		sendListCategories();
	};
	if (data.type == "addplayer") {
		addPlayer(data);
		console.log(categories);
		sendListPlayers();
	};
	if (data.type == "deleteplayer") {
		if (data.all) {
			delAllPlayer(data);
		} else {
			console.log('del')
			delPlayer(data);
		}
		console.log(categories);
		sendListPlayers();
	};
	if (data.type == "editplayer") {
		editPlayer(data);
		console.log(categories);
		sendListPlayers();
	};
	if (data.type == "listcategories") {
		sendListCategories();
	};
	if (data.type == "broadcastprotocols") {
		openedFlag = true;
		openedCategory = data.category;
		openedRound = data.round;
		var answer = {
			type: "openprotocol",
			opened: openedFlag,
			category: openedCategory,
			round: openedRound,
			confirmations: confirmations,
		};
	    for (var key in clients) {
    		clients[key].send(JSON.stringify(answer));
    	}
	};
	if (data.type == "broadcastcompare") {
		categories[selectedCategory].compare = true;
		var answer = {
			type: "opencompare",
			numbers: [],
		};
		
		for (var i = 0; i < categories[openedCategory].players.length; i++) {
			categories[openedCategory].players[i].count = 0;
			answer.numbers[i] = categories[openedCategory].players[i].number;
		}
		
	    for (var key in clients) {
    		clients[key].send(JSON.stringify(answer));
    	}
    	sendListPlayers();

	};
	if (data.type == "protocol") {
		//openedFlag = true;
		//confirmations[data.judge - 1]
		protocol = [];
		node = {nubmer: 0, rank: 0};
		for (var i = 0; i < categories[openedCategory].players.length; i++) {
			protocol[i] = {
				number: categories[openedCategory].players[i].number,
				rank: categories[openedCategory].players[i].rounds[openedRound].judges[data.judge - 1],
			}
		};
		var answer = {
			type: "protocol",
			protocol: protocol,
			category: categories[openedCategory].fullName,
			round: openedRound,
		};
    	ws.send(JSON.stringify(answer));
	};
	if (data.type == "updateprotocol") {
		if (openedFlag) {
			categories[openedCategory].players[data.index].rounds[openedRound].judges[data.judge - 1] = data.rank;
			var answer = {
				type: "listplayers",
				rounds: categories[selectedCategory].rounds.length,
				players: categories[selectedCategory].players,
				error: "",
			};
		    for (var key in clients) {
	    		clients[key].send(JSON.stringify(answer));
	    	}
		}
		SaveToJSONFile(dbJSON, categories);
	};
	if (data.type == "passprotocol") {
		confirmations[data.judge-1] = true;
		var answer = {
		type: "updateconfirmations",
			confirmations: confirmations,
		};
		
	    for (var key in clients) {
    		clients[key].send(JSON.stringify(answer));
    	}
	};
	if (data.type == "returnprotocols") {
		confirmations = [false, false, false, false, false, false, false, false, false];
		openedFlag = false;
		var answer = {
			type: "returnprotocol",//correct?!
			opened: false,
		};
	    for (var key in clients) {
    		clients[key].send(JSON.stringify(answer));
    	}
	};
	if (data.type == "compare") {
		for (var i = 0; i < data.numbers.length; i++){
			for (var j = 0; j < categories[selectedCategory].players.length; j++) {
				if (data.numbers[i] == categories[selectedCategory].players[j].number) {
					categories[selectedCategory].players[j].count++;
					break;
				}
			}
		}
		if (true) {
			var answer = {
				type: "listplayers",
				rounds: categories[selectedCategory].rounds.length,
				players: categories[selectedCategory].players,
				error: "",
			};
		    for (var key in clients) {
	    		clients[key].send(JSON.stringify(answer));
	    	}
		}
		SaveToJSONFile(dbJSON, categories);
	};
	if (data.type == "completeround") {
		confirmations = [false, false, false, false, false, false, false, false, false];
		openedFlag = false;
		var temp = [];
		var answer = {
			type: "updateresult",
			sum: [],
			rank: [],
		};
				
		for (var i = 0; i < categories[openedCategory].players.length; i++) {
			var judges = JSON.parse(JSON.stringify(categories[openedCategory].players[i].rounds[openedRound].judges));
			judges = judges.sort();
			categories[openedCategory].players[i].rounds[openedRound].sum = 0;
			for (var j = 2; j < 7; j++) {
				categories[openedCategory].players[i].rounds[openedRound].sum+=judges[j];
			}
			temp[i] = {id: i, sum: categories[openedCategory].players[i].rounds[openedRound].sum}
			answer.sum[i] = categories[openedCategory].players[i].rounds[openedRound].sum;
		}

	    for (var i=0; i < temp.length; i++) {
	        value = temp[i];
	        for (j=i-1; j > -1 && temp[j].sum > value.sum; j--) {
	            temp[j+1] = temp[j];
	        }
	        temp[j+1] = value;
    	}
    
		for (var i = 0; i < categories[openedCategory].players.length; i++) {
			answer.rank[temp[i].id] = i+1;
			categories[openedCategory].players[temp[i].id].rounds[openedRound].rank = i+1;
		}
    	ws.send(JSON.stringify(answer));
		SaveToJSONFile(dbJSON, categories);
	};
  });

  ws.on('close', function() {
    console.log('close connection ' + id);
    delete clients[id];
  });
  
	sendListCategories = function() {
		var answer = {
			type: "listcategories",
			categories: [],
			error: DBCategories,
		};
		for (var i = 0; i < categories.length; i++) {
			answer.categories[i] =  categories[i].shortName;
		};
		
		//console.log(answer);
		ws.send(JSON.stringify(answer));
	};
	sendListPlayers = function() {
		//getAllElementsFromTable(Players);//
		var answer = {
			type: "listplayers",
			rounds: categories[selectedCategory].rounds.length,
			players: categories[selectedCategory].players,
			fullName: categories[selectedCategory].fullName,
			error: DBPlayers, //DBNodes,
			// getAllElementsFromTable(Players),
			// error: Players.findAll().then(function(players){
			// 	console.log(players);
			// }),
		};
		ws.send(JSON.stringify(answer));
	};
});

// Players.destroy({
// 	where: {number: 5},
// })

getAllElementsFromTable = function(Table) {
	Table.findAll().then(function(table) {
		DBNodes = clone(table);
	})
};