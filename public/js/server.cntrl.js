var ngApp = angular.module('competition', [])
	.controller('categoryCtrl', function($scope){
		$scope.socket = new WebSocket("ws://0.0.0.0:8081");
		
		$scope.auth = false;
		$scope.messages = [];
		
		$scope.isShow = {
			title: true,
			main: false,
			defaultMain: false,
			round2: false,
			login: true,
			newPlForm: false,
			editPlForm: false,
			newCtForm: false,
			lmenu: false,
			rmenu: false,
		};
		$scope.editPlayerTypes = {
			edit: 'editplayer',
			delete: 'deleteplayer',
		}
		
		$scope.playerForm = [
			{name: "Number", data: 0},
			{name: "Full Name", data: ""},
			{name: "From", data: ""},
			{name: "index", data: 0},
		];

		$scope.categoryForm = [
			{name: "Full Name", data: ""},
			{name: "Short Name", data: ""},
		];
		
		$scope.blankHeader = [
			{name: 'NPlayer'},
			{name: 'NRank'},
		];
		$scope.roundHeader = [
			'1','2','3','4','5','6','7','8','9',
			'Sum',
			'Rank',
		];
		$scope.tableHeader = [
			{name: 'Player', subname: ['Number', 'Full Name','From',]},
			{name: 'Round 1 ', subname:$scope.roundHeader},
			{name: 'Round 2 ', subname:$scope.roundHeader},//ternary
			{name: 'Total', subname:["Sum", "Rank"]},
			{name: 'Compare', subname:["N", "Count"]},
		];
	
		$scope.categories = [];
		$scope.chosenCategoryIndex = -1;
		$scope.opened =  false;
		$scope.openedCategory = -1;
		$scope.openedRound = -1;
		$scope.rounds = 0;
		$scope.players = [];
		$scope.categoryFullName = "";
		$scope.confirmations = [];
		$scope.category = {
			compare: false,
		};
		
		$scope.round1 = {
			protocol: "Begin",
			begin: false,
			complete: false,
		}
		$scope.round2 = {
			protocol: "Begin",
			begin: false,
			complete: false,
		}
		
		$scope.editPlayerForm = function(index) {
			$scope.playerForm[0].data = parseInt($scope.players[index].number, 10);
			$scope.playerForm[1].data = $scope.players[index].fullName;
			$scope.playerForm[2].data = $scope.players[index].from;
			$scope.playerForm[3].data = index;

			$scope.isShow.editPlForm = true;
			$scope.isShow.main = false;
		};
		$scope.editCategoryForm = function() {
			$scope.categoryForm[0].data = $scope.categoryFullName;
			$scope.categoryForm[1].data = $scope.categories[$scope.chosenCategoryIndex];

			$scope.isShow.editCtForm = true;
			$scope.isShow.main = false;
		};
		$scope.editPlayer = function(type, all) {
			var outgoingMessage = {
				type: type,
				number: $scope.playerForm[0].data,
				fullName: $scope.playerForm[1].data,
				from: $scope.playerForm[2].data,
				index: $scope.playerForm[3].data,
				all: all,
			}			
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};
		
		$scope.editCategory = function() {
			var outgoingMessage = {
					type: "editcategory",
					fullName: $scope.categoryForm[0].data,
					shortName: $scope.categoryForm[1].data,
				};
			$scope.isShow.main = true;
			$scope.isShow.editCtForm = false;
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};
		
		$scope.deleteCategory = function() {
			var outgoingMessage = {
					type: "deletecategory",
				};
			$scope.isShow.main = false;
			$scope.isShow.editCtForm = false;
			$scope.isShow.defaultMain = true;
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};
		
		$scope.listCategories = function() {
			var outgoingMessage = {
					type: "listcategories",
				};
			//console.log("listcategories");
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};
		
		$scope.listPlayers = function() {
			var outgoingMessage = {
					type: "listplayers",
					index: $scope.chosenCategoryIndex,
				};
			console.log("listplayers");
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};	
		
		$scope.chooseCategory = function(index) {
			$scope.chosenCategoryIndex = index;
			$scope.showMain();
			var outgoingMessage = {
				type: "choosecategory",
				index: index,
			};
			
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
			
			$scope.round1.protocol = "Begin";
			$scope.round1.begin = false;
			$scope.round1.complete = false;

			$scope.round2.protocol = "Begin";
			$scope.round2.begin = false;
			$scope.round2.complete = false;

			return false;
		};
		$scope.confirmationsCounter = function(flag) {
			var counter = 0;
			if (!flag) {
				for (var i = 0; i < $scope.confirmations.length; i++) {
					if ($scope.confirmations[i]) {
						counter++;
					}
				}
			}
			//console.log($scope.confirmations);
			return counter;
		};
		$scope.showMain = function () {
			if ($scope.chosenCategoryIndex == -1) {
				$scope.isShow.defaultMain = true;
				$scope.isShow.main = false;
			} else {
				$scope.isShow.main = true;
				$scope.isShow.defaultMain = false;
			}
			$scope.isShow.login = false;
			$scope.isShow.newPlForm = false;
			$scope.isShow.editPlForm = false;
			$scope.isShow.newCtForm = false;
			$scope.isShow.editCtForm = false;
			$scope.isShow.lmenu = true;
			$scope.isShow.rmenu = true;
			//return false;
		};

		$scope.newPlayerForm = function () {
			$scope.isShow.main = false;
			$scope.isShow.defaultMain = false;
			$scope.isShow.newPlForm = true;
		};
		
		$scope.newCategoryForm = function () {
			$scope.isShow.main = false;
			$scope.isShow.defaultMain = false;
			$scope.isShow.newCtForm = true;		
		};
		$scope.createName = function() {
			if ($scope.auth) {
				return "Admin";
			} else {
				return "Please login first!";
			}
		};
		
		$scope.createTitle = function() {
			if ($scope.auth) {
				return "Category Name. Round Number";
			} else {
				return "";
			}
		};
		$scope.updateMessages = function(data) {
			$scope.messages[$scope.messages.length] = {
				//sender: data.sender,
				data: data.data,
			}
			console.log($scope.messages);
		};
		$scope.viewRoundsBtn = function() {
			$scope.round1.protocol = "Begin";
			$scope.round2.protocol = "Begin";
			if ($scope.opened) {
				if ($scope.chosenCategoryIndex == $scope.openedCategory) {
					if ($scope.openedRound == 0) {
						$scope.round1.begin = false;
						$scope.round2.begin = true;
						$scope.round1.protocol = "Return";
					} else {
						$scope.round1.begin = true;
						$scope.round2.begin = false;
						$scope.round2.protocol = "Return";
					}
				} else {
					$scope.round1.begin = true;
					$scope.round2.begin = true;
				}
			} else {
				$scope.round1.begin = false;
				$scope.round2.begin = false;
			}
		};
		
		$scope.broadcastProtocols = function(round) {
			if ($scope.opened) {
				$scope.opened = false;
				$scope.viewRoundsBtn();
				var outgoingMessage = {
					type: "returnprotocols",
				}			
			} else {
				var outgoingMessage = {
					type: "broadcastprotocols",
					round: round,
					category: $scope.chosenCategoryIndex,
				}
			}
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};
		$scope.broadcastCompare = function() {
			var outgoingMessage = {
				type: "broadcastcompare",
			}
				
			$scope.category.compare = true;
			
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};
		$scope.completeRound = function() {
			var outgoingMessage = {
				type: "completeround",
			}			
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};

		//form send to server
		
		document.forms.chat.onsubmit = function() {
			var outgoingMessage = {
					type: "chat",
					data: "Admin: " + this.message.value,
				};
				this.message.value = "";
			$scope.socket.send(JSON.stringify(outgoingMessage));
		return false;
		};
		document.forms.login.onsubmit = function() {
			var outgoingMessage = {
				type: "login",
				login: this.login.value,
				pass: this.pass.value,
			};
			
			this.login.value = "";
			this.pass.value = "";
			
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
			return false;
		};
		document.forms.category.onsubmit = function() {
			var outgoingMessage = {
				type: "addcategory",
				fullName: this.fullName.value,
				shortName: this.shortName.value,
				round1: this.round1.value,
				round2: this.round2.value,
			};
			
			this.fullName.value = "";
			this.shortName.value = "";
			this.round1.value = 1;
			this.round2.value = 0;

			if (!this.round2Check.checked) {
				//console.log(this.round2Check.checked);
				outgoingMessage.round2 = "0";
			}
			
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
			return false;
		};
		document.forms.player.onsubmit = function() {
			var outgoingMessage = {
				type: "addplayer",
				number: this.number.value,
				fullName: this.fullName.value,
				from: this.from.value,
			};
			
			this.number.value = 0;
			this.fullName.value = "";
			this.from.value = "";
				
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
			return false;
		};
		//resv from server
		$scope.socket.onmessage = function(event) {
			var data = JSON.parse(event.data);
			console.log(data);
			
			if (data.type == "chat") {
				$scope.updateMessages(data);
			}
			
			if (data.type == "login") {
				$scope.auth = data.auth;
				$scope.loginError = data.error;
				if ($scope.auth) {
					$scope.showMain();
					$scope.listCategories();
					//just belive!
					//$scope.$apply();
				} else {
					
				}
			}
			if (data.type == "listcategories") {
				$scope.categories = data.categories;
			}
			if (data.type == "listplayers") {
				$scope.players = data.players;
				$scope.rounds = data.rounds;
				$scope.categoryFullName = data.fullName;
				if ($scope.rounds == 2) {
					$scope.isShow.round2 = true;
				} else {
					$scope.isShow.round2 = false;
				};
				$scope.viewRoundsBtn();
			}
			if (data.type == "openprotocol") {
				$scope.opened =  data.opened;
				$scope.openedCategory = data.category;
				$scope.openedRound = data.round;
				$scope.confirmations = data.confirmations;
				$scope.confirmationsCounter();
				$scope.viewRoundsBtn();
			}
			if (data.type == "updateconfirmations"){
				$scope.confirmations = data.confirmations;
			}
			if (data.type == "updateresult") {
			}
			$scope.$apply()//some times I right
		};

});