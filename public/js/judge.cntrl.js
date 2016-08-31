angular.module('judge', [])
	.controller("categoryCtrl", function($scope){
		$scope.socket = new WebSocket("ws://0.0.0.0:8081");//fix it!
		$scope.id = -1;
		$scope.auth = false;
		$scope.loginError = "";
		$scope.playersInComp = 5;
		$scope.messages = [];
		$scope.protocol = [];
		$scope.ranks = [];
		
		$scope.isShow = {
			title: true,
			main: false,
			defaultMain: false,
			login: true,
			lmenu: false,
			rmenu: false,
			comp: false,
			mainRank: false,
		};
		
		$scope.categories = [];
		$scope.selectedCategory = 0;
		$scope.selectedRound = 0;
		$scope.selectedPlayerId = 0;
		$scope.players = [];
		$scope.playersToComp = [];
		$scope.protocol = [];
		$scope.playersToComp = [];
		
		$scope.header = [
			{name: 'NPlayer', subname:[]},
			{name: 'NRank', subname:[]},
		];

		//------------------------------------------
		$scope.colors = [ 
			'#aaaa00',
			'#00aa00',
			'#aa0000',
		];
		/*------------------------*/
		$scope.recountRanks  = function(){
			for (i = 0; i < $scope.ranks.length; i++) {
				$scope.ranks[i].count = 0;
			}
			for (i = 0; i <$scope.protocol.length; i++) {
				$scope.ranks[$scope.protocol[i].rank].count++;
			}
			
		};
		$scope.setColor = function (index) {
			var colorId = 1;
			var temp = $scope.ranks[index].count;
			
			if (index == 0) {
				temp++;
			}
			if (temp > 1) {
				colorId = 2;
			}
			if (temp < 1) {
				colorId = 0;
			}
			
			return $scope.colors[colorId];
			
		};
		$scope.setColorInProtocol = function (index) {
			var colorId = 1; 
			var temp = $scope.ranks[$scope.protocol[index].rank].count;
			
			if ($scope.protocol[index].rank == 0) {
				temp++;
			}
			if (temp > 1) {
				colorId = 2;
			}
			if (temp < 1) {
				colorId = 0;
			}
			
			return $scope.colors[colorId];
		};
		$scope.isProtocolCorrect = function () {
			for (i = 1; i < $scope.ranks.length; i++) {
				if ($scope.ranks[i].count != 1) {
					return true;
				}
			}
			return false;
		};

		$scope.selectRank = function(index) {
			if ($scope.selectedPlayerId == index & $scope.isShow.mainRank) {
				$scope.isShow.mainRank = false;
			} else {
				$scope.selectedPlayerId = index;
				$scope.isShow.mainRank = true;
			}
		}
		$scope.selectRankConfirmation = function(index) {
			$scope.protocol[$scope.selectedPlayerId].rank = index;
			$scope.recountRanks();
			$scope.isShow.mainRank = false;
			
			var outgoingMessage = {
				type: "updateprotocol",
				judge: $scope.id,
				index: $scope.selectedPlayerId,
				rank: index,
			};
			$scope.socket.send(JSON.stringify(outgoingMessage));
		}		
		$scope.passProtocol = function() {
			var outgoingMessage = {
				type: "passprotocol",
				judge: $scope.id,
			};
			$scope.isShow.main = false;
			$scope.isShow.defaultMain = true;
			$scope.socket.send(JSON.stringify(outgoingMessage));
		};
		$scope.countChosen = function() {
			var count = 0;
			angular.forEach($scope.playersToComp, function(player) {
				count += player.chosen ? 1 : 0;
			});
			return count;
		};
		$scope.checkCountChosen = function() {
			if ($scope.countChosen() == $scope.playersInComp) {
				return false;
			} else {
				return true;
			} 
		};

		$scope.createName = function() {
			if ($scope.auth) {
				return "Judge #" + $scope.id;
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
		document.forms.login.onsubmit = function() {
			var outgoingMessage = {
				type: "login",
				login: this.login.value,
				pass: this.pass.value,
			};
			//$scope.myName = this.login.value;
			this.login.value = "";
			this.pass.value = "";
			
			console.log(outgoingMessage);
			$scope.socket.send(JSON.stringify(outgoingMessage));
			return false;
		};
		document.forms.chat.onsubmit = function() {
			var outgoingMessage = {
					type: "chat",
					data: "J" + $scope.id + ": " + this.message.value,
				};
				this.message.value = "";
			$scope.socket.send(JSON.stringify(outgoingMessage));
		return false;
		};
		//link with button!!!
		$scope.sendCompare = function() {
			var outgoingMessage = {
					type: "compare",
					numbers: [],
				};

			for (i = 0; i < $scope.playersToComp.length; i++) {
				if ($scope.playersToComp[i].chosen) {
					outgoingMessage.numbers[i] = $scope.playersToComp[i].number;
				}
			}
			$scope.isShow.comp = false;
			$scope.socket.send(JSON.stringify(outgoingMessage));
			return false;
		};

		$scope.socket.onmessage = function(event) {
			var data = JSON.parse(event.data);
			console.log(data);
			
			if (data.type == "chat") {
				$scope.updateMessages(data);
			}
			
			if (data.type == "login") {
				$scope.auth = data.auth;
				$scope.loginError = data.error;
				$scope.id = data.id;
				if ($scope.auth) {
					$scope.isShow.login = false;
					//$scope.isShow.main = false;
					$scope.isShow.defaultMain = true;
					$scope.isShow.lmenu = true;
					$scope.isShow.rmenu = true;
				} else {
					
				}
			}
			
			if (data.type == "opencompare") {
				if ($scope.auth) {
					$scope.isShow.comp = true;
					for (var i = 0; i < data.numbers.length; i++) {
						$scope.playersToComp[i] = {
							number: data.numbers[i], 
							chosen: false,
						}
					}
				}
			}
			if (data.type == "openprotocol") {
				if ($scope.id > 0) {
					var outgoingMessage = {
							type: "protocol",
							judge: $scope.id,
						};
					$scope.socket.send(JSON.stringify(outgoingMessage));
				}
			}
			if (data.type == "protocol") {
				$scope.protocol = data.protocol;
				$scope.ranks = [];
				$scope.ranks = [
					{count: $scope.protocol.length,},
				];
				for (i = 1; i < $scope.protocol.length+1; i++) {
					$scope.ranks[i] = {
						count: 0,
					}
				};
				$scope.isShow.main = true;
				$scope.isShow.defaultMain = false;
			}
			if (data.type == "returnprotocol") {
				$scope.protocol = [];
				$scope.ranks = [];
				$scope.isShow.main = false;
				$scope.isShow.defaultMain = true;
			}
			$scope.$apply();
		};
});