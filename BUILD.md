# Building the CashBook mobile app (APK & IPA)

This is a **managed Expo** app (no committed `android/`/`ios/` folders), so the standard
way to produce installable binaries is **EAS Build** (Expo's cloud build service). It is
the only way to produce an **IPA on Windows**, because Apple requires macOS + Xcode to
compile and sign iOS apps.

## Prerequisites (one-time)

1. A free Expo account → https://expo.dev/signup
2. Log in from this folder:
   ```bash
   cd cashbook-app
   npx --yes eas-cli login
   ```
3. Link the project (creates the EAS project id):
   ```bash
   npx --yes eas-cli init
   ```

## Build an Android APK  ✅ (works from Windows)

```bash
npm run build:apk
```
- Uses the `preview` profile in `eas.json` (`android.buildType: "apk"`, `distribution: internal`).
- When it finishes, EAS prints a download URL and can also download the file locally.
- Rename the result to **`CashBook.apk`** and copy it to:
  `../cashbook/public/downloads/CashBook.apk`
  → the **Android (APK)** button on the web Profile page will then serve it.

## Build an iOS IPA  ⚠️ (requires an Apple Developer account — $99/yr)

```bash
npm run build:ipa
```
- A distributable/installable IPA **must be code-signed by Apple**. EAS will prompt for
  Apple credentials and register test-device UDIDs (for `distribution: internal` / ad-hoc)
  or an App Store build.
- **Without a paid Apple Developer account there is no way to produce an installable IPA**
  — this is an Apple platform restriction, not a limitation of this project.
- Rename the result to **`CashBook.ipa`** and copy it to:
  `../cashbook/public/downloads/CashBook.ipa`

> iOS apps also cannot be installed by simply downloading an `.ipa` from a website the way
> an Android `.apk` can. Real-world iOS distribution uses **TestFlight** (recommended) or an
> ad-hoc/enterprise MDM flow. The web button is wired for completeness, but TestFlight is the
> practical path for iOS testers.

## Build both at once

```bash
npm run build:all
```

## Local Android build alternative (no cloud)

If you prefer building the APK on this machine instead of EAS, you must first install the
**Android SDK** (Android Studio) and set `ANDROID_HOME`, then:
```bash
npx expo prebuild --platform android
cd android
./gradlew assembleRelease      # → android/app/build/outputs/apk/release/app-release.apk
```
(There is no local equivalent for iOS on Windows.)

## Identifiers used

- Android package:   `com.anonymous.cashbookapp`
- iOS bundle id:     `com.anonymous.cashbookapp`
- version:           `1.0.0` (from `app.json`)

Change these in `app.json` before shipping to a real store (Google/Apple reject
`com.anonymous.*`).
