# Building QEngine Mobile

One codebase — Android, iOS, and Web — powered by Expo / React Native.

## Prerequisites

```bash
npm install -g eas-cli
eas login          # sign in to your Expo account
```

## Local Development

```bash
npx expo start              # interactive launcher (choose platform)
npx expo start --android    # run on Android emulator / device
npx expo start --ios        # run on iOS simulator (macOS only)
npx expo start --web        # run in browser
```

---

## Android Builds via EAS

No Mac required. Expo builds on its cloud servers and gives you a download link.

| Profile | Output | Use case |
|---------|--------|----------|
| `development` | `.apk` (debug) | Dev client for local testing |
| `preview` | `.apk` (release) | QA / team testing — shareable link |
| `production` | `.aab` | Google Play Store submission |

```bash
# Build a shareable APK (installable on any Android device)
eas build --platform android --profile preview

# Build a Play Store bundle
eas build --platform android --profile production

# Submit to Play Store internal track (after a production build)
eas submit --platform android
```

**Requirements:** Google Play Developer account ($25 one-time) for store distribution. APKs can be shared directly without any store account.

---

## iOS Builds via EAS

| Profile | Output | Use case |
|---------|--------|----------|
| `development` | `.ipa` (debug) | Dev client via TestFlight / direct install |
| `preview` | `.ipa` (release) | Internal testing via TestFlight |
| `production` | `.ipa` | App Store submission |

```bash
# Build an iOS IPA (TestFlight or direct install)
eas build --platform ios --profile preview

# Build for App Store submission
eas build --platform ios --profile production

# Submit to App Store / TestFlight (after a production build)
eas submit --platform ios
```

**Requirements:** Apple Developer account ($99/year) for signing and distribution. EAS handles provisioning profiles and certificates automatically.

---

## Build Both Platforms at Once

```bash
# Build Android + iOS simultaneously
eas build --platform all --profile preview

# Build for both stores
eas build --platform all --profile production
```

---

## GitHub Actions — auto-build on push

To enable automatic builds for both platforms on every push to `master`:

**Step 1** — Create `.github/workflows/build.yml` in your repo with the content below.

**Step 2** — Add `EXPO_TOKEN` to your repository secrets:
1. Run `eas token:create` to get a token
2. Go to `Settings → Secrets and variables → Actions → New repository secret`
3. Name: `EXPO_TOKEN`, Value: the token from step 1

**Workflow file contents:**

```yaml
name: EAS Build (Android + iOS)

on:
  push:
    branches: [master, main]
  workflow_dispatch:
    inputs:
      platform:
        description: "Target platform"
        required: true
        default: "all"
        type: choice
        options:
          - all
          - android
          - ios
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
  build:
    name: EAS Build
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

      - name: Submit EAS build
        run: |
          eas build \
            --platform ${{ github.event.inputs.platform || 'all' }} \
            --profile ${{ github.event.inputs.profile || 'preview' }} \
            --non-interactive \
            --no-wait
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Build summary
        run: |
          echo "## Build Submitted" >> $GITHUB_STEP_SUMMARY
          echo "Platform: \`${{ github.event.inputs.platform || 'all' }}\`" >> $GITHUB_STEP_SUMMARY
          echo "Profile: \`${{ github.event.inputs.profile || 'preview' }}\`" >> $GITHUB_STEP_SUMMARY
          echo "Track build progress at [expo.dev](https://expo.dev)" >> $GITHUB_STEP_SUMMARY
```

---

## App details

| Field | Value |
|-------|-------|
| Android package | `ai.qengine.mobile` |
| iOS bundle ID | `ai.qengine.mobile` |
| Version | `2.1.0` |
| Android versionCode | `1` |
| Android min SDK | 24 (Android 7.0+) |
| Android target SDK | 35 (Android 15) |
| Architecture | Expo New Architecture (Fabric + JSI) |

## Platform comparison

| | Android | iOS | Web |
|--|---------|-----|-----|
| Dev account cost | $25 one-time | $99/year | Free |
| Mac required to build | No | No (via EAS cloud) | No |
| Store | Google Play | App Store | N/A |
| Direct APK/IPA install | Yes | Yes (via TestFlight) | N/A |
