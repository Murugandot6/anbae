// app.js - The Single JavaScript File for Your Entire Website

// --- 1. FIREBASE SDK IMPORTS (MODERN v9 SYNTAX) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- 2. FIREBASE CONFIGURATION ---
// PASTE YOUR UNIQUE FIREBASE CONFIGURATION OBJECT HERE
const firebaseConfig = {
  apiKey: "AIzaSyA8QfLoifA2-DjldYaMBeIge1D6TbRpBWw",
  authDomain: "summa-57ad5.firebaseapp.com",
  projectId: "summa-57ad5",
  storageBucket: "summa-57ad5.appspot.com",
  messagingSenderId: "472212537134",
  appId: "1:472212537134:web:fc930ea95fa9b7ffc4c4bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- 3. MAIN LOGIC (RUNS AFTER HTML LOADS) ---
document.addEventListener('DOMContentLoaded', () => {
    const pagePath = window.location.pathname.split("/").pop();
    console.log("Current Page:", pagePath || "index.html");

    // --- LOGIC FOR: index.html (Homepage) ---
    if (pagePath === 'index.html' || pagePath === '') {
        // Redirect logged-in users to the dashboard
        onAuthStateChanged(auth, user => {
            if (user) window.location.replace('dashboard.html');
        });

        // Navigation buttons
        document.getElementById('login-button')?.addEventListener('click', () => { window.location.href = 'login.html'; });
        document.getElementById('register-button')?.addEventListener('click', () => { window.location.href = 'register.html'; });

        // Typing animation for the homepage search bar
        const typingTextElement = document.getElementById('typing-text');
        if (typingTextElement) {
            const sentences = ["Express how you feel...", "Share a beautiful memory...", "Let's resolve this together...", "Send a compliment..."];
            let sentenceIndex = 0, charIndex = 0, isDeleting = false;
            const type = () => {
                const currentSentence = sentences[sentenceIndex];
                if (isDeleting) { typingTextElement.textContent = currentSentence.substring(0, charIndex-- - 1); } 
                else { typingTextElement.textContent = currentSentence.substring(0, charIndex++ + 1); }
                let typeSpeed = 150;
                if (isDeleting) typeSpeed /= 2;
                if (!isDeleting && charIndex === currentSentence.length) { typeSpeed = 2000; isDeleting = true; } 
                else if (isDeleting && charIndex === 0) { isDeleting = false; sentenceIndex = (sentenceIndex + 1) % sentences.length; typeSpeed = 500; }
                setTimeout(type, typeSpeed);
            };
            type();
        }
    }

// app.js

// --- LOGIC FOR: register.html ---
if (pagePath === 'register.html') {
    const registerForm = document.getElementById('register-form');
    registerForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = registerForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Creating Account...';

        const email = registerForm.email.value;
        const password = registerForm.password.value;
        const nickname = registerForm.nickname.value;
        const partnerEmail = registerForm['partner-email'].value;

        // --- FIX #1: VALIDATE THAT USER AND PARTNER EMAILS ARE NOT THE SAME ---
        // We do this *before* calling Firebase to save a network request.
        if (email.trim().toLowerCase() === partnerEmail.trim().toLowerCase()) {
            alert("Validation Error: Your email and your partner's email cannot be the same. Please enter a different email for your partner.");
            submitButton.disabled = false;
            // Restore the original button content with the icon
            submitButton.innerHTML = `<i data-lucide="sparkles" class="h-5 w-5"></i><span>Create Account</span>`;
            lucide.createIcons();
            return; // Stop the function here
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCredential.user.uid), { email: email.toLowerCase(), nickname, partnerEmail: partnerEmail.toLowerCase(), createdAt: serverTimestamp() });
            window.location.replace('dashboard.html');
        } catch (error) {
            // --- FIX #2: SHOW A CUSTOM ERROR FOR "EMAIL ALREADY IN USE" ---
            if (error.code === 'auth/email-already-in-use') {
                alert('Registration Error: This email address is already in use. Please go to the login page to sign in.');
            } else {
                // For all other errors (weak password, network error, etc.)
                alert('Registration Error: ' + error.message);
            }
            
            submitButton.disabled = false;
            // Restore the original button content with the icon
            submitButton.innerHTML = `<i data-lucide="sparkles" class="h-5 w-5"></i><span>Create Account</span>`;
            lucide.createIcons();
        }
    });
}
    // --- LOGIC FOR: login.html ---
    if (pagePath === 'login.html') {
        const loginForm = document.getElementById('login-form');
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Signing In...';
            try {
                await signInWithEmailAndPassword(auth, loginForm.email.value, loginForm.password.value);
                window.location.replace('dashboard.html');
            } catch (error) {
                alert('Login Error: ' + error.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Sign In';
            }
        });
    }

  rules_version = '2';
service cloud.google.com/firestore {
  match /databases/{database}/documents {
    
    // Users can read their own user document, but not others.
    match /users/{userId} {
      allow read, update: if request.auth.uid == userId;
      allow create: if request.auth.uid != null;
    }

    // Rules for the 'messages' collection
    match /messages/{messageId} {
      // A user can CREATE a message if they are logged in and the senderId matches their own.
      allow create: if request.auth != null && request.resource.data.senderId == request.auth.uid;
      
      // A user can READ a message if their UID is either the senderId or the receiverId.
      allow read: if request.auth != null && (request.resource.data.senderId == request.auth.uid || request.resource.data.receiverId == request.auth.uid);
      
      // For now, prevent updates and deletes to keep messages immutable.
      allow update, delete: if false;
    }
  }
}
    
    // --- Initialize Lucide Icons on all pages ---
    lucide.createIcons();
});
