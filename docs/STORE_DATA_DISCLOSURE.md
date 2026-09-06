# Store Data Disclosure Checklist

Use this as a factual implementation checklist, not as legal advice. Re-check it whenever providers or features change.

## Data currently linked to an account

- Name/display name and username
- Email address and phone number
- Age, gender, biography, and interests
- Precise location selected for home/event coordinates
- User content in event titles and descriptions
- Event participation and ratings
- Premium trial state

## Purposes

- App functionality and account authentication
- Safety, abuse prevention, and service diagnostics
- Aggregate product analytics generated from first-party database queries

## Third parties planned for production

- API/database hosting provider: [NAME]
- Resend: email OTP delivery
- Twilio: SMS OTP delivery
- Apple/Google: app distribution and their platform diagnostics

No advertising SDK, cross-app tracking SDK, payment SDK, contact access, camera, microphone, or background location collection is currently implemented.

## Store actions before submission

- Publish final privacy policy and external account-deletion page over HTTPS.
- Complete App Store Connect App Privacy answers for the app and enabled third-party providers.
- Complete Google Play Data safety and account-deletion URL fields before moving beyond an exempt internal-only track.
- Verify the in-app **Hesabı Sil** flow against the production API.
- Replace every bracketed placeholder in the legal drafts.
