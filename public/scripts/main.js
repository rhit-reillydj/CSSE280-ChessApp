/**
 * @author reillydj
 */

var rhit = rhit || {};

rhit.currentUser = null;
rhit.fbAuthManager = null;
rhit.quizIndex = 0;
rhit.openingManager = null;
rhit.db = null;
rhit.opened = false;
rhit.sortedOps = [];


// !!CLASSES!!

// Openings
rhit.opening = class {
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

		this.favorited = rhit.currentUser.isFavorited(id);
		console.log(this.favorited);
	}
}

// Openings Manager
rhit.OpeningsManager = class {
	constructor() {
		this._openingsSnapshots = [];
		this._ref = rhit.db.collection("Openings");
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.limit(50).onSnapshot((querySnapshot) => {
			this._openingsSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this._unsubscribe();
	}

	getOpeningAtIndex(index) {
		const docSnapshot = this._openingsSnapshots[index];
		const op = new rhit.opening(
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
			rhit.currentUser.checkMatch(
				docSnapshot.get("agg"),
				docSnapshot.get("def"),
				docSnapshot.get("fle"),
				docSnapshot.get("the"),
				docSnapshot.get("gam")
			)
		);
		return op;
	}

	get length() {
		return this._openingsSnapshots.length;
	}

	get ref() {
		return this._ref;
	}
}


// Users
rhit.user = class {
	constructor(user) {
		// Finds user on firebase if they exist
		this.firebaseUser = user;
		this.id = user.uid;
		var docRef = rhit.db.collection("Account").doc(this.id);

		// Create new user profile if they do not exist


		docRef.get().then((doc) => {
			if (doc.exists) {
				console.log("User exists! Document data:", doc.data());
			} else {
				console.log("User is new... Creating new Firebase Document");
				firebase.firestore().collection("Account").doc(this.id).set({
					Username: user.displayName,
					About: "About",
					url: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fzultimate.com%2Fwp-content%2Fuploads%2F2019%2F12%2Fdefault-profile.png&f=1&nofb=1&ipt=00d6e127adf943c25dfec1ef87a95188dfa5ab15a1ae8ac93c18f8ad045b9d35&ipo=images",
					agg: 0,
					def: 0,
					fle: 0,
					the: 0,
					gam: 0,
				});
				firebase.firestore().collection("Account").doc(this.id).collection("Favorites").doc("FavoriteList").set({
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
		this.docRef = rhit.db.collection("Account").doc(this.id);

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

	checkMatch = function (agg, def, fle, the, gam) {
		let match = 20;

		match = match - Math.abs(agg - this.agg);
		match = match - Math.abs(def - this.def);
		match = match - Math.abs(the - this.the);
		match = match - Math.abs(fle - this.fle);
		match = match - Math.abs(gam - this.gam);

		console.log(match);
		return match;
	}
}


// Firebase Authentication Manager
rhit.FbAuthManager = class {

	// Construct
	constructor() {
		this._user = null;
		this.signed = false;
		console.log("You made the Auth Manager");
	}

	// Listen for sign in or sign out
	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			if (user) {
				this._user = user;
				this.signed = true;
			} else {
				this.signed = false;
			}
			rhit.checkForRedirects();
			changeListener();
		});
	}

	// Sign Out
	signOut() {
		rhit.currentUser.signOut();
		rhit.currentUser = null;
	}

	get isSignedIn() {
		return this.signed;
	}

	get uid() {
		return this._user.uid;
	}
}



// !!PAGE CONTROLLERS!

// Login Page
rhit.LoginPageController = class {
	constructor() {
		console.log("Login Page");
		
	}
}


// Quiz Page
rhit.QuizPageController = class {
	constructor() {
		console.log("Quiz Page");

		// Listeners for agree buttons
		const buttons = document.querySelectorAll("#buttonPanel > *");
		for (const button of buttons) {
			button.onclick = (event) => {
				if (rhit.quizIndex >= 1) {
					const buttonValue = parseInt(button.dataset.buttonValue);
					rhit.currentUser.preferenceValueSetter(rhit.quizIndex, buttonValue);
					rhit.incrementQuestion();
				}
			};
		}

		// Listeners for yes/no buttons
		document.querySelector("#yes").onclick = (event) => {
			rhit.quizIndex = 1;
			document.querySelector("#accept").remove();
			document.querySelector("#question").innerHTML = "I like to play offensively:";
		}

		document.querySelector("#no").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}
	}
}


// Openings Page
rhit.OpeningsPageController = class {
	constructor() {
		console.log("Openings Page");
		rhit.openingManager = new rhit.OpeningsManager();
		rhit.openingManager.beginListening(this.updateList.bind(this));
	}

	_createCard(opening) {
		const perc = (opening.match * 100) / 20;
		return htmlToElement(
			`<button id="openingsButton" class="${opening.color}">&#9813${opening.name}   (${perc}% Match)</button>`
		);
	}

	updateList() {
		const newList = htmlToElement('<div id="openingsContainer"></div>');

		const ops = rhit.sortOps();

		for (let i = 0; i < ops.length; i++) {
			const op = ops[i];
			const newCard = this._createCard(op);

			newCard.onclick = (event) => {
				window.location.href = `/detail.html?num=${i}`;
			};

			newList.appendChild(newCard);
			console.log("Appended: " + newCard);
		}

		const oldList = document.querySelector("#openingsContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
		console.log("Updated");
	}
}


// Favorites Page
rhit.FavoritesPageController = class {
	constructor() {
		console.log("Openings Page");
		rhit.openingManager = new rhit.OpeningsManager();
		rhit.openingManager.beginListening(this.updateList.bind(this));
	}

	_createCard(opening) {
		return htmlToElement(
			`<button id="openingsButton" class="${opening.color}">&#9813${opening.name}</button>`
		);
	}

	updateList() {
		const newList = htmlToElement('<div id="openingsContainer"></div>');
		let empty = true;
		for (let i = 0; i < rhit.openingManager.length; i++) {
			const op = rhit.openingManager.getOpeningAtIndex(i);
			if (op.favorited) {
				empty = false;
				const newCard = this._createCard(op);

				newCard.onclick = (event) => {
					window.location.href = `/detail.html?num=${i}`;
				};

				newList.appendChild(newCard);
				console.log("Appended: " + newCard);
			}
		}

		if (empty) {
			const newCard = htmlToElement(
				'<h1>No Openings Have Been Favorited Yet!</h1>'
			)
			newList.appendChild(newCard);
			console.log("Appended: " + newCard);
		}

		const oldList = document.querySelector("#favoritesContainer");
		oldList.removeAttribute("id");
		oldList.hidden = true;
		oldList.parentElement.appendChild(newList);
		console.log("Updated");
	}
}


// Detail Page
rhit.DetailPageController = class {
	constructor() {
		console.log("Detail Page");
		rhit.openingManager = new rhit.OpeningsManager();
		rhit.openingManager.beginListening(this.updateList.bind(this));
	}

	// Update page to the opening num found in the url
	updateList() {
		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const openingNum = urlParams.get("num");
		const ops = rhit.sortOps();
		console.log(ops);
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

		if (op.favorited) {
			console.log("Favorited");
			document.getElementById("favorite").style.color = "#F2D9BB";
			document.getElementById("favorite").style.backgroundColor = "#A66B49";
		}

		document.querySelector("#favorite").onclick = (event) => {
			op.favorited = !op.favorited;
			rhit.currentUser.updateFavorite(op.id, op.favorited);
			if (op.favorited) {
				document.getElementById("favorite").style.color = "#F2D9BB";
				document.getElementById("favorite").style.backgroundColor = "#A66B49";
				alertify.success('Favorited!');
			} else {
				document.getElementById("favorite").style.color = "#A66B49";
				document.getElementById("favorite").style.backgroundColor = "#F2D9BB";
				alertify.error('Unfavorited...');
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
rhit.incrementQuestion = function () {
	switch (rhit.quizIndex) {
		case 1:
			document.querySelector("#question").innerHTML = "I like to play defensively:";
			rhit.quizIndex = rhit.quizIndex + 1;
			break;
		case 2:
			document.querySelector("#question").innerHTML = "I like to play flexibly:";
			rhit.quizIndex = rhit.quizIndex + 1;
			break;
		case 3:
			document.querySelector("#question").innerHTML = "I like to play theory (mathematical best moves):";
			rhit.quizIndex = rhit.quizIndex + 1;
			break;
		case 4:
			document.querySelector("#question").innerHTML = "I like to play gambits (sacrificing material for development or traps):";
			rhit.quizIndex = rhit.quizIndex + 1;
			break;
		case 5:
			document.querySelector("#question").innerHTML = "I like to play offensively:";
			window.location.href = "/openings.html";
			rhit.quizIndex = 1;
			break;
	}
}


// Start Firebase UI
rhit.startFirebaseUI = function () {
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


// Sort Openings
rhit.sortOps = function () {
	rhit.sortedOps = [];

	for (let i = 0; i < rhit.openingManager.length; i++) {
		const op = rhit.openingManager.getOpeningAtIndex(i);
		rhit.sortedOps[i] = op;
	}

	console.log(rhit.sortedOps);

	rhit.sortedOps.sort(function (a, b) {
		return parseFloat(b.match) - parseFloat(a.match);
	});

	return rhit.sortedOps;
}

// Check for Redirects
rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/quiz.html";
	} else if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/index.html";
	}
};


// Initialize Page
rhit.initializePage = function () {

	if (document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
		rhit.startFirebaseUI();
	} else {
		document.querySelector("#signOut").addEventListener("click", (event) => {
			rhit.fbAuthManager.signOut();
		});
	}

	if (document.querySelector("#quizPage")) {
		new rhit.QuizPageController();
	}

	if (document.querySelector("#openingsPage")) {
		new rhit.OpeningsPageController();
	}

	if (document.querySelector("#detailPage")) {
		new rhit.DetailPageController();
	}

	if (document.querySelector("#favoritesPage")) {
		new rhit.FavoritesPageController();
	}
}

/* Set the width of the side navigation to 250px */
function nav() {
	if (rhit.opened) {
		document.getElementById("mySidenav").style.width = "0px"
		rhit.opened = false;
	} else {
		document.getElementById("mySidenav").style.width = "250px"
		rhit.opened = true;
	}
}



// MAIN
rhit.main = function () {
	console.log("Ready");

	rhit.db = firebase.firestore();
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("isSignedIn: ", rhit.fbAuthManager.isSignedIn);


		if (rhit.fbAuthManager.isSignedIn) {
			rhit.currentUser = new rhit.user(rhit.fbAuthManager._user);
		}
		rhit.initializePage();
	});
};

rhit.main();















window.alertComponent = function () {
	return {
		openAlertBox: false,
		alertBackgroundColor: '',
		alertMessage: '',
		showAlert(type) {
			this.openAlertBox = true
			switch (type) {
				case 'success':
					this.alertBackgroundColor = 'bg-green-500'
					this.alertMessage = `${this.successIcon} ${this.defaultSuccessMessage}`
					break
				case 'info':
					this.alertBackgroundColor = 'bg-blue-500'
					this.alertMessage = `${this.infoIcon} ${this.defaultInfoMessage}`
					break
				case 'warning':
					this.alertBackgroundColor = 'bg-yellow-500'
					this.alertMessage = `${this.warningIcon} ${this.defaultWarningMessage}`
					break
				case 'danger':
					this.alertBackgroundColor = 'bg-red-500'
					this.alertMessage = `${this.dangerIcon} ${this.defaultDangerMessage}`
					break
			}
			this.openAlertBox = true
		},
		successIcon: `<svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 mr-2 text-white"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
		infoIcon: `<svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 mr-2 text-white"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
		warningIcon: `<svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 mr-2 text-white"><path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`,
		dangerIcon: `<svg fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" stroke="currentColor" class="w-5 h-5 mr-2 text-white"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>`,
		defaultInfoMessage: `This alert contains info message.`,
		defaultSuccessMessage: `This alert contains success message.`,
		defaultWarningMessage: `This alert contains warning message.`,
		defaultDangerMessage: `This alert contains danger message.`,
	}
}