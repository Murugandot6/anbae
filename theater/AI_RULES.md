# AI Development Rules for SyncStream

This document outlines the technology stack and provides clear guidelines for the AI developer to follow when modifying this application. The goal is to maintain consistency, simplicity, and performance.

## Technology Stack

The application is built with the following technologies:

*   **Framework:** React with Vite for a fast development experience.
*   **Language:** TypeScript for type safety and improved developer experience.
*   **Backend & Database:** Supabase is used for user authentication, real-time database features (chat, video state sync), and presence tracking.
*   **Styling:** Tailwind CSS is used for all styling, applied directly via utility classes. No custom CSS files.
*   **Video Playback:** `react-player` is used to handle video playback from various sources like YouTube and direct file links.
*   **State Management:** Primarily uses React's built-in hooks (`useState`, `useEffect`) and Context API (`useContext`) for sharing the Supabase client.
*   **Icons:** A set of custom SVG icons converted into React components, located in `src/components/icons.tsx`.

## Library Usage Rules

To ensure the codebase remains clean and maintainable, please adhere to the following rules:

1.  **UI Components:**
    *   **DO:** Create new, single-purpose React components in the `src/components/` directory.
    *   **DO:** Use Tailwind CSS for all styling within these components.
    *   **DO NOT:** Introduce a new component library like Material-UI, Ant Design, or Shadcn/UI. The existing custom component approach should be maintained.

2.  **Icons:**
    *   **DO:** Add new SVG icons as React components to the existing `src/components/icons.tsx` file.
    *   **DO NOT:** Install a third-party icon library (e.g., `lucide-react`, `react-icons`).

3.  **Backend & Data Fetching:**
    *   **DO:** Use the `useSupabase` hook for all interactions with the backend, including authentication, database queries, and real-time subscriptions.
    *   **DO NOT:** Add other data-fetching libraries like `axios` or `react-query`. The Supabase client is sufficient.

4.  **State Management:**
    *   **DO:** Use `useState` and `useReducer` for local component state.
    *   **DO:** Use React Context for sharing global values like the Supabase client.
    *   **DO NOT:** Introduce complex state management libraries like Redux. If more complex global state is needed, a lightweight library like Zustand could be considered after discussion.

5.  **Styling:**
    *   **DO:** Use Tailwind CSS utility classes for all styling.
    *   **DO NOT:** Write custom CSS in `.css` files or use CSS-in-JS libraries (e.g., styled-components, Emotion).

6.  **Dependencies:**
    *   **DO:** Scrutinize the need for any new dependency. Often, the desired functionality can be achieved with the existing stack.
    *   **DO NOT:** Add new libraries without a strong justification for why the current tools are insufficient.