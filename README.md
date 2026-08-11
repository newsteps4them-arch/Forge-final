<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d176f2ad-cc8f-47d3-8f8a-bc017f7ae1f9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

---

# 🚀 Forge.OS: Go-To-Market & Commercial Launch Blueprint

Team Forge has been pre-configured with a dedicated **Launch Console** under the **Management** sidebar group to streamline your transition from development to a commercialised SaaS product.

## 💼 Core Marketing Hooks & Growth Loops Built-In

1. **Lead Generation Sandbox Flow**:
   - The application has a live **Leads Pipeline** that syncs with your Firebase Firestore. Prospects can submit feedback, join waitlists, or request custom integrations, registering immediately.
   - Use this shared preview URL as your landing page or pitching link to local workshop owners to gather interest and capture beta keys directly.

2. **Enterprise White-Label Customization**:
   - Tweak the active Brand Hex colors, local tax coefficients, invoice titles, and currencies in the **White Label** tab. This allows you to instantly demonstrate customized franchise-branded views of Digital Vehicle Inspections (DVI) and Estimators to pitch premium retainers ($199–$799/mo).

3. **"Diagnostic Shared Report" Organic Loop**:
   - Our Digital Vehicle Inspection and estimate reports can be easily formatted with a branding footnote (*"Inspection secured using Forge.OS — Inspect Your Own"*) linked with a download or inquiry QR code to drive organic mechanic-to-car-owner viral loops.

---

## 📱 Packaging For Google Play & App Store Release

Team Forge is integrated with **CapacitorJS** for smooth, low-overhead native wrappers.

### Automated CI/CD
A fully functional GitHub Actions pipeline is declared in `.github/workflows/build-and-release-apk.yml`. To auto-release signed APK files:
1. Push your repository upstream to your commercial GitHub organization.
2. The GitHub runner automatically triggers a native Gradle packaging sequence, compiling, signing, and attaching a production-ready APK release package to your Releases tab.

### Local Native Wrap (Android / iOS)
1. **Sync Assets**: `npm run build && npx cap sync android`
2. **Open Native UI**: `npx cap open android`
3. **Release Build**: Inside Android Studio, use **Build > Generate Signed Bundle / APK** to get your Google Play distribution key.

