// app.js

// 1. PASTE YOUR FIREBASE CONFIGURATION HERE
const firebaseConfig = {
    apiKey: "AIza...",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "12345...",
    appId: "1:12345..."
};

// 2. Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 3. Write a function to interact with Firebase and the HTML
async function displayUserData() {
    try {
        // Get a reference to our HTML element
        const nicknameElement = document.getElementById('nickname-display');

        // Example: Get a user document from the 'users' collection in Firestore
        // Replace 'some_user_id' with a real UID from your database
        const userDoc = await db.collection('users').doc('some_user_id').get();

        if (userDoc.exists) {
            // If the document exists, get the nickname
            const nickname = userDoc.data().nickname;
            // Display the nickname in our HTML
            nicknameElement.textContent = nickname;
        } else {
            // If the document doesn't exist
            nicknameElement.textContent = "Guest";
        }
    } catch (error) {
        console.error("Error fetching user data:", error);
        const nicknameElement = document.getElementById('nickname-display');
        nicknameElement.textContent = "Error!";
    }
}

// 4. Call the function when the page loads
document.addEventListener('DOMContentLoaded', () => {
    displayUserData();
});