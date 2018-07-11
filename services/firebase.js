//var firebase 		= require('firebase');
var admin 			= require('firebase-admin');
var serviceAccount 	= require('../config/service-account');

var firebase = admin.initializeApp({

	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://trampoapp-9510a.firebaseio.com/'

});

exports.firelord = {

	DB: 	firebase.database(),

	AUTH: 	firebase.auth(),

	REF: firebase.database.ref()
};