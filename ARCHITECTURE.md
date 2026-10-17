# System Architecture

## Tech Stack
*   **Frontend:** Next.js (React) + Tailwind CSS (Fast UI development).
*   **Backend & Realtime DB:** Firebase (Firestore + Auth) - *Chosen for out-of-the-box real-time sync for friend activity.*
*   **AI:** Grok API (via Cursor for coding) + OpenAI (for the chatbot logic).
*   **APIs:** Google Maps/Places API (Cafe data, directions, busyness).

## Data Flow (Mermaid Diagram)
*(Paste this into the file, GitHub will render it as a diagram)*

```mermaid
graph TD
    A[User Mobile/Web] -->|Next.js UI| B(Firebase Auth)
    B --> C{Firestore DB}
    C -->|Real-time updates| A
    C -->|Fetch Cafe Data| D[Google Places API]
    A -->|User Prompt| E[AI Cat Chatbot]
    E -->|Grok/OpenAI API| F[Recommender Logic]
    F -->|Returns Spot| A