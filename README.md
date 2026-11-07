# EMI Calculator & Finance Planner

**Designed & Developed by DDWORLDS**

A comprehensive Indian Financial & EMI Planner supporting:
- **EMI Calculator** with Advanced Extra Repayments (Monthly, Quarterly, Half-Yearly, Annually, and Custom Recurring/One-time months)
- **Side-by-Side Loan Comparison**
- **SIP, FD, and RD Investment Calculators**
- **GST Calculator** (Inclusive & Exclusive with CGST/SGST split)
- **Professional PDF Amortization Schedule Export** with DDWORLDS branding
- **100% Offline-Ready Progressive Web App (PWA)**

---

## 📱 How to Download the Android `.APK` from GitHub

This repository is pre-configured with an automated **GitHub Actions Android APK Builder** (`.github/workflows/build-apk.yml`).

1. After pushing this repository to GitHub, click on the **Actions** tab at the top of your GitHub repository.
2. Click on the **Build Android APK** workflow on the left sidebar.
3. Click on the latest completed workflow run (or click **Run workflow** to trigger one manually).
4. Scroll down to the **Artifacts** section at the bottom of the summary page.
5. Click **`EMI-Planner-DDWORLDS-APK`** to download your compiled Android `.apk` package!

---

## 🌐 Live Public PWA (GitHub Pages)

The repository automatically builds and pushes the production web app to the `gh-pages` branch.

1. In your GitHub repository, go to **Settings → Pages**.
2. Under **Build and deployment → Branch**, choose `gh-pages` / `(root)`.
3. Your live app will be accessible at:
   `https://<your-github-username>.github.io/<repo-name>/`
4. You can also download the pre-compiled web app bundle directly from the **Actions → Deploy to GitHub Pages → Artifacts (`EMI-Planner-Web-Build`)**.

---

## 💻 Local Development

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
```
