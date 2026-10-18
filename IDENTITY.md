Aria uses Netlify Identity for external-provider sign-in through `@netlify/identity`.
Google uses Netlify's managed OAuth app; no custom Google client ID or secret is needed.

Enable it once at https://app.netlify.com/projects/ariaprode/identity:

1. Enable Identity.
2. Under Registration, choose Open if anyone should be able to register.
3. Under External providers, add Google using Netlify's default credentials.
4. Deploy this version and test sign-in on the Netlify URL.

The consent screen identifies the app as Netlify Identity. Providers are loaded
from the dashboard settings; this integration supports Google, GitHub, GitLab,
and Bitbucket. Email/password authentication is not exposed in Aria's login UI.

Use the Netlify-hosted application for account features. The SDK uses same-origin
Identity cookies, including for API calls. GitHub Pages and plain Vite remain
usable for local canvas editing, but cannot complete this sign-in flow. Test
OAuth on a deploy, not on the local Vite server.

The backend still needs DATABASE_URL. A verified Identity email links to the
existing Neon user row, preserving existing cloud-site ownership. Site APIs
derive ownership from the verified session rather than a submitted user ID.
The browser display profile is never an authorization source.

After migration, VITE_GOOGLE_CLIENT_ID and GOOGLE_CLIENT_ID are unused and can
be removed from deployment variables. Database credentials stay on the server.
