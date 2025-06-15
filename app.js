// app.js - The Single JavaScript File for Your Entire Website

// --- 1. FIREBASE SDK IMPORTS (MODERN v9 SYNTAX) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// --- 2. FIREBASE CONFIGURATION ---
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
document.addEventListener('DOMContentLoaded', async () => {
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

            // Validate that user and partner emails are not the same
            if (email.trim().toLowerCase() === partnerEmail.trim().toLowerCase()) {
                alert("Validation Error: Your email and your partner's email cannot be the same.");
                submitButton.disabled = false;
                submitButton.innerHTML = `<i data-lucide="sparkles" class="h-5 w-5"></i><span>Create Account</span>`;
                lucide.createIcons();
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, "users", userCredential.user.uid), { email: email.toLowerCase(), nickname, partnerEmail: partnerEmail.toLowerCase(), createdAt: serverTimestamp() });
                window.location.replace('dashboard.html');
            } catch (error) {
                // Show a custom error for "EMAIL ALREADY IN USE"
                if (error.code === 'auth/email-already-in-use') {
                    alert('Registration Error: This email address is already in use. Please go to the login page to sign in.');
                } else {
                    alert('Registration Error: ' + error.message);
                }
                
                submitButton.disabled = false;
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

    // --- LOGIC FOR: dashboard.html ---
    if (pagePath === 'dashboard.html') {
        // We need to import more Firestore functions for sending and querying
        const { collection, addDoc, query, where, getDocs } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js");
        
        let currentUserData = null; // Variable to hold user data for later use

        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const welcomeMessage = document.getElementById('welcome-message');
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                
                if (userDocSnap.exists()) {
                    currentUserData = userDocSnap.data();
                    if (welcomeMessage) {
                        welcomeMessage.textContent = `Welcome, ${currentUserData.nickname}!`;
                    }
                } else {
                    console.log("User document does not exist!");
                    window.location.replace('login.html');
                }
            } else {
                window.location.replace('login.html');
            }
        });

        // Logout Button - NOW REDIRECTS TO INDEX.HTML
        document.getElementById('logout-button')?.addEventListener('click', () => {
            signOut(auth).then(() => window.location.href = 'index.html');
        });
        
        // Dark/Light Mode Theme Toggle
        const themeIcon = document.getElementById('theme-icon');
        const applyTheme = (theme) => {
            document.documentElement.classList.toggle('dark', theme === 'dark');
            if(themeIcon) {
                themeIcon.setAttribute('data-lucide', theme === 'dark' ? 'sun' : 'moon');
            }
            lucide.createIcons();
        };
        const toggleTheme = () => {
            const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
            localStorage.setItem('theme', newTheme);
            applyTheme(newTheme);
        };
        document.getElementById('theme-toggle-button')?.addEventListener('click', toggleTheme);

        // Modal Controls
        const modals = { sendMessage: 'send-message-modal' };
        window.showModal = (name) => document.getElementById(modals[name])?.classList.remove('hidden');
        window.hideModal = (name) => {
            const modal = document.getElementById(modals[name]);
            if (modal) {
                modal.classList.add('hidden');
                modal.querySelector('form')?.reset();
                document.getElementById('priority-section')?.classList.add('hidden');
            }
        };
        
        // Send Message Form Logic
        const messageForm = document.getElementById('send-message-form');
        const messageTypeSelect = document.getElementById('messageType');
        const prioritySection = document.getElementById('priority-section');

        messageTypeSelect?.addEventListener('change', (e) => {
            prioritySection.classList.toggle('hidden', e.target.value !== 'grievance');
        });

        messageForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitButton = document.getElementById('send-message-button');
            submitButton.disabled = true;
            submitButton.textContent = 'Sending...';

            try {
                if (!auth.currentUser || !currentUserData) throw new Error("User data not loaded yet.");
                if (!currentUserData.partnerEmail) throw new Error("Partner's email is not set.");

                const usersRef = collection(db, "users");
                const q = query(usersRef, where("email", "==", currentUserData.partnerEmail.toLowerCase()));
                const querySnapshot = await getDocs(q);
                
                if (querySnapshot.empty) throw new Error("Your partner has not registered yet.");
                const receiverId = querySnapshot.docs[0].id;

                const messageData = {
                    title: messageForm.title.value.trim(),
                    description: messageForm.description.value.trim(),
                    messageType: messageForm.messageType.value,
                    mood: messageForm.mood.value,
                    timestamp: serverTimestamp(),
                    senderId: auth.currentUser.uid,
                    senderNickname: currentUserData.nickname,
                    senderEmail: auth.currentUser.email,
                    receiverId: receiverId,
                    receiverEmail: currentUserData.partnerEmail.toLowerCase(),
                    status: messageForm.messageType.value === 'grievance' ? 'pending' : 'sent',
                    responses: [],
                };

                if (messageData.messageType === 'grievance') {
                    messageData.priority = messageForm.priority.value;
                }

                await addDoc(collection(db, "messages"), messageData);
                alert("Message Sent Successfully!");
                window.hideModal('sendMessage');

            } catch (error) {
                console.error("Error sending message: ", error);
                alert("Error: " + error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Send Message';
            }
        });
    }
    
    // --- Initialize Lucide Icons on all pages ---
    lucide.createIcons();
});
