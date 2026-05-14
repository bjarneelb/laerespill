// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, update, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAalM5aIHfhO40O5vlMX8CJSJDUYLzInTs",
    authDomain: "likningsspill.firebaseapp.com",
    databaseURL: "https://likningsspill-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "likningsspill",
    appId: "1:630190192081:web:71968d390422ace3f15cf0"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Eksporterer det vi trenger slik at andre filer kan bruke det
export { database, ref, set, update, onValue };
