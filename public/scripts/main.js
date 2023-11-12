/**
 * @author reillydj
 */

// Global Namespace
var chess = chess || {};


// Global Variables
chess.currentUser = null;
chess.fbAuthManager = null;
chess.openingManager = null;

chess.sortedOps = [];
chess.db = null;

chess.quizIndex = 0;
chess.opened = false;



// !!CLASSES!!

// Opening
chess.opening = class {
	// Constructor
	constructor(id, name, color, img, url, about, agg, def, fle, the, gam, match) {
		this.id = id;
		this.name = name;
		this.color = color;
		this.img = img;
		this.url = url;
		this.about = about;
		this.agg = agg;
		this.def = def;
		this.fle = fle;
		this.the = the;
		this.gam = gam;
		this.match = match;

		this.favorited = chess.currentUser.isFavorited(id);
	}
}


// Openings Manager
chess.OpeningsManager = class {
	// Constructor
	constructor() {
		this._openingsSnapshots = [];
		this._ref = chess.db.collection("Openings");
	}


	// Functions

	// Retrieve all openings from firestore
	beginListening(changeListener) {
		this._unsubscribe = this._ref.limit(50).onSnapshot((querySnapshot) => {
			this._openingsSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}

	// Create an opening class for the opening at the given index
	getOpeningAtIndex(index) {
		const docSnapshot = this._openingsSnapshots[index];
		const op = new chess.opening(
			docSnapshot.id,
			docSnapshot.get("name"),
			docSnapshot.get("color"),
			docSnapshot.get("img"),
			docSnapshot.get("url"),
			docSnapshot.get("about"),
			docSnapshot.get("agg"),
			docSnapshot.get("def"),
			docSnapshot.get("fle"),
			docSnapshot.get("the"),
			docSnapshot.get("gam"),
			chess.currentUser.checkMatch(
				docSnapshot.get("agg"),
				docSnapshot.get("def"),
				docSnapshot.get("fle"),
				docSnapshot.get("the"),
				docSnapshot.get("gam")
			)
		);
		return op;
	}


	// Getters
	get length() {
		return this._openingsSnapshots.length;
	}

	get ref() {
		return this._ref;
	}
}


// Users
chess.user = class {
	// Constructor
	constructor(user) {
		// Finds user on firebase if they exist
		this.firebaseUser = user;
		this.id = user.uid;
		var docRef = chess.db.collection("Account").doc(this.id);

		// Create new user profile if they do not exist


		docRef.get().then((doc) => {
			if (doc.exists) {
				console.log("User exists! Document data:", doc.data());
			} else {
				console.log("User is new... Creating new Firebase Document");
				chess.db.collection("Account").doc(this.id).set({
					Username: user.displayName,
					About: "About",
					url: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fzultimate.com%2Fwp-content%2Fuploads%2F2019%2F12%2Fdefault-profile.png&f=1&nofb=1&ipt=00d6e127adf943c25dfec1ef87a95188dfa5ab15a1ae8ac93c18f8ad045b9d35&ipo=images",
					agg: 0,
					def: 0,
					fle: 0,
					the: 0,
					gam: 0,
				});
				chess.db.collection("Account").doc(this.id).collection("Favorites").doc("FavoriteList").set({
					EnglishOpening: false,
					CaroKannDefense: false,
					FrenchDefense: false,
					ItalianGame: false,
					KingsGambit: false,
					KingsIndian: false,
					LondonSystem: false,
					QueensGambit: false,
					RuyLopez: false,
					ScandinavianDefense: false,
					SicilianDefense: false,
					ViennaGame: false
				});
			}
		}).catch((error) => {
			console.log("Error getting document:", error);
		});
		this.docRef = chess.db.collection("Account").doc(this.id);

		// Updates class based on firebase data
		this.docRef.onSnapshot((doc) => {
			this.Username = doc.get("Username");
			this.about = doc.get("About");
			this.url = doc.get("url");
			this.agg = doc.get("agg");
			this.def = doc.get("def");
			this.fle = doc.get("fle");
			this.the = doc.get("the");
			this.gam = doc.get("gam");
		});

		this.docRef.collection("Favorites").doc("FavoriteList").onSnapshot((doc) => {
			this.CaroKannDefense = doc.get("CaroKannDefense");
			this.EnglishOpening = doc.get("EnglishOpening");
			this.FrenchDefense = doc.get("FrenchDefense");
			this.ItalianGame = doc.get("ItalianGame");
			this.KingsGambit = doc.get("KingsGambit");
			this.KingsIndian = doc.get("KingsIndian");
			this.LondonSystem = doc.get("LondonSystem");
			this.QueensGambit = doc.get("QueensGambit");
			this.RuyLopez = doc.get("RuyLopez");
			this.ScandinavianDefense = doc.get("ScandinavianDefense");
			this.SicilianDefense = doc.get("SicilianDefense");
			this.ViennaGame = doc.get("ViennaGame");
		});
	}


	// Functions

	// Signs user out
	signOut = function () {
		// Delete anonymous accounts (only if they sign out)
		if (this.firebaseUser.isAnonymous) {
			this.docRef.delete();
			this.firebaseUser.delete();
		}

		// Sign out of Firebase
		firebase.auth().signOut().then(() => {
			console.log("Signed out");
		}).catch((error) => {
			console.log("Signed in");
		});
	}

	// Sets user's preferences based on quiz answers
	preferenceValueSetter = function (preference, value) {
		switch (preference) {
			case 1:
				this.docRef.update({
					agg: value
				});
				break;
			case 2:
				this.docRef.update({
					def: value
				});
				break;
			case 3:
				this.docRef.update({
					fle: value
				});
				break;
			case 4:
				this.docRef.update({
					the: value
				});
				break;
			case 5:
				this.docRef.update({
					gam: value,
				});
				break;
			default:
				console.log("Error");
				break;
		}
	}

	// Change an opening to be favorited/unfavorited
	updateFavorite = function (id, bool) {
		switch (id) {
			case "CaroKannDefense":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					CaroKannDefense: bool
				});
				break;
			case "EnglishOpening":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					EnglishOpening: bool
				});
				break;
			case "FrenchDefense":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					FrenchDefense: bool
				});
				break;
			case "ItalianGame":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					ItalianGame: bool
				});
				break;
			case "KingsGambit":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					KingsGambit: bool
				});
				break;
			case "KingsIndian":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					KingsIndian: bool
				});
				break;
			case "LondonSystem":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					LondonSystem: bool
				});
				break;
			case "QueensGambit":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					QueensGambit: bool
				});
				break;
			case "RuyLopez":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					RuyLopez: bool
				});
				break;
			case "ScandinavianDefense":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					ScandinavianDefense: bool
				});
				break;
			case "SicilianDefense":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					SicilianDefense: bool
				});
				break;
			case "ViennaGame":
				this.docRef.collection("Favorites").doc("FavoriteList").update({
					ViennaGame: bool
				});
				break;
			default:
				console.log("Not valid opening: " + id);
				break;
		}
	}

	// Checks if the given opening id is favorited
	isFavorited = function (id) {
		switch (id) {
			case "CaroKannDefense":
				return this.CaroKannDefense;
			case "EnglishOpening":
				return this.EnglishOpening;
			case "FrenchDefense":
				return this.FrenchDefense;
			case "ItalianGame":
				return this.ItalianGame;
			case "KingsGambit":
				return this.KingsGambit;
			case "KingsIndian":
				return this.KingsIndian;
			case "LondonSystem":
				return this.LondonSystem;
			case "QueensGambit":
				return this.QueensGambit;
			case "RuyLopez":
				return this.RuyLopez;
			case "ScandinavianDefense":
				return this.ScandinavianDefense;
			case "SicilianDefense":
				return this.SicilianDefense;
			case "ViennaGame":
				return this.ViennaGame;
			default:
				console.log("Not valid opening: " + id);
				break;
		}
	}

	// Checks an openings match with the user
	checkMatch = function (agg, def, fle, the, gam) {
		let match = 20;

		match = match - Math.abs(agg - this.agg);
		match = match - Math.abs(def - this.def);
		match = match - Math.abs(the - this.the);
		match = match - Math.abs(fle - this.fle);
		match = match - Math.abs(gam - this.gam);

		return match;
	}
}


// Firebase Authentication Manager
chess.FbAuthManager = class {

	// Constructor
	constructor() {
		this._user = null;
		this.signed = false;
	}


	// Functions

	// Listen for sign in or sign out
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				this._user = user;
				this.signed = true;
			} else {
				this.signed = false;
			}
			chess.checkForRedirects();
			changeListener();
		});
	}

	// Sign Out
	signOut() {
		chess.currentUser.signOut();
		chess.currentUser = null;
	}


	// Getters
	get isSignedIn() {
		return this.signed;
	}

	get uid() {
		return this._user.uid;
	}
}



// !!PAGE CONTROLLERS!!

// Login Page
chess.LoginPageController = class {
	constructor() {
		console.log("Login Page");
		chess.startFirebaseUI();
	}
}


// Quiz Page
chess.QuizPageController = class {
	// Construct
	constructor() {
		console.log("Quiz Page");

		// Listeners for agree buttons
		const buttons = document.querySelectorAll("#buttonPanel > *");
		for (const button of buttons) {
			button.onclick = (event) => {
				if (chess.quizIndex >= 1) {
					const buttonValue = parseInt(button.dataset.buttonValue);
					chess.currentUser.preferenceValueSetter(chess.quizIndex, buttonValue);
					chess.incrementQuestion();
				}
			};
		}

		// Listeners for yes/no buttons
		document.querySelector("#yes").onclick = (event) => {
			chess.quizIndex = 1;
			document.querySelector("#accept").remove();
			document.querySelector("#question").innerHTML = "I like to play offensively:";
		}

		document.querySelector("#no").onclick = (event) => {
			chess.fbAuthManager.signOut();
		}
	}
}


// Openings Page
chess.OpeningsPageController = class {
	// Construct
	constructor() {
		console.log("Openings Page");
		chess.openingManager = new chess.OpeningsManager();
		chess.openingManager.beginListening(this.updateList.bind(this));
	}

	_createCard(opening) {
		const perc = (opening.match * 100) / 20;
		return htmlToElement(
			`<button id="openingsButton" class="${opening.color}">&#9813${opening.name} (${perc}% Match)</button>`
		);
	}

	// Update page with all openings in order of match
	updateList() {
		const newList = htmlToElement('<div id="openingsContainer"></div>');

		const ops = chess.sortOps();

		for (let i = 0; i < ops.length; i++) {
			const op = ops[i];
			const newCard = this._createCard(op);

			newCard.onclick = (event) => {
				window.location.href = `/detail.html?num=${i}`;
			};

			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#openingsContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
}


// Favorites Page
chess.FavoritesPageController = class {
	// Construct
	constructor() {
		console.log("Openings Page");
		chess.openingManager = new chess.OpeningsManager();
		chess.openingManager.beginListening(this.updateList.bind(this));
	}

	_createCard(opening) {
		const perc = (opening.match * 100) / 20;
		return htmlToElement(
			`<button id="openingsButton" class="${opening.color}">&#9813${opening.name} (${perc}% Match)</button>`
		);
	}

	// Updates page with all favorited openings
	updateList() {
		const newList = htmlToElement('<div id="openingsContainer"></div>');
		let empty = true;
		const ops = chess.sortOps();

		for (let i = 0; i < ops.length; i++) {
			const op = ops[i];
			if (op.favorited) {
				empty = false;

				const newCard = this._createCard(op);

				newCard.onclick = (event) => {
					window.location.href = `/detail.html?num=${i}`;
				};

				newList.appendChild(newCard);
			}
		}

		// If there are no favorites, let them know
		if (empty) {
			const newCard = htmlToElement(
				'<h1>No Openings Have Been Favorited Yet!</h1>'
			)
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#favoritesContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
	}
}


// Detail Page
chess.DetailPageController = class {
	// Construct
	constructor() {
		console.log("Detail Page");
		chess.openingManager = new chess.OpeningsManager();
		chess.openingManager.beginListening(this.updateList.bind(this));
	}

	// Update page to the opening num found in the url
	updateList() {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const openingNum = urlParams.get("num");
		const ops = chess.sortOps();
		const op = ops[openingNum];


		const newItem = htmlToElement(
			`<div id="detailContainer">
				<div class="detailCard">
					<h2 class="card-title">${op.name}</h2>
			  		<img class="card-image" src="${op.img}">
			  		<a class="card-link" target="_blank" href=${op.url}>Investigate the Opening Further!</a>
			  		<p class="card-about">${op.about}</p>
					  <ul class="card-list">
						<li>Aggression: ${op.agg}</li>
						<li>Defense: ${op.def}</li>
						<li>Flexibility: ${op.fle}</li>
						<li>Theory: ${op.the}</li>
						<li>Gambit: ${op.gam}</li>
					</ul>
				</div>
		  	</div>`
		);

		const oldItem = document.querySelector("#detailContainer");
		oldItem.parentElement.appendChild(newItem);
		oldItem.remove();

		// Change things if the opening is favorited
		if (op.favorited) {
			document.getElementById("favorite").style.color = "#F2D9BB";
			document.getElementById("favorite").style.backgroundColor = "#A66B49";
			document.getElementById("title").setAttribute("href", "favorites.html");
		}

		// Change things as opening is favorited/unfavorited
		document.querySelector("#favorite").onclick = (event) => {
			op.favorited = !op.favorited;
			chess.currentUser.updateFavorite(op.id, op.favorited);
			if (op.favorited) {
				document.getElementById("favorite").style.color = "#F2D9BB";
				document.getElementById("favorite").style.backgroundColor = "#A66B49";
				alertify.success('Favorited!');
				document.getElementById("title").setAttribute("href", "favorites.html");
			} else {
				document.getElementById("favorite").style.color = "#A66B49";
				document.getElementById("favorite").style.backgroundColor = "#F2D9BB";
				alertify.error('Unfavorited...');
				document.getElementById("title").setAttribute("href", "/openings.html");
			}
		}
	}
}



// !!FUNCTIONS!!

// HTML to Element
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

// Increment Question
chess.incrementQuestion = function () {
	switch (chess.quizIndex) {
		case 1:
			document.querySelector("#question").innerHTML = "I like to play defensively:";
			chess.quizIndex = chess.quizIndex + 1;
			break;
		case 2:
			document.querySelector("#question").innerHTML = "I like to play flexibly:";
			chess.quizIndex = chess.quizIndex + 1;
			break;
		case 3:
			document.querySelector("#question").innerHTML = "I like to play theory (mathematical best moves):";
			chess.quizIndex = chess.quizIndex + 1;
			break;
		case 4:
			document.querySelector("#question").innerHTML = "I like to play gambits (sacrificing material for development or traps):";
			chess.quizIndex = chess.quizIndex + 1;
			break;
		case 5:
			document.querySelector("#question").innerHTML = "I like to play offensively:";
			window.location.href = "/openings.html";
			chess.quizIndex = 1;
			break;
	}
}

/* Set the width of the side navigation to 250px */
function nav() {
	if (chess.opened) {
		document.getElementById("mySidenav").style.width = "0px"
		chess.opened = false;
	} else {
		document.getElementById("mySidenav").style.width = "250px"
		chess.opened = true;
	}
}



// Sort Openings
chess.sortOps = function () {
	chess.sortedOps = [];

	for (let i = 0; i < chess.openingManager.length; i++) {
		const op = chess.openingManager.getOpeningAtIndex(i);
		chess.sortedOps[i] = op;
	}

	chess.sortedOps.sort(function (a, b) {
		return parseFloat(b.match) - parseFloat(a.match);
	});

	return chess.sortedOps;
}


// Start Firebase UI
chess.startFirebaseUI = function () {
	// FirebaseUI config.
	var uiConfig = {
		signInSuccessUrl: 'quiz.html',
		signInOptions: [
			// Leave the lines as is for the providers you want to offer your users.
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		]
	};
	var ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', uiConfig);
}


// Check for Redirects
chess.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && chess.fbAuthManager.isSignedIn) {
		window.location.href = "/quiz.html";

	} else if (!document.querySelector("#loginPage") && !chess.fbAuthManager.isSignedIn) {
		window.location.href = "/index.html";
	}
};


// Initialize Page
chess.initializePage = function () {

	if (document.querySelector("#loginPage")) {
		new chess.LoginPageController();

	} else {
		document.querySelector("#signOut").addEventListener("click", (event) => {
			chess.fbAuthManager.signOut();
		});
	}

	if (document.querySelector("#quizPage")) {
		new chess.QuizPageController();
	}

	if (document.querySelector("#openingsPage")) {
		new chess.OpeningsPageController();
	}

	if (document.querySelector("#detailPage")) {
		new chess.DetailPageController();
	}

	if (document.querySelector("#favoritesPage")) {
		new chess.FavoritesPageController();
	}
}



// MAIN
chess.main = function () {
	console.log("Ready");

	chess.db = firebase.firestore();
	chess.fbAuthManager = new chess.FbAuthManager();
	chess.fbAuthManager.beginListening(() => {
		console.log("isSignedIn: ", chess.fbAuthManager.isSignedIn);


		if (chess.fbAuthManager.isSignedIn) {
			chess.currentUser = new chess.user(chess.fbAuthManager._user);
		}
		chess.initializePage();
	});
};

chess.main();