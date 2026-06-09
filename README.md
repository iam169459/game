# Devices Tycoon

A feature-rich business simulator and hardware device builder game built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Zustand**. Designed with a premium, glassmorphic dark-mode tech aesthetic (inspired by Apple & Samsung).

---

## 🌟 Key Features

### 🎨 Advanced Visual Device Designer
Design smartphones, tablets, smartwatches, and laptops with high-fidelity visual preview options:
*   **Chassis & Finish**: Toggle frame styles (e.g., *Matte Glass*, *Brushed Titanium*, *Glossy Ceramic*, *Eco-Leather*, *Carbon Fiber*, *Stellar Glitter*, *Matte Plastic*) and apply custom hex colors.
*   **Display & Hardware**: 
    *   Customize screen bezel thickness (*Bezel-less*, *Thin*, *Standard*, *Thick*) and edge glass curvature (*Flat*, *Curved*).
    *   Set notch designs (*Punch Hole*, *Waterdrop*, *Dynamic Island*, or *Bezel-less*).
    *   Set smartwatch frame geometry to **Square** or **Round** (adjusting both frame boundaries and screen layout elements).
    *   Configure side buttons placement (**Left Side**, **Right Side**, **Both Sides**, or **Top Edge**) and customize button colors.
*   **Camera & Logo**:
    *   Select camera modules (*Single Lens*, *Vertical Dual*, *Square Triple*, *Ring Array*, *Circular*).
    *   Select camera bump shape (*Circular*, *Square*, *Pill*, *Integrated* flush lens style).
    *   Apply custom Brand Logos with backlight glow effects (*White*, *Accent*, or *Rainbow* pulsing).
*   **Retail Box**: Style your product packaging with customizable themes (*Minimalist*, *Premium*, *Bold*), base box colors, and gold-foil overlay fonts.

### 💾 Cloud Save & Multiplayer Social Economy
*   **Hybrid Save System**: Persists save profiles to **Google Cloud Firestore** when database environment credentials are provided; automatically falls back to secure local JSON storage files on disk otherwise.
*   **Auto-Sync**: Game state dynamically pushes updates to the cloud on monthly tick completions and key state modifications.
*   **Multiplayer Economics**: Centralized server architecture enables real-time Global Leaderboards, Friends lists, profile search, and peer-to-peer cash transfers.

---

## 🛠️ Technology Stack

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Zustand 5 (for global client-side state)
*   **Backend**: Node.js, Express, TypeScript, Google Cloud Firestore SDK
*   **Infrastructure**: Render.com Blueprints (`render.yaml`), unified single-service build pipeline

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   npm (v9+)

### Local Development

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the client & server in development mode**:
    ```bash
    npm run dev
    ```
    *   The frontend app will launch at `http://localhost:5173`.
    *   The backend server will run at `http://localhost:3001`.

### Build & Production Run

1.  **Build client and server bundles**:
    ```bash
    npm run build
    ```

2.  **Start production server**:
    ```bash
    npm start
    ```
    *   The server will serve static client assets on port `3001` or `process.env.PORT`.

---

## ☁️ Google Cloud Firestore Setup

To enable central database saves:
1. Obtain service account credentials from the Google Cloud / Firebase Console.
2. Define the following environment variables in your runtime environment (e.g. `.env` file or Render dashboard):
   * `FIREBASE_PROJECT_ID` - The project ID of your Firebase/Google Cloud project.
   * `FIREBASE_CLIENT_EMAIL` - Service account client email.
   * `FIREBASE_PRIVATE_KEY` - Service account private key (auto-handles `\n` characters).

If these variables are omitted, the game automatically falls back to writing profiles locally under `server/data/players.json`.
