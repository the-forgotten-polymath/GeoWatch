# 🌍 GeoWatch — Global Risk Monitor

**GeoWatch** is a next-generation geopolitical intelligence dashboard designed for real-time monitoring of global risks, conflicts, and diplomatic relations. It synthesizes data from the **GDELT Project**, major news outlets, and AI-driven analysis to provide an immersive tactical overview of the world's stability.

![GeoWatch Dashboard Mockup](https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop)

## 🚀 Key Features

*   **Interactive Global Map**: Visualizes real-time conflict and cooperation data points across the globe using MapLibre GL.
*   **Dual View Modes**:
    *   **Globe View**: A 3D perspective for geographic spatial awareness of current events.
    *   **Relations View**: An advanced topological map showing Bilateral Relations (Conflict, Tension, Alliance, Trade) linked by real-time news reporting.
*   **Live News Intelligence**: Integrated feeds from **The Guardian**, **CNN**, and **Google News**, cross-referenced to provide a multi-source "truth score".
*   **AI Geopolitical Assistant**: An "Ask the map" feature powered by **Google Gemini** (or local **Ollama**) that provides summaries and tactical insights on regional developments.
*   **Goldstein Scale Mapping**: Color-coded risk indicators ranging from deep conflict to cooperative stability based on objective geopolitical metrics.

## 🛠 Tech Stack

*   **Frontend**: React 18, Vite, TypeScript
*   **Styling**: Tailwind CSS, Shadcn/UI, Framer Motion
*   **Mapping**: MapLibre GL, GeoJSON, Lucide Icons
*   **State Management**: TanStack Query (React Query)
*   **Database/Auth**: Supabase
*   **AI**: Google Generative AI (Gemini Flash), Ollama (Local)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18.0.0 or higher)
*   [npm](https://www.npmjs.com/) or [Bun](https://bun.sh/)

## ⚙️ Installation & Setup

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd GeoWatch-v1.02-master
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory and add your keys:
    ```env
    # AI Integration
    VITE_GEMINI_API_KEY=your_gemini_api_key_here
    VITE_AI_PROVIDER=gemini # or 'ollama'

    # Supabase (Optional for Auth)
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key

    # News (Default uses 'test' key if empty)
    VITE_GUARDIAN_API_KEY=your_guardian_key
    ```

4.  **Launch Development Server**:
    ```bash
    npm run dev
    ```
    The app will be available at `http://localhost:8080`.

## 🧠 Using the AI Assistant

GeoWatch supports two AI backends for state-of-the-art geopolitical analysis:

1.  **Gemini (Cloud)**: Set `VITE_AI_PROVIDER=gemini` and provide a `VITE_GEMINI_API_KEY`. It uses `gemini-2.5-flash` for high-speed analysis.
2.  **Ollama (Local)**: Set `VITE_AI_PROVIDER=ollama`. Ensure Ollama is running on your machine (default `http://localhost:11434`) with the `phi3:mini` model (or similar) pulled.

## 📈 Data Sources

*   **GDELT GKG**: Used for real-time geographic event extraction and Goldstein Scale scoring.
*   **Guardian Content API**: Source for high-quality international reporting.
*   **RSS Aggregation**: CNN and Google News feeds for cross-source verification.

## 📄 License

Internal use only. Part of the **Investigation Camp** intelligence suite.

---
*Created with ❤️ by the GeoWatch Team.*
