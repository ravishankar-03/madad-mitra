<!-- <div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/84fcc6fe-132c-44da-86b4-7c7fdd52a745

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev` -->
   
# Madad Mitra (Assistance Friend)

Madad Mitra is an AI-driven crisis response and resource management platform designed for real-time field intelligence. It leverages advanced AI models to process surveys, field reports, and images to identify and prioritize community needs during crises.

## 🚀 Features

- **AI-Powered Survey Processing (OCR)**: Automatically extract structured needs from handwritten or printed survey images using Google Gemini API.
- **Urgent Needs Identification**: Intelligent analysis of field reports to provide confidence scores and urgency levels for discovered needs.
- **Geospatial Intelligence**: Visualizes community needs and resource locations on an interactive map with heatmap and cluster support.
- **Needs Analysis Dashboard**: Real-time visualization of field data using advanced charts to help decision-makers allocate resources effectively.
- **Resource Database Management**: Centralized repository for tracking available resources, personnel, and infrastructure status.
- **Real-time Collaboration**: Built on Firebase for instant data synchronization across field workers and command centers.

## 🛠️ Tech Stack

- **Frontend**: React (Vite), Tailwind CSS, Framer Motion
- **AI/ML**: Google Gemini API (`@google/genai`)
- **Database & Auth**: Firebase (Firestore, Authentication)
- **Data Visualization**: Recharts, Leaflet (Geospatial Mapping)
- **Icons**: Lucide React

## 📦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- A Firebase project
- A Google AI Studio API Key for Gemini

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/madad-mitra.git
   cd madad-mitra
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_FIRESTORE_DATABASE_ID=(default)

   # Gemini API Configuration
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/components`: Reusable UI components.
- `src/lib`: Services and utilities (Firebase, Gemini API).
- `src/pages`: Application views (Dashboard, Map, Upload, etc.).
- `src/types.ts`: TypeScript definitions.
- `firestore.rules`: Security rules for the Firestore database.

## 🔒 Security

Madad Mitra uses strictly defined Firestore security rules to ensure that field data is protected and only accessible by authorized personnel.

## 📄 License

This project is licensed under the MIT License.
