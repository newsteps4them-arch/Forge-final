<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Forge OS: Multidisciplinary Engineering Suite

Forge OS is a professional-grade workshop management and hardware diagnostic platform. It combines multimodal AI assistance with low-level hardware communication to create a unified hub for engineers, mechanics, and developers.

## 🌟 Key Features

-   **Multimodal AI Integration**: Real-time assistance via Google Gemini for diagnostics, coding, and visual inspection.
-   **OBD-II Hardware Diagnostics**: Native support for ELM327 interfaces using Web Bluetooth and Web Serial APIs.
-   **Real-time Persistence**: Full synchronization of projects, tasks, and inventory with Firebase Firestore.
-   **Rugged UI/UX**: High-performance, technical dashboard designed for workshop environments.
-   **Automated Auto-Healing**: Autonomous project maintenance via the `forge_brain_v2.py` guardian.

## 🛠 Tech Stack

-   **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons.
-   **Backend**: Express.js (Proxy & Workspace Gateway).
-   **Mobile/Native**: CapacitorJS (Android Support).
-   **Cloud**: Firebase (Auth & NoSQL Database), Google Gemini AI.
-   **Guardian**: Python 3.10 with Gemini auto-healing logic.

---

## 🚀 Getting Started

### Prerequisites

-   **Node.js**: v18+ (v20+ recommended)
-   **Python**: v3.10+ (for Auto-Healing Guardian)
-   **Hardware**: BLE or USB OBD-II adapter (optional for simulated mode)

### Local Development

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/newsteps4them-arch/team.forge.git
    cd team.forge
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory and add your keys:
    ```env
    GEMINI_API_KEY="your_api_key_here"
    ```

4.  **Run the App**:
    ```bash
    npm run dev
    ```
    Access the app at `http://localhost:3000`.

---

## 🔒 Security & Privacy

Forge OS uses a backend proxy to handle all Gemini AI interactions, ensuring that API keys are never exposed to the client-side browser memory. All user data is secured via Firebase Authentication rules.

## 📱 Native Deployment (Android)

Team Forge is pre-configured for Capacitor. To run on Android:

1.  **Build Web Assets**: `npm run build`
2.  **Sync with Android**: `npx cap sync android`
3.  **Open in Android Studio**: `npx cap open android`

---

## 🧠 Forge Guardian (Auto-Healing)

The project includes an autonomous "Guardian" (`forge_brain_v2.py`) that can identify and fix compilation errors or deprecations automatically using Gemini.

Run the guardian locally:
```bash
python forge_brain_v2.py
```
*Note: Requires `GEMINI_API_KEY` set in environment or `.env`.*

---

## 💼 Commercial Blueprint

Forge OS includes built-in hooks for SaaS commercialization:
- **White-Labeling**: Centralized branding configurations in the Management tab.
- **Lead Generation**: Native Firestore-synced pipeline for beta testers and inquiries.
- **Automated CI/CD**: Full GitHub Actions pipeline for generating signed APKs.

---
<div align="center">
  <i>"Forge the future of hardware-software integration."</i>
</div>
