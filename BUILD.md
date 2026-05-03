# Building QEngine Mobile for Android

## Prerequisites

```bash
npm install -g eas-cli
eas login          # sign in to your Expo account
```

## Local Development

```bash
npx expo start --android   # run on Android emulator / device
npx expo start --ios       # run on iOS simulator
npx expo start             # run in browser (web preview)
```

## Android Builds via EAS

| Profile | Output | Use case |
|---------|--------|----------|
| `development` | `.apk` (debug) | Dev client for local testing |
| `preview` | `.apk` (release) | QA / team testing — shareable link |
| `production` | `.aab` | Google Play Store submission |

```bash
# Build a shareable APK (install directly on any Android device)
eas build --platform android --profile preview

# Build a Play Store bundle
eas build --platform android --profile production

# Submit to Play Store internal track (after production build)
eas submit --platform android
```

## GitHub Actions

The workflow at `.github/workflows/android-build.yml` automatically submits an EAS build on every push to `master`.

**Required secret:** Add `EXPO_TOKEN` to your repository secrets.
1. Get your token: `eas token:create`
2. Add it at `Settings → Secrets → Actions → New repository secret`

## Package details

| Field | Value |
|-------|-------|
| Android package | `ai.qengine.mobile` |
| Version | `2.1.0` (versionCode `1`) |
| Min SDK | 24 (Android 7.0+) |
| Target SDK | 35 (Android 15) |
| Architecture | Expo New Architecture (Fabric + JSI) |
