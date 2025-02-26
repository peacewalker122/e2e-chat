// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
	apiKey: "-",
	authDomain: "e2e-chat-ff2a6.firebaseapp.com",
	projectId: "e2e-chat-ff2a6",
	storageBucket: "e2e-chat-ff2a6.firebasestorage.app",
	messagingSenderId: "1007345684718",
	appId: "1:1007345684718:web:d8aebc8283adfe11f823ff",
	measurementId: "G-GT09MKSMM4",
};

export const app = initializeApp(firebaseConfig);
