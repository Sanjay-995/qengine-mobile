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

## GitHub Actions — auto-build on push

To enable automatic Android builds on every push to `master`:

**Step 1** — Create `.github/workflows/android-build.yml` in your repo with the content below.

**Step 2** — Add `EXPO_TOKEN` to your repository secrets:
1. Run `eas token:create` to get a token
2. Go to `Settings → Secrets and variables → Actions → New repository secret`
3. Name: `EXPO_TOKEN`, Value: the token from step 1

**Workflow file contents:**

```yaml
name: Android APK (Preview)

on:
  push:
    branches: [master, main]
  workflow_dispatch:
    inputs:
      profile:
        description: "EAS build profile"
        required: true
        default: "preview"
        type: choice
        options:
          - development
          - preview
          - production

jobs:
  build-android:
    name: Build Android APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm install

      - name: Setup EAS
        uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}

      - name: Build Android APK (preview)
        run: |
          eas build \
            --platform android \
            --profile ${{ github.event.inputs.profile || 'preview' }} \
            --non-interactive \
            --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Build summary
        run: |
          echo "## Android Build Submitted" >> $GITHUB_STEP_SUMMARY
          echo "Profile: \`${{ github.event.inputs.profile || 'preview' }}\`" >> $GITHUB_STEP_SUMMARY
          echo "Track build progress at [expo.dev](https://expo.dev)" >> $GITHUB_STEP_SUMMARY
```

## Package details

| Field | Value |
|-------|-------|
| Android package | `ai.qengine.mobile` |
| iOS bundle ID | `ai.qengine.mobile` |
| Version | `2.1.0` (versionCode `1`) |
| Min SDK | 24 (Android 7.0+) |
| Target SDK | 35 (Android 15) |
| Architecture | Expo New Architecture (Fabric + JSI) |
