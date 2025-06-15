// dashboard.js

// Firebase SDK imports
// Ensure all necessary Firestore functions are explicitly imported here.
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    writeBatch,
    getDocs,
    deleteDoc,
    updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

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
const sendMessageModalContent = document.getElementById('send-message-modal-content');

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
const minimizeClearButton = document.getElementById('minimize-clear-button');

const clearFinalConfirmModal = document.getElementById('clear-final-confirm-modal');
const finalConfirmClearButton = document.getElementById('final-confirm-clear-button');

const clearStatusModal = document.getElementById('clear-status-modal');
const statusModalTitle = document.getElementById('status-modal-title');
const statusModalMessage = document.getElementById('status-modal-message');
const statusModalReason = document.getElementById('status-modal-reason');

const clearRequestPendingIndicator = document.getElementById('clear-request-pending-indicator');


let currentUser = null;
let userProfile = null;
let activeClearRequestDocId = null;

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
    // Hide the indicator if the clear response modal is opened
    if (modalId === 'clear-response-modal') {
        updateClearRequestIndicatorVisibility(false);
    }
}

/**
 * Closes a given modal.
 * @param {string} modalId - The ID of the modal element to close.
 */
window.closeModal = function(modalId) {
    document.getElementById(modalId).classList.remove('open');
    // Show the indicator if the clear response modal is closed AND a request is pending
    if (modalId === 'clear-response-modal' && activeClearRequestDocId) {
        updateClearRequestIndicatorVisibility(true);
    }
}

/**
 * Updates the visibility of the clear request pending indicator.
 * @param {boolean} visible - True to show, false to hide.
 */
function updateClearRequestIndicatorVisibility(visible) {
    if (clearRequestPendingIndicator) {
        clearRequestPendingIndicator.style.display = visible ? 'flex' : 'none';
    }
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

/**
 * Renders messages into the full modal content area (Inbox/Outbox).
 * @param {HTMLElement} container - The DOM element to render messages into.
 * @param {Array<object>} messages - Array of message objects.
 * @param {string} type - 'inbox' or 'outbox' for specific styling/empty messages.
 */
function renderFullModalMessages(container, messages, type) {
    container.innerHTML = ''; // Clear previous messages
    if (messages.length === 0) {
        if (type === 'outbox') {
            modalOutboxEmptyMessage.style.display = 'block';
            container.appendChild(modalOutboxEmptyMessage);
        } else if (type === 'inbox') {
            modalInboxEmptyMessage.style.display = 'block';
            container.appendChild(modalInboxEmptyMessage);
        }
        return;
    } else {
        modalOutboxEmptyMessage.style.display = 'none';
        modalInboxEmptyMessage.style.display = 'none';
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
        container.innerHTML += renderMessageHtml(msg, typeClass, false); // No highlight for full list
    });
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
            nickname: user.email.split('@')[0], // Default nickname from email prefix
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
        showMessage("Failed to save profile changes. Please check your user permissions in Firestore security rules. Error: " + error.message);
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
            // This is where the read rule applies: only show if current user is sender OR receiver (by email or UID)
            if (data.senderId === currentUser.uid || data.receiverEmail === currentUser.email || data.receiverUid === currentUser.uid) {
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
        showMessage("Error loading latest messages: " + error.message);
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

    // Outbox Query (messages sent by current user)
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
        showMessage("Error loading sent messages in modal: " + error.message);
    });

    // Inbox Query (messages received by current user - checking by email OR receiverUid)
    const modalInboxQuery = query(
        messagesRef,
        where("receiverEmail", "==", currentUser.email), // Primary check
        // Note: Firestore does not support OR queries directly on different fields in security rules or client queries easily.
        // If receiverUid is *also* needed for the query, it would typically require a composite index and/or multiple queries.
        // For simplicity and alignment with security rules, we'll primarily use receiverEmail as per rule:
        // (resource.data.receiverId == request.auth.uid || resource.data.receiverEmail == request.auth.token.email)
        // The client-side query must match an index.
        orderBy("timestamp", "desc")
    );

    onSnapshot(modalInboxQuery, (snapshot) => {
        const messages = [];
        snapshot.forEach(d => {
            const data = d.data();
            // Client-side filter to strictly match rule logic if query is broad
            if (data.receiverEmail === currentUser.email || data.receiverUid === currentUser.uid) {
                messages.push({ id: d.id, ...data, direction: 'received' });
            }
        });
        // Sort client-side if data is retrieved broadly but filtered more strictly by rules
        messages.sort((a, b) => {
            const timeA = a.timestamp ? a.timestamp.toDate().getTime() : 0;
            const timeB = b.timestamp ? b.timestamp.toDate().getTime() : 0;
            return timeB - timeA;
        });

        renderFullModalMessages(modalInboxContent, messages, 'inbox');
        modalInboxCountSpan.textContent = messages.length;
    }, (error) => {
        console.error("Error listening to modal inbox:", error);
        showMessage("Error loading received messages in modal: " + error.message);
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
        let pendingRequestFound = false;
        snapshot.docChanges().forEach(change => {
            if (change.type === "added") {
                const request = change.doc.data();
                activeClearRequestDocId = change.doc.id; // Store for response handling
                requesterNameSpan.textContent = request.requesterNickname || request.requesterEmail;
                requestReasonSpan.textContent = request.reason;
                declineReasonInput.value = ''; // Clear any previous decline reason
                window.openModal('clear-response-modal');
                pendingRequestFound = true; // Mark that a pending request was found and opened
                console.log("New clear request received:", request);
            } else if (change.type === "removed") {
                // If a pending request is removed (e.g., accepted/declined elsewhere)
                if (change.doc.id === activeClearRequestDocId) {
                    activeClearRequestDocId = null; // Clear the ID
                    window.closeModal('clear-response-modal'); // Close the modal if it's open
                }
            }
        });
        // After processing all changes, update indicator visibility
        // Show indicator if active request exists AND modal is NOT open
        updateClearRequestIndicatorVisibility(activeClearRequestDocId && !clearResponseModal.classList.contains('open'));
    }, (error) => {
        console.error("Error listening for incoming clear requests:", error);
        showMessage("Error listening for clear requests: " + error.message);
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
                    // Store the request ID temporarily to delete it after final clear
                    finalConfirmClearButton.dataset.requestId = requestId;
                } else if (request.status === "declined") {
                    console.log("Clear request declined by partner:", request);
                    statusModalTitle.innerHTML = `❌ Request Declined`;
                    statusModalMessage.textContent = `Your partner, ${request.partnerNickname || request.partnerEmail}, has declined your request to clear all messages.`;
                    statusModalReason.textContent = request.declineReason ? `Reason: "${request.declineReason}"` : 'No reason provided.';
                    window.openModal('clear-status-modal');
                    // Delete the request from Firestore after showing status
                    await deleteDoc(doc(db, "clearRequests", requestId));
                }
            }
            // If type is 'removed', it means the request has been fully processed and deleted
            if (change.type === "removed" && change.doc.id === finalConfirmClearButton.dataset.requestId) {
                 console.log("Clear request document removed after full processing.");
                 // Clear the stored request ID
                 delete finalConfirmClearButton.dataset.requestId;
                 updateClearRequestIndicatorVisibility(false);
            }
        });
    }, (error) => {
        console.error("Error listening for outgoing clear requests:", error);
        showMessage("Error listening for outgoing clear requests: " + error.message);
        // The URL for index creation is printed here in the console during development
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
    if (!newPartnerEmail) {
        showMessage("Partner's Email is required.");
        return;
    }
    if (!newPartnerNickname) {
        showMessage("Partner's Nickname is required.");
        return;
    }

    try {
        const updatedProfile = {
            nickname: newNickname,
            partnerEmail: newPartnerEmail,
            partnerNickname: newPartnerNickname
        };
        await setDoc(doc(db, "users", currentUser.uid), updatedProfile, { merge: true });
        userProfile = { ...userProfile, ...updatedProfile };
        updateProfileDisplay(userProfile);
        showMessage("Profile updated successfully!");
        window.closeModal('edit-profile-modal');
    } catch (error) {
        console.error("Error updating profile:", error);
        showMessage("Failed to save profile changes. Please check your user permissions in Firestore security rules. Error: " + error.message);
        console.warn("Firestore Security Rule Hint: Ensure your 'users' collection rules allow authenticated users to 'write' to their own document (e.g., 'allow write: if request.auth != null && request.auth.uid == userId;').");
    }
});

sendMessageButton.addEventListener('click', () => {
    messageContentInput.value = '';
    messageTypeSelect.value = 'grievance';
    messagePrioritySelect.value = 'medium';
    messageMoodSelect.value = 'happy';
    updateSendMessageModalHeader('grievance');
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
        updateClearRequestIndicatorVisibility(false);
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
        updateClearRequestIndicatorVisibility(false);
    } catch (error) {
        console.error("Error accepting clear request:", error);
        showMessage("Failed to accept request: " + error.message);
    }
});

minimizeClearButton.addEventListener('click', () => {
    if (activeClearRequestDocId) {
        window.closeModal('clear-response-modal');
    } else {
        showMessage("No active clear request to minimize.");
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
        statusModalTitle.innerHTML = `🎉 Messages Cleared!`;
        statusModalMessage.textContent = "All your messages have been successfully cleared.";
        statusModalReason.textContent = "";
        window.openModal('clear-status-modal');
        updateClearRequestIndicatorVisibility(false);
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

        // Initial check for indicator visibility after user and profile are loaded
        updateClearRequestIndicatorVisibility(activeClearRequestDocId && !clearResponseModal.classList.contains('open'));

    } else {
        currentUser = null;
        userProfile = null;
        console.log("No user signed in. Redirecting to index.html");
        window.location.replace(window.location.origin + '/index.html');
    }
});

function updateProfileDisplay(profile) {
    userNicknameSpan.textContent = profile.nickname || profile.email;
    profileYouName.textContent = profile.nickname || profile.email;
    profilePartnerName.textContent = profile.partnerNickname || profile.partnerEmail || 'Not set';
}

function updateSendMessageModalHeader(messageType) {
    let titleText = "Send Message";
    let iconEmoji = '';
    let iconColorClass = '';
    let modalBgClass = '';

    const currentSendMessageModalContent = document.getElementById('send-message-modal-content');
    const currentSendMessageModalTitle = sendMessageModal.querySelector('h3');
    if (!currentSendMessageModalContent || !currentSendMessageModalTitle) return;

    currentSendMessageModalContent.classList.remove('modal-bg-grievance', 'modal-bg-compliment', 'modal-bg-good-memory', 'modal-bg-how-i-feel');

    switch (messageType) {
        case 'grievance':
            titleText = "Send a Grievance";
            iconEmoji = '😡';
            iconColorClass = 'text-red-500';
            modalBgClass = 'modal-bg-grievance';
            break;
        case 'compliment':
            titleText = "Send a Compliment";
            iconEmoji = '❤️';
            iconColorClass = 'text-orange-500';
            modalBgClass = 'modal-bg-compliment';
            break;
        case 'good-memory':
            titleText = "Share a Good Memory";
            iconEmoji = '�';
            iconColorClass = 'text-blue-500';
            modalBgClass = 'modal-bg-good-memory';
            break;
        case 'how-i-feel':
            titleText = "How I Feel";
            iconEmoji = '🤔';
            iconColorClass = 'text-yellow-500';
            modalBgClass = 'modal-bg-how-i-feel';
            break;
    }
    currentSendMessageModalTitle.innerHTML = `<span class="${iconColorClass} mr-2">${iconEmoji}</span> ${titleText}`;
    currentSendMessageModalContent.classList.add(modalBgClass);
}

document.addEventListener('DOMContentLoaded', () => {
    if (clearRequestPendingIndicator) {
        clearRequestPendingIndicator.addEventListener('click', () => {
            window.openModal('clear-response-modal');
        });
    }
});
�
