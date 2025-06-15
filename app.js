// app.js - The Single JavaScript File for Your Entire Website

// --- 1. FIREBASE CONFIGURATION (GLOBAL) ---
// This section is available to all parts of the script.

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA8QfLoifA2-DjldYaMBeIge1D6TbRpBWw",
  authDomain: "summa-57ad5.firebaseapp.com",
  projectId: "summa-57ad5",
  storageBucket: "summa-57ad5.firebasestorage.app",
  messagingSenderId: "472212537134",
  appId: "1:472212537134:web:fc930ea95fa9b7ffc4c4bf"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


// --- 2. MAIN LOGIC (RUNS AFTER THE HTML PAGE LOADS) ---
document.addEventListener('DOMContentLoaded', () => {

    // This script checks which page is loaded and runs only the relevant code.
    const pagePath = window.location.pathname.split("/").pop();
    console.log("Current Page:", pagePath);

    // --- LOGIC FOR: index.html (Homepage) ---
    if (pagePath === 'index.html' || pagePath === '') {
        // Smart redirect: If a user is already logged in, they shouldn't see the homepage.
        auth.onAuthStateChanged(user => {
            if (user) {
                window.location.replace('dashboard.html');
            }
        });
        // Attach event listeners to the navigation buttons.
        document.getElementById('login-button')?.addEventListener('click', () => { window.location.href = 'login.html'; });
        document.getElementById('register-button')?.addEventListener('click', () => { window.location.href = 'register.html'; });
    }

    // --- LOGIC FOR: register.html ---
    if (pagePath === 'register.html') {
        const registerForm = document.getElementById('register-form');
        registerForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = registerForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.querySelector('span').textContent = 'Creating Account...';

            const email = registerForm.email.value;
            const password = registerForm.password.value;
            const nickname = registerForm.nickname.value;
            const partnerEmail = registerForm['partner-email'].value;

            try {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await db.collection('users').doc(userCredential.user.uid).set({
                    email: email.toLowerCase(),
                    nickname: nickname,
                    partnerEmail: partnerEmail.toLowerCase(),
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.location.replace('dashboard.html');
            } catch (error) {
                alert('Registration Error: ' + error.message);
                submitButton.disabled = false;
                submitButton.querySelector('span').textContent = 'Create Account';
            }
        });
    }

    // --- LOGIC FOR: login.html ---
    if (pagePath === 'login.html') {
        const loginForm = document.getElementById('login-form'); // Ensure your login form has this ID
        loginForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = loginForm.querySelector('button[type="submit"]');
            submitButton.disabled = true;
            submitButton.textContent = 'Signing In...';

            const email = loginForm.email.value;
            const password = loginForm.password.value;

            try {
                await auth.signInWithEmailAndPassword(email, password);
                window.location.replace('dashboard.html');
            } catch (error) {
                alert('Login Error: ' + error.message);
                submitButton.disabled = false;
                submitButton.textContent = 'Sign In';
            }
        });
    }

    // --- LOGIC FOR: dashboard.html ---
    if (pagePath === 'dashboard.html') {
        // Auth Guard: Protect this page
        auth.onAuthStateChanged(async (user) => {
            if (user) {
                const welcomeMessage = document.getElementById('welcome-message'); // Give your "Welcome" heading this ID
                const userDoc = await db.collection('users').doc(user.uid).get();
                if (userDoc.exists && welcomeMessage) {
                    welcomeMessage.textContent = `Welcome, ${userDoc.data().nickname}!`;
                }
            } else {
                // If no user, kick them out to the login page
                window.location.replace('login.html');
            }
        });

        // Logout
        document.getElementById('logout-button')?.addEventListener('click', () => {
            auth.signOut().then(() => window.location.href = 'login.html');
        });

        // Theme Toggle
        const themeIcon = document.getElementById('theme-icon');
        const applyTheme = (theme) => {
            document.documentElement.classList.toggle('dark', theme === 'dark');
            if(themeIcon) themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
            lucide.createIcons();
        };
        const toggleTheme = () => {
            const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        };
        document.getElementById('theme-toggle-button')?.addEventListener('click', toggleTheme);
        const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        applyTheme(savedTheme);

        // Make Modal functions globally available for `onclick` attributes
        const modals = {
            clearAll: document.getElementById('clear-all-modal'),
            sendMessage: document.getElementById('send-message-modal'),
            messageHistory: document.getElementById('message-history-modal'),
            editProfile: document.getElementById('edit-profile-modal'),
        };
        window.showModal = (modalName) => modals[modalName]?.classList.remove('hidden');
        window.hideModal = (modalName) => modals[modalName]?.classList.add('hidden');
        
        // --- (Add any other dashboard-specific logic here) ---
    }
    
    // --- Initialize Lucide Icons (runs on all pages) ---
    // This makes sure icons render correctly everywhere.
    lucide.createIcons();
});
