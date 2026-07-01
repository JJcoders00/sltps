# School Messaging Portal

A standalone, commercial-grade web application for school staff to quickly access, copy, and send communication templates to parents.

## Features
- **Zero Dependencies**: Pure HTML, CSS, and Vanilla JavaScript. Just open `index.html` in any modern browser.
- **Premium UI/UX**: Designed with a modern SaaS aesthetic (inspired by Notion/Linear). Features glassmorphism, responsive grids, and subtle animations.
- **Instant Search**: Live search across template titles, categories, and message bodies.
- **Dynamic Categories**: Sidebar automatically populates based on the data source.
- **One-Click Copy**: Copies exactly the message text (keeping placeholders intact). Includes animated toast feedback.
- **Dark Mode**: Fully supports system-level dark mode and manual toggling.
- **Responsive**: Perfectly optimized for desktop, tablet, and mobile viewing.

## Usage
1. Double click `index.html` to open the application.
2. Select a category from the sidebar or use the search bar.
3. Click "Copy Message" on any template.
4. Paste the message into your SMS or WhatsApp application.
5. Replace the `{Placeholders}` with actual student information before sending.

## Project Structure
- `index.html`: Main application markup.
- `style.css`: All styling, using CSS variables for theme support.
- `script.js`: Core logic for rendering, filtering, searching, and copying.
- `messages.js`: The central data source containing all message templates.
- `assets/`: Reserved for future icons and images (currently using lightweight inline SVGs).

## Future Expansion
This architecture is modular and future-ready. Features that can be added:
- Admin Panel / Login
- Multiple Schools & Branding
- Direct SMS/WhatsApp Gateway Integration
- Favorites / Recently Copied
- PWA (Progressive Web App) Offline Support
