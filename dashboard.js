// dashboard.js

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, writeBatch, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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

// DOM Elements - Main Dashboard
const userNicknameSpan = document.getElementById('user-nickname');
const profileYouName = document.getElementById('profile-you-name');
const profilePartnerName = document.getElementById('profile-partner-name');
const logoutButton = document.getElementById('logout-button');
const clearAllButton = document.getElementById('clear-all-button');
const editProfileButton = document.getElementById('edit-profile-button');
const sendMessageButton = document.getElementById('send-message-button');
const viewInboxOutboxButton = document.getElementById('view-inbox-outbox-button');

const latestMessagesContent = document.getElementById('latest-messages-content');
const latestMessagesEmptyMessage = document.getElementById('latest-messages-empty-message');

// Modals - General
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageBoxClose = document.getElementById('messageBoxClose');

// Modals - Edit Profile
const editProfileModal = document.getElementById('edit-profile-modal');
const editProfileForm = document.getElementById('edit-profile-form');
const editNicknameInput = document.getElementById('edit-nickname');
const editPartnerEmailInput = document.getElementById('edit-partner-email');
const editPartnerNicknameInput = document.getElementById('edit-partner-nickname');

// Modals - Send Message
const sendMessageModal = document.getElementById('send-message-modal');
const sendMessageForm = document.getElementById('send-message-form');
const messageContentInput = document.getElementById('message-content');
const messageTypeSelect = document.getElementById('message-type-select');
const messagePrioritySelect = document.getElementById('message-priority');
const messageMoodSelect = document.getElementById('message-mood');
const sendMessageModalTitle = sendMessageModal.querySelector('h3');
const sendMessageModalContent = document.getElementById('send-message-modal-content'); // Reference to the modal content div

// Modals - Full Messages
const fullMessagesModal = document.getElementById('full-messages-modal');
const modalOutboxTabButton = document.querySelector('.modal-tab-button[data-modal-tab="modal-outbox"]');
const modalInboxTabButton = document.querySelector('.modal-tab-button[data-modal-tab="modal-inbox"]');
const modalOutboxContent = document.getElementById('modal-outbox-content');
const modalInboxContent = document.getElementById('modal-inbox-content');
const modalOutboxCountSpan = document.getElementById('modal-outbox-count');
const modalInboxCountSpan = document.getElementById('modal-inbox-count');
const modalOutboxEmptyMessage = document.getElementById('modal-outbox-empty-message');
const modalInboxEmptyMessage = document.getElementById('modal-inbox-empty-message');

// Modals - Clear All Request/Response/Status
const clearRequestModal = document.getElementById('clear-request-modal');
const clearRequestForm = document.getElementById('clear-request-form');
const clearReasonInput = document.getElementById('clear-reason');

const clearResponseModal = document.getElementById('clear-response-modal');
const requesterNameSpan = document.getElementById('requester-name');
const requestReasonSpan = document.getElementById('request-reason');
const declineReasonInput = document.getElementById('decline-reason');
const declineClearButton = document.getElementById('decline-clear-button');
const acceptClearButton = document.getElementById('accept-clear-button');

const clearFinalConfirmModal = document.getElementById('clear-final-confirm-modal');
const finalConfirmClearButton = document.getElementById('final-confirm-clear-button');

const clearStatusModal = document.getElementById('clear-status-modal');
const statusModalTitle = document.getElementById('status-modal-title');
const statusModalMessage = document.getElementById('status-modal-message');
const statusModalReason = document.getElementById('status-modal-reason');

let currentUser = null;
let userProfile = null; // To store the current user's profile data
let activeClearRequestDocId = null; // To store the ID of the clear request being processed by the receiver

// --- Utility Functions ---

/**
 * Displays a custom message box.
 * @param {string} message - The message to display.
 * @param {function} [callback] - An optional callback function to execute when the message box is closed.
 */
function showMessage(message, callback) {
    messageText.textContent = message;
    messageBox.style.display = 'block';

    messageBoxClose.onclick = null;
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
window.openModal = function(modalId) {
    document.getElementById(modalId).classList.add('open');
}

/**
 * Closes a given modal.
 * @param {string} modalId - The ID of the modal element to close.
 */
window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('open');
}

/**
 * Switches between message tabs within a modal.
 * @param {string} tabName - 'modal-outbox' or 'modal-inbox'.
 */
function switchModalTab(tabName) {
    modalOutboxTabButton.classList.remove('active');
    modalInboxTabButton.classList.remove('active');
    modalOutboxContent.classList.remove('active');
    modalInboxContent.classList.remove('active');

    if (tabName === 'modal-outbox') {
        modalOutboxTabButton.classList.add('active');
        modalOutboxContent.classList.add('active');
    } else if (tabName === 'modal-inbox') {
        modalInboxTabButton.classList.add('active');
        modalInboxContent.classList.add('active');
    }
}

/**
 * Renders a single message item HTML.
 * @param {object} message - The message object from Firestore.
 * @param {string} typeClass - CSS class for message type color (e.g., 'msg-compliment').
 * @param {boolean} isLatestHighlight - True if this message should have the latest highlight.
 * @returns {string} HTML string for the message.
 */
function renderMessageHtml(message, typeClass, isLatestHighlight = false) {
    const date = message.timestamp ? new Date(message.timestamp.toDate()).toLocaleString() : 'N/A';
    const senderDisplayName = message.senderNickname || message.senderEmail;
    const receiverDisplayName = message.receiverNickname || message.receiverEmail;
    const highlightClass = isLatestHighlight ? 'msg-latest-highlight' : '';

    return `
        <div class="p-3 mb-3 rounded-lg ${typeClass} ${highlightClass} flex justify-between items-start">
            <div>
                <p class="text-sm text-gray-700 font-medium">
                    ${message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                    ${message.priority ? ` (Priority: ${message.priority.charAt(0).toUpperCase() + message.priority.slice(1)})` : ''}
                    ${message.mood ? ` (Mood: ${message.mood.charAt(0).toUpperCase() + message.mood.slice(1)})` : ''}
                </p>
                <p class="text-gray-800">${message.content}</p>
                <p class="text-xs text-gray-500 mt-1">
                    ${message.direction === 'sent' ? `To: ${receiverDisplayName}` : `From: ${senderDisplayName}`} on ${date}
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
        const newProfile = {
            email: user.email,
            nickname: user.email.split('@')[0],
            partnerEmail: '',
            partnerNickname: ''
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
    try {
        await setDoc(userDocRef, profileData, { merge: true });
    } catch (error) {
        console.error("Error saving user profile:", error);
        showMessage("Failed to save profile changes. Please check your Firestore security rules and internet connection.");
        console.warn("Firestore Security Rule Hint: Ensure your 'users' collection rules allow authenticated users to 'write' to their own document (e.g., 'allow write: if request.auth != null && request.auth.uid == userId;').");
        throw error;
    }
}

/**
 * Sends a new message and saves it to Firestore.
 */
async function sendMessage(senderId, senderProfile, receiverEmail, content, type, priority, mood) {
    try {
        let receiverUid = null;
        let receiverNickname = receiverEmail;
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", receiverEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((d) => {
                receiverUid = d.id;
                receiverNickname = d.data().nickname || receiverEmail;
            });
        } else {
            showMessage("Partner email is not registered with Anbae. Message will be sent, but partner might not see it in their Anbae inbox if they don't register.");
        }

        const messagesCollectionRef = collection(db, "messages");
        await addDoc(messagesCollectionRef, {
            senderId: senderId,
            senderEmail: senderProfile.email,
            senderNickname: senderProfile.nickname,
            receiverEmail: receiverEmail,
            receiverUid: receiverUid,
            receiverNickname: receiverNickname,
            content: content,
            type: type,
            priority: priority,
            mood: mood,
            timestamp: serverTimestamp()
        });
        showMessage("Message sent successfully!");
    } catch (error) {
        console.error("Error sending message:", error);
        showMessage("Failed to send message: " + error.message);
    }
}

/**
 * Sends a request to the partner to clear all messages.
 * @param {string} reason - The reason for clearing messages.
 */
async function sendClearAllRequest(reason) {
    if (!currentUser || !userProfile || !userProfile.partnerEmail) {
        showMessage("Cannot send clear request. Please ensure you are logged in and have a partner email set.");
        return;
    }

    try {
        const clearRequestsRef = collection(db, "clearRequests");
        await addDoc(clearRequestsRef, {
            requesterId: currentUser.uid,
            requesterEmail: currentUser.email,
            requesterNickname: userProfile.nickname,
            partnerEmail: userProfile.partnerEmail,
            reason: reason,
            status: 'pending',
            timestamp: serverTimestamp()
        });
        showMessage("Clear request sent to your partner!");
        window.closeModal('clear-request-modal');
    } catch (error) {
        console.error("Error sending clear request:", error);
        showMessage("Failed to send clear request: " + error.message);
    }
}

/**
 * Clears all messages (sent and received) for the current user.
 */
async function executeClearAllMessages() {
    if (!currentUser) {
        showMessage("Please log in to clear messages.");
        return;
    }

    try {
        const messagesRef = collection(db, "messages");
        const userSentMessagesQuery = query(
            messagesRef,
            where("senderId", "==", currentUser.uid)
        );
        const userReceivedMessagesQuery = query(
            messagesRef,
            where("receiverEmail", "==", currentUser.email)
        );

        const [sentSnapshot, receivedSnapshot] = await Promise.all([
            getDocs(userSentMessagesQuery),
            getDocs(receivedMessagesQuery)
        ]);

        const batch = writeBatch(db);

        sentSnapshot.docs.forEach(d => {
            batch.delete(d.ref);
        });

        receivedSnapshot.docs.forEach(d => {
            batch.delete(d.ref);
        });

        await batch.commit();
        showMessage("All your messages have been cleared!");
    } catch (error) {
        console.error("Error clearing messages:", error);
        showMessage("Failed to clear messages: " + error.message);
    }
}


// --- Real-time Listeners and Renderers ---

/**
 * Sets up real-time listener for the latest 3 messages on the dashboard.
 */
function setupLatestMessagesListener() {
    if (!currentUser) return;

    const messagesRef = collection(db, "messages");
    const allRelevantMessagesQuery = query(
        messagesRef,
        orderBy("timestamp", "desc")
    );

    onSnapshot(allRelevantMessagesQuery, async (snapshot) => {
        let allUserMessages = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.senderId === currentUser.uid || data.receiverEmail === currentUser.email) {
                allUserMessages.push({ id: doc.id, ...data });
            }
        });

        allUserMessages.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
            const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
            return timeB - timeA;
        });

        const top3Messages = allUserMessages.slice(0, 3);
        renderLatestMessages(latestMessagesContent, top3Messages);
    }, (error) => {
        console.error("Error listening to latest messages:", error);
        showMessage("Error loading latest messages.");
    });
}

/**
 * Renders only the latest messages on the main dashboard.
 */
function renderLatestMessages(container, messages) {
    container.innerHTML = '';
    if (messages.length === 0) {
        latestMessagesEmptyMessage.style.display = 'block';
        container.appendChild(latestMessagesEmptyMessage);
        return;
    } else {
        latestMessagesEmptyMessage.style.display = 'none';
    }

    messages.forEach((msg, index) => {
        let typeClass = '';
        switch (msg.type) {
            case 'grievance': typeClass = 'msg-grievance'; break;
            case 'compliment': typeClass = 'msg-compliment'; break;
            case 'good-memory': typeClass = 'msg-good-memory'; break;
            case 'how-i-feel': typeClass = 'msg-how-i-feel'; break;
            default: typeClass = 'bg-gray-100';
        }
        const isFirstMessage = (index === 0);
        container.innerHTML += renderMessageHtml(msg, typeClass, isFirstMessage);
    });
}

/**
 * Sets up real-time listeners for all inbox and outbox messages within the modal.
 */
function setupFullMessagesModalListeners() {
    if (!currentUser) return;

    const messagesRef = collection(db, "messages");

    const modalOutboxQuery = query(
        messagesRef,
        where("senderId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
    );

    onSnapshot(modalOutboxQuery, (snapshot) => {
        const messages = [];
        snapshot.forEach(d => {
            messages.push({ id: d.id, ...d.data(), direction: 'sent' });
        });
        renderFullModalMessages(modalOutboxContent, messages, 'outbox');
        modalOutboxCountSpan.textContent = messages.length;
    }, (error) => {
        console.error("Error listening to modal outbox:", error);
        showMessage("Error loading sent messages in modal.");
    });

    const modalInboxQuery = query(
        messagesRef,
        where("receiverEmail", "==", currentUser.email),
        orderBy("timestamp", "desc")
    );

    onSnapshot(modalInboxQuery, (snapshot) => {
        const messages = [];
        snapshot.forEach(d => {
            messages.push({ id: d.id, ...d.data(), direction: 'received' });
        });
        renderFullModalMessages(modalInboxContent, messages, 'inbox');
        modalInboxCountSpan.textContent = messages.length;
    }, (error) => {
        console.error("Error listening to modal inbox:", error);
        showMessage("Error loading received messages in modal.");
    });
}

/**
 * Renders messages into the specified container for the full messages modal.
 */
function renderFullModalMessages(container, messages, boxType) {
    container.innerHTML = '';
    let emptyMessageElement = boxType === 'outbox' ? modalOutboxEmptyMessage : modalInboxEmptyMessage;

    if (messages.length === 0) {
        emptyMessageElement.style.display = 'block';
        container.appendChild(emptyMessageElement);
        return;
    } else {
        emptyMessageElement.style.display = 'none';
    }

    messages.forEach(msg => {
        let typeClass = '';
        switch (msg.type) {
            case 'grievance': typeClass = 'msg-grievance'; break;
            case 'compliment': typeClass = 'msg-compliment'; break;
            case 'good-memory': typeClass = 'msg-good-memory'; break;
            case 'how-i-feel': typeClass = 'msg-how-i-feel'; break;
            default: typeClass = 'bg-gray-100';
        }
        container.innerHTML += renderMessageHtml(msg, typeClass, false); // No highlight in full modal
    });
}

/**
 * Sets up listeners for incoming clear requests (for partners).
 */
function setupIncomingClearRequestListener() {
    if (!currentUser) return;

    const clearRequestsRef = collection(db, "clearRequests");
    const incomingRequestsQuery = query(
        clearRequestsRef,
        where("partnerEmail", "==", currentUser.email),
        where("status", "==", "pending")
    );

    onSnapshot(incomingRequestsQuery, (snapshot) => {
        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
                const request = change.doc.data();
                activeClearRequestDocId = change.doc.id; // Store for response handling
                requesterNameSpan.textContent = request.requesterNickname || request.requesterEmail;
                requestReasonSpan.textContent = request.reason;
                declineReasonInput.value = ''; // Clear any previous decline reason
                window.openModal('clear-response-modal');
                console.log("New clear request received:", request);
            }
        });
    }, (error) => {
        console.error("Error listening for incoming clear requests:", error);
    });
}

/**
 * Sets up listener for outgoing clear request status changes (for sender).
 */
function setupOutgoingClearRequestListener() {
    if (!currentUser) return;

    const clearRequestsRef = collection(db, "clearRequests");
    const outgoingRequestsQuery = query(
        clearRequestsRef,
        where("requesterId", "==", currentUser.uid),
        where("status", "!=", "pending")
    );

    onSnapshot(outgoingRequestsQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
            if (change.type === "modified") {
                const request = change.doc.data();
                const requestId = change.doc.id;

                if (request.status === "accepted") {
                    console.log("Clear request accepted by partner:", request);
                    window.openModal('clear-final-confirm-modal');
                    finalConfirmClearButton.dataset.requestId = requestId; // Store the request ID temporarily
                } else if (request.status === "declined") {
                    console.log("Clear request declined by partner:", request);
                    statusModalTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2A9 9 0 111 10a9 9 0 0118 0z" />
                    </svg> Request Declined`;
                    statusModalMessage.textContent = `Your partner, ${request.partnerNickname || request.partnerEmail}, has declined your request to clear all messages.`;
                    statusModalReason.textContent = request.declineReason ? `Reason: "${request.declineReason}"` : 'No reason provided.';
                    window.openModal('clear-status-modal');
                    await deleteDoc(doc(db, "clearRequests", requestId));
                }
            }
            if (change.type === "removed" && change.doc.id === finalConfirmClearButton.dataset.requestId) {
                 console.log("Clear request document removed after full processing.");
                 delete finalConfirmClearButton.dataset.requestId;
            }
        });
    }, (error) => {
        console.error("Error listening for outgoing clear requests:", error);
    });
}


// --- Event Listeners ---

logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.replace(window.location.origin + '/index.html');
    } catch (error) {
        console.error("Error logging out:", error);
        showMessage("Failed to log out. Please try again.");
    }
});

editProfileButton.addEventListener('click', () => {
    if (userProfile) {
        editNicknameInput.value = userProfile.nickname || '';
        editPartnerEmailInput.value = userProfile.partnerEmail || '';
        editPartnerNicknameInput.value = userProfile.partnerNickname || '';
    }
    window.openModal('edit-profile-modal');
});

editProfileForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) {
        showMessage("User not authenticated.");
        return;
    }

    const newNickname = editNicknameInput.value.trim();
    const newPartnerEmail = editPartnerEmailInput.value.trim();
    const newPartnerNickname = editPartnerNicknameInput.value.trim();

    if (!newNickname) {
        showMessage("Nickname cannot be empty.");
        return;
    }

    try {
        const updatedProfile = {
            nickname: newNickname,
            partnerEmail: newPartnerEmail,
            partnerNickname: newPartnerNickname
        };
        await saveUserProfile(currentUser.uid, updatedProfile);
        userProfile = { ...userProfile, ...updatedProfile };
        updateProfileDisplay(userProfile);
        showMessage("Profile updated successfully!");
        window.closeModal('edit-profile-modal');
    } catch (error) {
        console.error("Error updating profile:", error);
    }
});

sendMessageButton.addEventListener('click', () => {
    messageContentInput.value = '';
    messageTypeSelect.value = 'grievance'; // Default to Grievance
    messagePrioritySelect.value = 'medium';
    messageMoodSelect.value = 'happy';
    updateSendMessageModalHeader('grievance'); // Set initial header and background
    window.openModal('send-message-modal');
});

messageTypeSelect.addEventListener('change', (event) => {
    updateSendMessageModalHeader(event.target.value);
});

sendMessageForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser || !userProfile) {
        showMessage("Authentication error. Please log in again.");
        return;
    }

    const content = messageContentInput.value.trim();
    const type = messageTypeSelect.value;
    const priority = messagePrioritySelect.value;
    const mood = messageMoodSelect.value;

    if (!content) {
        showMessage("Message cannot be empty.");
        return;
    }
    if (!userProfile.partnerEmail) {
         showMessage("Please set your partner's email in 'Edit Profile' before sending messages.");
         return;
    }

    await sendMessage(currentUser.uid, userProfile, userProfile.partnerEmail, content, type, priority, mood);
    window.closeModal('send-message-modal');
});

viewInboxOutboxButton.addEventListener('click', () => {
    window.openModal('full-messages-modal');
    switchModalTab('modal-outbox');
    setupFullMessagesModalListeners();
});

modalOutboxTabButton.addEventListener('click', () => switchModalTab('modal-outbox'));
modalInboxTabButton.addEventListener('click', () => switchModalTab('modal-inbox'));

// --- Clear All Specific Event Listeners ---
clearAllButton.addEventListener('click', () => {
    if (!currentUser || !userProfile || !userProfile.partnerEmail) {
        showMessage("Please ensure you are logged in and have a partner email set in your profile to use this feature.");
        return;
    }
    clearReasonInput.value = '';
    window.openModal('clear-request-modal');
});

clearRequestForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const reason = clearReasonInput.value.trim();
    if (!reason) {
        showMessage("Please provide a reason to clear messages.");
        return;
    }
    await sendClearAllRequest(reason);
});

// Partner's side: Accept/Decline logic
declineClearButton.addEventListener('click', async () => {
    if (!activeClearRequestDocId) {
        showMessage("No active clear request to decline.");
        return;
    }
    const declineReason = declineReasonInput.value.trim();
    try {
        const requestDocRef = doc(db, "clearRequests", activeClearRequestDocId);
        await updateDoc(requestDocRef, {
            status: 'declined',
            declineReason: declineReason || 'No specific reason provided.'
        });
        showMessage("You declined the clear request.");
        window.closeModal('clear-response-modal');
        activeClearRequestDocId = null;
    } catch (error) {
        console.error("Error declining clear request:", error);
        showMessage("Failed to decline request: " + error.message);
    }
});

acceptClearButton.addEventListener('click', async () => {
    if (!activeClearRequestDocId) {
        showMessage("No active clear request to accept.");
        return;
    }
    try {
        const requestDocRef = doc(db, "clearRequests", activeClearRequestDocId);
        await updateDoc(requestDocRef, {
            status: 'accepted'
        });
        showMessage("You accepted the clear request. Messages will be cleared for both of you once your partner confirms.");
        window.closeModal('clear-response-modal');
        activeClearRequestDocId = null;
    } catch (error) {
        console.error("Error accepting clear request:", error);
        showMessage("Failed to accept request: " + error.message);
    }
});

// Sender's side: Final confirmation after partner accepts
finalConfirmClearButton.addEventListener('click', async () => {
    const requestId = finalConfirmClearButton.dataset.requestId;
    if (!currentUser || !requestId) {
        showMessage("Authentication error or no active clear request for final confirmation.");
        return;
    }

    try {
        window.closeModal('clear-final-confirm-modal');
        await executeClearAllMessages();
        await deleteDoc(doc(db, "clearRequests", requestId));
        statusModalTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> Messages Cleared!`;
        statusModalMessage.textContent = "All your messages have been successfully cleared.";
        statusModalReason.textContent = "";
        window.openModal('clear-status-modal');
    } catch (error) {
        console.error("Error during final clear confirmation:", error);
        showMessage("An error occurred during message clearing: " + error.message);
    }
});


// --- Authentication State Observer ---

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        console.log("User authenticated:", user.email);

        userProfile = await getUserProfile(user);
        updateProfileDisplay(userProfile);
        setupLatestMessagesListener();
        setupIncomingClearRequestListener();
        setupOutgoingClearRequestListener();
    } else {
        currentUser = null;
        userProfile = null;
        console.log("No user signed in. Redirecting to index.html");
        window.location.replace(window.location.origin + '/index.html');
    }
});

/**
 * Updates the displayed user and partner information on the dashboard.
 * @param {object} profile - The user's current profile data.
 */
function updateProfileDisplay(profile) {
    userNicknameSpan.textContent = profile.nickname || profile.email;
    profileYouName.textContent = profile.nickname || profile.email;
    profilePartnerName.textContent = profile.partnerNickname || profile.partnerEmail || 'Not set';
}

/**
 * Updates the title, icon, and background of the "Send Message" modal based on selected message type.
 * @param {string} messageType - The selected message type (e.g., 'grievance', 'compliment').
 */
function updateSendMessageModalHeader(messageType) {
    let titleText = "Send Message";
    let iconSvg = '';
    let iconColorClass = '';
    let modalBgClass = '';

    // Remove all previous background classes first
    sendMessageModalContent.classList.remove('modal-bg-grievance', 'modal-bg-compliment', 'modal-bg-good-memory', 'modal-bg-how-i-feel');

    switch (messageType) {
        case 'grievance':
            titleText = "Send a Grievance";
            iconSvg = `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293A1 1 0 007.293 8.707L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />`; // X icon
            iconColorClass = 'text-red-500';
            modalBgClass = 'modal-bg-grievance';
            break;
        case 'compliment':
            titleText = "Send a Compliment";
            iconSvg = `<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />`; // Checkmark icon
            iconColorClass = 'text-orange-500';
            modalBgClass = 'modal-bg-compliment';
            break;
        case 'good-memory':
            titleText = "Share a Good Memory";
            iconSvg = `<path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fill-rule="evenodd" d="M4 5a2 2 0 012-2h3V2a2 2 0 00-2-2H6a2 2 0 00-2 2v1H2a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2h-2V2a2 2 0 00-2-2H9a2 2 0 00-2 2v1H4a2 2 0 00-2 2v4a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm-1 5a1 1 0 100 2h10a1 1 0 100-2H3z" clip-rule="evenodd" />`; // Calendar/Memory icon
            iconColorClass = 'text-blue-500';
            modalBgClass = 'modal-bg-good-memory';
            break;
        case 'how-i-feel':
            titleText = "How I Feel";
            iconSvg = `<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-4-3a1 1 0 000 2h.01a1 1 0 000-2H7zm4-2a1 1 0 10-2 0 1 1 0 002 0zm2 2a1 1 0 000 2h.01a1 1 0 000-2H13z" clip-rule="evenodd" />`; // Emoji icon
            iconColorClass = 'text-yellow-500';
            modalBgClass = 'modal-bg-how-i-feel';
            break;
    }
    sendMessageModalTitle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline-block mr-2 ${iconColorClass}" viewBox="0 0 20 20" fill="currentColor">${iconSvg}</svg>${titleText}`;
    sendMessageModalContent.classList.add(modalBgClass);
}
