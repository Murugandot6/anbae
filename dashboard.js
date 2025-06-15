// dashboard.js

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, writeBatch, getDocs } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyA8QfLoifA2-DjldYaMBeIge1D6TbRpBWw",
    authDomain: "summa-57ad5.firebaseapp.com",
    projectId: "summa-57ad5",
    storageBucket: "summa-57ad5.firebasestorage.app",
    messagingSenderId: "472212537134",
    appId: "1:472212537134:web:fc930ea95fa9b7ffc4c4bf"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const userNicknameSpan = document.getElementById('user-nickname');
const profileYouName = document.getElementById('profile-you-name');
const profilePartnerName = document.getElementById('profile-partner-name');
const logoutButton = document.getElementById('logout-button');
const clearAllButton = document.getElementById('clear-all-button');
const editProfileButton = document.getElementById('edit-profile-button');
const sendMessageButton = document.getElementById('send-message-button');

// Modals
const editProfileModal = document.getElementById('edit-profile-modal');
const editProfileForm = document.getElementById('edit-profile-form');
const editNicknameInput = document.getElementById('edit-nickname');
const editPartnerEmailInput = document.getElementById('edit-partner-email');

const sendMessageModal = document.getElementById('send-message-modal');
const sendMessageForm = document.getElementById('send-message-form');
const messageContentInput = document.getElementById('message-content');

// Message Tabs
const outboxTabButton = document.querySelector('.tab-button[data-tab="outbox"]');
const inboxTabButton = document.querySelector('.tab-button[data-tab="inbox"]');
const outboxContent = document.getElementById('outbox-content');
const inboxContent = document.getElementById('inbox-content');
const outboxCountSpan = document.getElementById('outbox-count');
const inboxCountSpan = document.getElementById('inbox-count');
const outboxEmptyMessage = document.getElementById('outbox-empty-message');
const inboxEmptyMessage = document.getElementById('inbox-empty-message');

let currentUser = null;
let userProfile = null; // To store the current user's profile data

// --- Utility Functions ---

/**
 * Displays a custom message box.
 * @param {string} message - The message to display.
 * @param {function} [callback] - An optional callback function to execute when the message box is closed.
 */
function showMessage(message, callback) {
    const messageBox = document.getElementById('messageBox');
    const messageText = document.getElementById('messageText');
    const messageBoxClose = document.getElementById('messageBoxClose');

    messageText.textContent = message;
    messageBox.style.display = 'block';

    messageBoxClose.onclick = () => {
        messageBox.style.display = 'none';
        if (callback) {
            callback();
        }
    };
}

/**
 * Opens a given modal.
 * @param {string} modalId - The ID of the modal element to open.
 */
window.openModal = function(modalId) { // Exposed to global scope for onclick in HTML
    document.getElementById(modalId).classList.add('open');
}

/**
 * Closes a given modal.
 * @param {string} modalId - The ID of the modal element to close.
 */
window.closeModal = function(modalId) { // Exposed to global scope for onclick in HTML
    document.getElementById(modalId).classList.remove('open');
}

/**
 * Switches between message tabs (Outbox/Inbox).
 * @param {string} tabName - 'outbox' or 'inbox'.
 */
function switchTab(tabName) {
    outboxTabButton.classList.remove('active');
    inboxTabButton.classList.remove('active');
    outboxContent.classList.remove('active');
    inboxContent.classList.remove('active');

    if (tabName === 'outbox') {
        outboxTabButton.classList.add('active');
        outboxContent.classList.add('active');
    } else if (tabName === 'inbox') {
        inboxTabButton.classList.add('active');
        inboxContent.classList.add('active');
    }
}

/**
 * Renders a single message item.
 * @param {object} message - The message object from Firestore.
 * @param {string} typeClass - CSS class for message type color (e.g., 'msg-compliment').
 * @returns {string} HTML string for the message.
 */
function renderMessage(message, typeClass) {
    const date = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleString() : 'N/A';
    const senderName = message.senderNickname || message.senderEmail;
    const receiverName = message.receiverNickname || message.receiverEmail;

    return `
        <div class="p-3 mb-3 rounded-lg ${typeClass} flex justify-between items-start">
            <div>
                <p class="text-sm text-gray-700 font-medium">${message.type.charAt(0).toUpperCase() + message.type.slice(1)}</p>
                <p class="text-gray-800">${message.content}</p>
                <p class="text-xs text-gray-500 mt-1">
                    ${message.direction === 'sent' ? `To: ${receiverName}` : `From: ${senderName}`} on ${date}
                </p>
            </div>
        </div>
    `;
}

// --- Firebase Data Operations ---

/**
 * Fetches user profile from Firestore. If not exists, creates a basic one.
 * @param {object} user - The Firebase Auth user object.
 * @returns {Promise<object>} The user's profile data.
 */
async function getUserProfile(user) {
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
        return userDocSnap.data();
    } else {
        // Create a basic profile if it doesn't exist (e.g., first-time login via third-party provider)
        const newProfile = {
            email: user.email,
            nickname: user.email.split('@')[0], // Default nickname
            partnerEmail: '' // No partner by default
        };
        await setDoc(userDocRef, newProfile);
        return newProfile;
    }
}

/**
 * Saves user profile data to Firestore.
 * @param {string} userId - The Firebase User ID.
 * @param {object} profileData - The profile data to save.
 */
async function saveUserProfile(userId, profileData) {
    const userDocRef = doc(db, "users", userId);
    await setDoc(userDocRef, profileData, { merge: true }); // Merge to avoid overwriting other fields
}

/**
 * Sends a new message and saves it to Firestore.
 * @param {string} senderId - The UID of the sender.
 * @param {object} senderProfile - The profile of the sender.
 * @param {string} receiverEmail - The email of the receiver.
 * @param {string} content - The message content.
 * @param {string} type - The message type (compliment, grievance, how-i-felt).
 */
async function sendMessage(senderId, senderProfile, receiverEmail, content, type) {
    try {
        // Fetch receiver's UID if they exist and are registered
        let receiverUid = null;
        let receiverNickname = receiverEmail; // Default to email if no profile found
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", receiverEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((doc) => {
                receiverUid = doc.id;
                receiverNickname = doc.data().nickname || receiverEmail;
            });
        } else {
            showMessage("Partner email is not registered with Anbae. Message will be sent, but partner might not see it in their Anbae inbox if they don't register.");
            // You might want to prevent sending or handle this case differently
        }

        const messagesCollectionRef = collection(db, "messages");
        await addDoc(messagesCollectionRef, {
            senderId: senderId,
            senderEmail: senderProfile.email,
            senderNickname: senderProfile.nickname,
            receiverEmail: receiverEmail,
            receiverUid: receiverUid, // Null if partner not registered
            receiverNickname: receiverNickname,
            content: content,
            type: type,
            timestamp: serverTimestamp() // Firestore server timestamp
        });
        showMessage("Message sent successfully!");
    } catch (error) {
        console.error("Error sending message:", error);
        showMessage("Failed to send message: " + error.message);
    }
}

/**
 * Sets up real-time listeners for inbox and outbox messages.
 */
function setupMessageListeners() {
    if (!currentUser) return;

    const messagesRef = collection(db, "messages");

    // Outbox Listener: Messages sent by the current user
    const outboxQuery = query(
        messagesRef,
        where("senderId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
    );

    onSnapshot(outboxQuery, (snapshot) => {
        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data(), direction: 'sent' });
        });
        renderMessages(outboxContent, messages, 'outbox');
        outboxCountSpan.textContent = messages.length;
    }, (error) => {
        console.error("Error listening to outbox:", error);
        showMessage("Error loading sent messages.");
    });

    // Inbox Listener: Messages received by the current user (where current user's email matches receiverEmail)
    const inboxQuery = query(
        messagesRef,
        where("receiverEmail", "==", currentUser.email),
        orderBy("timestamp", "desc")
    );

    onSnapshot(inboxQuery, (snapshot) => {
        const messages = [];
        snapshot.forEach(doc => {
            messages.push({ id: doc.id, ...doc.data(), direction: 'received' });
        });
        renderMessages(inboxContent, messages, 'inbox');
        inboxCountSpan.textContent = messages.length;
    }, (error) => {
        console.error("Error listening to inbox:", error);
        showMessage("Error loading received messages.");
    });
}

/**
 * Renders messages into the specified container.
 * @param {HTMLElement} container - The DOM element to render messages into.
 * @param {Array<object>} messages - Array of message objects.
 * @param {string} boxType - 'outbox' or 'inbox'.
 */
function renderMessages(container, messages, boxType) {
    container.innerHTML = ''; // Clear previous messages
    const emptyMessageElement = boxType === 'outbox' ? outboxEmptyMessage : inboxEmptyMessage;

    if (messages.length === 0) {
        container.appendChild(emptyMessageElement);
        emptyMessageElement.style.display = 'block';
        return;
    } else {
         if (emptyMessageElement) {
            emptyMessageElement.style.display = 'none'; // Hide empty message if there are messages
        }
    }

    messages.forEach(msg => {
        let typeClass = '';
        switch (msg.type) {
            case 'compliment': typeClass = 'msg-compliment'; break;
            case 'grievance': typeClass = 'msg-grievance'; break;
            case 'how-i-felt': typeClass = 'msg-how-i-felt'; break;
            default: typeClass = 'bg-gray-100'; // Default styling
        }
        container.innerHTML += renderMessage(msg, typeClass);
    });
}


// --- Event Listeners ---

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        // Using window.location.replace for robust redirect and clear history
        window.location.replace(window.location.origin + '/index.html'); // Redirect to home page
    } catch (error) {
        console.error("Error logging out:", error);
        showMessage("Failed to log out. Please try again.");
    }
});

editProfileButton.addEventListener('click', () => {
    if (userProfile) {
        editNicknameInput.value = userProfile.nickname || '';
        editPartnerEmailInput.value = userProfile.partnerEmail || '';
    }
    window.openModal('edit-profile-modal'); // Use window.openModal
});

editProfileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
        showMessage("User not authenticated.");
        return;
    }

    const newNickname = editNicknameInput.value.trim();
    const newPartnerEmail = editPartnerEmailInput.value.trim();

    if (!newNickname) {
        showMessage("Nickname cannot be empty.");
        return;
    }

    try {
        const updatedProfile = {
            nickname: newNickname,
            partnerEmail: newPartnerEmail
        };
        await saveUserProfile(currentUser.uid, updatedProfile);
        userProfile = { ...userProfile, ...updatedProfile }; // Update local profile
        updateProfileDisplay(userProfile); // Update UI
        showMessage("Profile updated successfully!");
        window.closeModal('edit-profile-modal'); // Use window.closeModal
    } catch (error) {
        console.error("Error updating profile:", error);
        showMessage("Failed to update profile: " + error.message);
    }
});

sendMessageButton.addEventListener('click', () => {
    messageContentInput.value = ''; // Clear previous message
    const radioButtons = sendMessageForm.querySelectorAll('input[name="message-type"]');
    if (radioButtons.length > 0) radioButtons[0].checked = true; // Default to first option
    window.openModal('send-message-modal'); // Use window.openModal
});

sendMessageForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser || !userProfile) {
        showMessage("Authentication error. Please log in again.");
        return;
    }

    const content = messageContentInput.value.trim();
    const type = sendMessageForm.querySelector('input[name="message-type"]:checked').value;

    if (!content) {
        showMessage("Message cannot be empty.");
        return;
    }
    if (!userProfile.partnerEmail) {
         showMessage("Please set your partner's email in 'Edit Profile' before sending messages.");
         return;
    }

    await sendMessage(currentUser.uid, userProfile, userProfile.partnerEmail, content, type);
    window.closeModal('send-message-modal'); // Use window.closeModal
});

// Tab switching logic
outboxTabButton.addEventListener('click', () => switchTab('outbox'));
inboxTabButton.addEventListener('click', () => switchTab('inbox'));


// --- Authentication State Observer ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // User is signed in
        currentUser = user;
        console.log("User authenticated:", user.email);

        userProfile = await getUserProfile(user);
        updateProfileDisplay(userProfile);
        setupMessageListeners(); // Start listening for messages
    } else {
        // User is signed out, redirect to login or home
        currentUser = null;
        userProfile = null;
        console.log("No user signed in. Redirecting to index.html");
        window.location.replace(window.location.origin + '/index.html'); // Use window.location.replace
    }
});

/**
 * Updates the displayed user and partner information on the dashboard.
 * @param {object} profile - The user's current profile data.
 */
function updateProfileDisplay(profile) {
    userNicknameSpan.textContent = profile.nickname || profile.email;
    profileYouName.textContent = profile.nickname || profile.email;
    profilePartnerName.textContent = profile.partnerEmail || 'Not set';
}

// Initial tab activation
switchTab('outbox');

// Clear all messages (utility for development/testing)
clearAllButton.addEventListener('click', async () => {
    if (!currentUser) {
        showMessage("Please log in to clear messages.");
        return;
    }

    // Using custom message box instead of alert/confirm
    showMessage("Are you sure you want to clear ALL your messages (sent and received)? This action cannot be undone.", async () => {
        try {
            const messagesRef = collection(db, "messages");
            const userMessagesQuery = query(
                messagesRef,
                where("senderId", "==", currentUser.uid)
            );
            const receivedMessagesQuery = query(
                messagesRef,
                where("receiverEmail", "==", currentUser.email)
            );

            const [sentSnapshot, receivedSnapshot] = await Promise.all([
                getDocs(userMessagesQuery),
                getDocs(receivedMessagesQuery)
            ]);

            const batch = writeBatch(db); // Use batched writes for efficiency

            sentSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });

            receivedSnapshot.docs.forEach(doc => {
                // Only delete if the message is *only* received by current user
                // This prevents deleting messages sent by others if they also sent it to someone else
                // For a simple app, deleting all messages where current user is receiver is fine.
                // For more complex apps, consider message ownership more carefully.
                batch.delete(doc.ref);
            });

            await batch.commit();
            showMessage("All your messages have been cleared!");
        } catch (error) {
            console.error("Error clearing messages:", error);
            showMessage("Failed to clear messages: " + error.message);
        }
    });
});
