import 'firebase';
import * as admin 		from 'firebase-admin';
import serviceAccount 	from '../config/service-account';

var firebase = admin.initializeApp({

	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://trampoapp-9510a.firebaseio.com/'

});

export const firelord = {

	DB: 	firebase.database(),

	AUTH: 	firebase.auth(),

	REF: firebase.database.ref()
}