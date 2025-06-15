// Firebase SDK imports
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

// Firebase configuration
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

// DOM Elements
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

// Modals
const messageBox = document.getElementById('messageBox');
const messageText = document.getElementById('messageText');
const messageBoxClose = document.getElementById('messageBoxClose');
const editProfileModal = document.getElementById('edit-profile-modal');
const editProfileForm = document.getElementById('edit-profile-form');
const editNicknameInput = document.getElementById('edit-nickname');
const editPartnerEmailInput = document.getElementById('edit-partner-email');
const editPartnerNicknameInput = document.getElementById('edit-partner-nickname');
const sendMessageModal = document.getElementById('send-message-modal');
const sendMessageForm = document.getElementById('send-message-form');
const messageContentInput = document.getElementById('message-content');
const messageTypeSelect = document.getElementById('message-type-select');
const messagePrioritySelect = document.getElementById('message-priority');
const messageMoodSelect = document.getElementById('message-mood');
const fullMessagesModal = document.getElementById('full-messages-modal');
const modalOutboxTabButton = document.querySelector('.modal-tab-button[data-modal-tab="modal-outbox"]');
const modalInboxTabButton = document.querySelector('.modal-tab-button[data-modal-tab="modal-inbox"]');
const modalOutboxContent = document.getElementById('modal-outbox-content');
const modalInboxContent = document.getElementById('modal-inbox-content');
const clearRequestModal = document.getElementById('clear-request-modal');
const clearRequestForm = document.getElementById('clear-request-form');
const clearReasonInput = document.getElementById('clear-reason');
const clearResponseModal = document.getElementById('clear-response-modal');
const clearRequestPendingIndicator = document.getElementById('clear-request-pending-indicator');

// State variables
let currentUser = null;
let userProfile = null;
let activeClearRequestDocId = null;
let unsubscribeFunctions = [];

// Utility Functions
function showMessage(message, callback) {
    messageText.textContent = message;
    messageBox.style.display = 'block';
    messageBoxClose.onclick = () => {
        messageBox.style.display = 'none';
        if (callback) callback();
    };
}

window.openModal = (modalId) => {
    document.getElementById(modalId).classList.add('open');
    if (modalId === 'clear-response-modal') {
        updateClearRequestIndicatorVisibility(false);
    }
};

window.closeModal = (modalId) => {
    document.getElementById(modalId).classList.remove('open');
    if (modalId === 'clear-response-modal' && activeClearRequestDocId) {
        updateClearRequestIndicatorVisibility(true);
    }
};

function updateClearRequestIndicatorVisibility(visible) {
    if (clearRequestPendingIndicator) {
        clearRequestPendingIndicator.style.display = visible ? 'flex' : 'none';
    }
}

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

function renderMessageHtml(message, typeClass, isLatestHighlight = false) {
    const date = message.timestamp?.toDate().toLocaleString() || 'N/A';
    const senderDisplayName = message.senderNickname || message.senderEmail;
    const receiverDisplayName = message.receiverNickname || message.receiverEmail;
    const highlightClass = isLatestHighlight ? 'msg-latest-highlight' : '';

    return `
        <div class="p-3 mb-3 rounded-lg ${typeClass} ${highlightClass}">
            <div>
                <p class="text-sm text-gray-700 font-medium">
                    ${message.type.charAt(0).toUpperCase() + message.type.slice(1)}
                    ${message.priority ? ` (Priority: ${message.priority})` : ''}
                    ${message.mood ? ` (Mood: ${message.mood})` : ''}
                </p>
                <p class="text-gray-800">${message.content}</p>
                <p class="text-xs text-gray-500 mt-1">
                    ${message.direction === 'sent' ? `To: ${receiverDisplayName}` : `From: ${senderDisplayName}`} on ${date}
                </p>
            </div>
        </div>
    `;
}

// Firebase Operations
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

async function saveUserProfile(userId, profileData) {
    const userDocRef = doc(db, "users", userId);
    try {
        await setDoc(userDocRef, profileData, { merge: true });
    } catch (error) {
        console.error("Error saving profile:", error);
        showMessage("Failed to save profile. Error: " + error.message);
    }
}

async function sendMessage(senderId, senderProfile, receiverEmail, content, type, priority, mood) {
    try {
        let receiverId = null;
        let receiverNickname = receiverEmail;
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", receiverEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            querySnapshot.forEach((d) => {
                receiverId = d.id;
                receiverNickname = d.data().nickname || receiverEmail;
            });
        }

        await addDoc(collection(db, "messages"), {
            senderId: senderId,
            senderEmail: senderProfile.email,
            senderNickname: senderProfile.nickname,
            receiverEmail: receiverEmail,
            receiverId: receiverId,
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

// Listeners
function setupLatestMessagesListener() {
    if (!currentUser) return;

    const messagesRef = collection(db, "messages");
    let allUserMessages = [];

    // Sent messages
    const sentQuery = query(
        messagesRef,
        where("senderId", "==", currentUser.uid),
        orderBy("timestamp", "desc")
    );
    const sentUnsub = onSnapshot(sentQuery, 
        (snapshot) => {
            const sent = snapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data(), 
                direction: 'sent' 
            }));
            allUserMessages = [...allUserMessages.filter(m => m.direction !== 'sent'), ...sent];
            renderLatestMessages(latestMessagesContent, allUserMessages.slice(0, 3));
        },
        (error) => {
            console.error("Sent messages error:", error);
        }
    );

    // Received messages
    const receivedQuery = query(
        messagesRef,
        where("receiverEmail", "==", currentUser.email),
        orderBy("timestamp", "desc")
    );
    const receivedUnsub = onSnapshot(receivedQuery,
        (snapshot) => {
            const received = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data(), direction: 'received' }));
            allUserMessages = [...allUserMessages.filter(m => m.direction !== 'received'), ...received];
            renderLatestMessages(latestMessagesContent, allUserMessages.slice(0, 3));
        },
        (error) => {
            console.error("Received messages error:", error);
        }
    );

    unsubscribeFunctions.push(sentUnsub, receivedUnsub);
}

function renderLatestMessages(container, messages) {
    container.innerHTML = '';
    if (messages.length === 0) {
        latestMessagesEmptyMessage.style.display = 'block';
        container.appendChild(latestMessagesEmptyMessage);
        return;
    }
    latestMessagesEmptyMessage.style.display = 'none';

    messages.forEach((msg, index) => {
        const typeClass = `msg-${msg.type.replace(' ', '-')}`;
        container.innerHTML += renderMessageHtml(msg, typeClass, index === 0);
    });
}

// Initialize
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        userProfile = await getUserProfile(user);
        updateProfileDisplay(userProfile);
        setupLatestMessagesListener();
    } else {
        window.location.replace('/index.html');
    }
});

function updateProfileDisplay(profile) {
    userNicknameSpan.textContent = profile.nickname || profile.email;
    profileYouName.textContent = profile.nickname || profile.email;
    profilePartnerName.textContent = profile.partnerNickname || profile.partnerEmail || 'Not set';
}

// Event Listeners
logoutButton.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout error:", error);
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

editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const updatedProfile = {
        nickname: editNicknameInput.value.trim(),
        partnerEmail: editPartnerEmailInput.value.trim(),
        partnerNickname: editPartnerNicknameInput.value.trim()
    };
    await saveUserProfile(currentUser.uid, updatedProfile);
    userProfile = { ...userProfile, ...updatedProfile };
    updateProfileDisplay(userProfile);
    window.closeModal('edit-profile-modal');
});

sendMessageButton.addEventListener('click', () => {
    messageContentInput.value = '';
    window.openModal('send-message-modal');
});

sendMessageForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await sendMessage(
        currentUser.uid,
        userProfile,
        userProfile.partnerEmail,
        messageContentInput.value.trim(),
        messageTypeSelect.value,
        messagePrioritySelect.value,
        messageMoodSelect.value
    );
    window.closeModal('send-message-modal');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    unsubscribeFunctions.forEach(fn => fn());
});
