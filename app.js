// app.js

document.addEventListener('DOMContentLoaded', () => {
    // Get references to DOM elements
    const searchInput = document.getElementById('search-input');
    const typingCursor = document.getElementById('typing-cursor');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');

    // Array of placeholders for the typing animation, reflecting "lovers search history"
    const placeholders = [
        "What are your lover's dreams?",
        "What is your lover's favorite color?",
        "What makes your lover happy?",
        "Remember your first date with your lover?",
        "Your lover's favorite song?",
        "How to surprise your lover?",
        "Find a perfect gift for your lover...",
        "Plan a romantic getaway for your lover...",
        "What is your lover's love language?",
        "Where did you first meet your lover?",
        "Search your lover's favorite movie...",
        "What is your lover's biggest wish?",
        "Memorable moments with your lover...",
        "What brings your lover joy?",
        "Ways to show your lover you care...",
        "A poem for your lover...",
        "Your lover's childhood memory...",
        "What's on your lover's bucket list?",
        "Favorite quotes about love from your lover...",
        "How to make your lover smile today?"
    ];

    // Variables to control the typing animation state
    let currentPlaceholderIndex = 0; // Index of the current placeholder in the array
    let charIndex = 0; // Current character index within the current placeholder
    let isDeleting = false; // Flag to indicate if characters are being deleted
    let typingSpeed = 100; // Speed of typing (milliseconds per character)
    let deletingSpeed = 50; // Speed of deleting (milliseconds per character)
    let delayBetweenPlaceholders = 1500; // Delay before typing the next placeholder after one is fully deleted

    /**
     * Implements the dynamic typing and deleting animation for the search input's placeholder.
     * It cycles through the predefined 'placeholders' array, typing each one out
     * character by character, then deleting it, and moving to the next.
     */
    function typePlaceholder() {
        const currentPlaceholder = placeholders[currentPlaceholderIndex];
        const currentText = currentPlaceholder.substring(0, charIndex);

        // Update the placeholder attribute of the search input
        searchInput.placeholder = currentText;

        // Dynamically position the blinking cursor to the right of the typed text.
        // A temporary span is used to measure the width of the text accurately.
        const tempSpan = document.createElement('span');
        tempSpan.style.visibility = 'hidden'; // Make it invisible
        tempSpan.style.position = 'absolute'; // Position it absolutely to not affect layout
        tempSpan.style.whiteSpace = 'pre'; // Preserve spaces for accurate width calculation
        tempSpan.textContent = currentText; // Set its content to the current typed text
        document.body.appendChild(tempSpan); // Temporarily add to DOM to measure
        const textWidth = tempSpan.offsetWidth; // Get the width of the text
        document.body.removeChild(tempSpan); // Remove it from DOM

        // Adjust cursor's left position based on text width and input's left padding (px-5 -> 20px)
        const paddingLeft = 20;
        typingCursor.style.left = `${paddingLeft + textWidth}px`;
        typingCursor.style.opacity = '1'; // Ensure cursor is visible during the animation

        if (!isDeleting) {
            // If currently typing characters
            charIndex++;
            if (charIndex > currentPlaceholder.length) {
                // If the entire placeholder has been typed, start deleting
                isDeleting = true;
                typingCursor.style.animation = 'none'; // Stop the blinking animation temporarily
                // Resume blinking after a short delay to make the full text visible briefly
                setTimeout(() => typingCursor.style.animation = 'blink 1s step-end infinite', 500);
                // Wait before starting to delete
                setTimeout(typePlaceholder, delayBetweenPlaceholders);
            } else {
                // Continue typing
                setTimeout(typePlaceholder, typingSpeed);
            }
        } else {
            // If currently deleting characters
            charIndex--;
            if (charIndex < 0) {
                // If all characters have been deleted, move to the next placeholder
                isDeleting = false;
                currentPlaceholderIndex = (currentPlaceholderIndex + 1) % placeholders.length; // Cycle through placeholders
                // Start typing the next placeholder immediately
                setTimeout(typePlaceholder, typingSpeed);
            } else {
                // Continue deleting
                setTimeout(typePlaceholder, deletingSpeed);
            }
        }
    }

    // Initialize the typing animation when the DOM is fully loaded
    typePlaceholder();

    // Event listener for the Login button: Navigates to login.html
    loginButton.addEventListener('click', () => {
        console.log("Navigating to login.html");
        window.location.href = 'login.html';
    });

    // Event listener for the Register button: Navigates to register.html
    registerButton.addEventListener('click', () => {
        console.log("Navigating to register.html");
        window.location.href = 'register.html';
    });

    // Event listener for the 'Enter' key press in the search input.
    // While the primary actions are now Login/Register, this handles what happens
    // if a user types something and presses Enter.
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            console.log("Enter pressed in search input. Current value:", searchInput.value);
            // In a full application, this could trigger a search function,
            // or perform another action if the user is logged in.
            // For now, it simply shows an alert with the typed text.
            alert(`You typed: "${searchInput.value}"`);
        }
    });
});
