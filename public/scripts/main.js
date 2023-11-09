/**
 * @author reillydj
 */

var rhit = rhit || {};
rhit.currentUser = null;
rhit.quizIndex = 0;
rhit.openingManager = null;


// !!CLASSES!!

// Openings
rhit.opening = class {
	constructor(id, name, url, about, agg, def, fle, the, gam) {
		this.id = id,
		this.name = name;
		this.url = url;
		this.about = about;
		this.agg = agg;
		this.def = def;
		this.fle = fle;
		this.the = the;
		this.gam = gam;
	}
}

rhit.OpeningsManager = class {
	constructor() {
		this._openingsSnapshots = [];
		this._ref = firebase.firestore().collection("Openings");
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
			docSnapshot.get("url"),
			docSnapshot.get("about"),
			docSnapshot.get("agg"),
			docSnapshot.get("def"),
			docSnapshot.get("fle"),
			docSnapshot.get("the"),
			docSnapshot.get("gam")
		);
		return op;
	}

	getLength = function() {
		return this._openingsSnapshots.length;
	}
}


// Users
rhit.User = class {
	constructor(User) {
		// Finds user on firebase if they exist
		this.firebaseUser = User;
		this.id = User.uid;
		this._ref = firebase.firestore().collection("Account").doc(this.id);

		// Create new user profile if they do not exist
		if (!this._ref.initialized) {
			this._ref.set({
				Username: User.displayName,
				About: "",
				url: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fzultimate.com%2Fwp-content%2Fuploads%2F2019%2F12%2Fdefault-profile.png&f=1&nofb=1&ipt=00d6e127adf943c25dfec1ef87a95188dfa5ab15a1ae8ac93c18f8ad045b9d35&ipo=images",
				agg: 0,
				def: 0,
				fle: 0,
				the: 0,
				gam: 0,
				quizzed: false,
				initialized: true
			});
			this._ref.collection("Favorites").doc("FavoriteList").set({
				EnglishOpening: true,
				QueensGambit: false
				
			});
		}

		// Updates class based on firebase data
		this._ref.onSnapshot((doc) => {
			this.User = firebase.firestore().collection("Account").doc(this.id);
			this.Username = doc.get("Username");
			this.about = doc.get("About");
			this.url = doc.get("url");
			this.agg = doc.get("agg");
			this.def = doc.get("def");
			this.fle = doc.get("fle");
			this.the = doc.get("the");
			this.gam = doc.get("gam");
			this.quizzed = doc.get("quizzed");
			this.initialized = doc.get("initialized");
		});
	}

	// Signs user out
	signOut = function () {
		// Delete anonymous accounts (only if they sign out)
		if (this.firebaseUser.isAnonymous) {
			this._ref.delete();
			this.firebaseUser.delete();
		}

		firebase.auth().signOut().then(() => {
			console.log("Signed out");
		}).catch((error) => {
			console.log("Signed in");
		});
		rhit.currentUser = null;
	}

	// Sets user's preferences based on quiz answers
	preferenceValueSetter = function (preference, value) {
		switch (preference) {
			case 1:
				this._ref.agg = value;
				this.agg = value;
				break;
			case 2:
				this._ref.def = value;
				this.def = value;
				break;
			case 3:
				this._ref.fle = value;
				this.fle = value;
				break;
			case 4:
				this._ref.the = value;
				this.the = value;
				break;
			case 5:
				this._ref.gam = value;
				this.gam = value;
				this._ref.quizzed = true;
				this.quizzed = true;
				break;
			default:
				console.log("Error");
				break;
		}
	}

	getRef = function() {
		return this._ref;
	}
}



// !!PAGE CONTROLLERS!

// Login Page
rhit.LoginPageController = class {
	constructor() {
		console.log("Login Page");
		rhit.startFirebaseUI();
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
			rhit.currentUser.signOut();
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
		return htmlToElement(
			`<div class="detailCard">
				<div class="card-body">
					<a class="card-title">&#9813${opening.Name}</a>
			  	</div>
			</div>`
		);
	}

	updateList() {
		const newList = htmlToElement('<div id="openingListContainer"></div>');
		for (let i = 0; i < rhit.openingManager.getLength(); i++) {
			const op = rhit.openingManager.getOpeningAtIndex(i);
			const newCard = this._createCard(op);

			newCard.onclick = (event) => {
				window.location.href = `/detail.html?name=${op.id}`;
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


// Detail Page
rhit.DetailPageController = class {
	constructor() {
		console.log("Detail Page");

		const queryString = window.location.search;
		const urlParams = new URLSearchParams(queryString);
		const openingId = urlParams.get("id");
		favorited = rhit.currentUser.getRef().collection("Favorites").doc("FavoriteList").get(openingId);
		docSnapshot = OpeningsManager._ref.get(openingId);


		if(favorited) {
			console.log("Favorited");
			document.getElementById("#favorite").body.style.color = "#592411";
			document.getElementById("#favorite").style.backgroundColor = "#A66B49";
		}

		document.querySelector("#favorite").onclick = (event) => {
			
			// this.style.color =
		}
	}
}


// Profile Page
rhit.ProfilePageController = class {
	constructor() {
		console.log("Login Page");
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


// Check for Redirects
rhit.checkForRedirects = function () {
	if (!document.querySelector("#loginPage") && !rhit.currentUser) {
		window.location.href = "/";
	} else if (rhit.currentUser) {
		if (!document.querySelector("#quizPage") && (rhit.currentUser.quizzed == false)) {
			window.location.href = "/quiz.html";
		} else if (document.querySelector("#loginPage") && (rhit.currentUser.quizzed == true)) {
			window.location.href = "/profile.html";
		}
	}
};


// Firebase Begin
rhit.firebaseBegin = function () {
	firebase.auth().onAuthStateChanged((User) => {
		if (User) {
			rhit.currentUser = new rhit.User(User);
			console.log("User signed in");
			console.log("Quizzed: " + rhit.currentUser.quizzed);
		} else {
			console.log("Not signed in");
		}
		rhit.checkForRedirects();
	});
}


// Start Firebase UI
rhit.startFirebaseUI = function () {
	// FirebaseUI config.
	var uiConfig = {
		signInSuccessUrl: '/quiz.html',
		signInOptions: [
			// firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
	};
	// Firebase login widget
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', uiConfig);
}


// Initialize Page
rhit.initializePage = function () {

	if (document.querySelector("#loginPage")) {
		new rhit.LoginPageController();
	} else {
		document.querySelector("#signOut").addEventListener("click", (event) => {
			this.currentUser.signOut();
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

	if (document.querySelector("#profilePage")) {
		new rhit.ProfilePageController();
	}
}


// MAIN
rhit.main = function () {
	console.log("Ready");
	rhit.firebaseBegin();
	rhit.initializePage();
};

rhit.main();
