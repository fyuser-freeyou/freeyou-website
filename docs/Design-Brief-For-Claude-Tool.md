# FreeYou — Design Brief
### For use with Claude's design tool / AI design artifacts / Human designer

> **How to use this brief with Claude's design tool:**
> Copy the section titled "PROMPT FOR CLAUDE DESIGN TOOL" and paste it as your message into Claude's artifact/canvas. For specific asset requests (logo, social post, banner), append what you need at the end of the prompt.

---

## PROMPT FOR CLAUDE DESIGN TOOL

```
I need you to design assets for FreeYou — India's freelancer companion platform.

BRAND OVERVIEW:
FreeYou is a monthly subscription platform (₹1,499/month) for skilled Indian freelancers. 
It is NOT a marketplace. It's a companion — legal protection, financial tools, community, 
and real client work. Target user: Indian professionals earning ₹50k–₹3L/month from freelancing.

BRAND PERSONALITY:
- Bold and empowering (not timid, not corporate)
- Indian-first (celebrate Indian context, don't copy Silicon Valley aesthetic)
- Professional but human (not cold, not startup-bro)
- Direct and confident ("We're on your side. Full stop.")
- Ambitious but grounded

THE CORE POSITIONING LINE: "Not a marketplace. Your companion."

COLOR PALETTE (exact hex — must be used precisely):
- Navy #0D1B4B — primary brand color, trust, depth, authority
- Deep Navy #0A1628 — darker variant for backgrounds
- Saffron #F5A623 — energy, warmth, Indian identity, primary accent
- Saffron Dark #FF8C00 — gradient end, CTAs
- Teal #00C9A7 — growth, financial tools, success states
- Teal Dark #00897B — secondary teal
- Pure White #FFFFFF — text on dark
- Off-White #F0F4FF — light backgrounds

GRADIENT USAGE:
- Hero/CTA gradient: linear-gradient(135deg, #F5A623 0%, #FF8C00 100%) — saffron fire
- Text gradient: same saffron gradient used on headline text
- Background gradient: linear-gradient(135deg, #0A1628 0%, #1a1560 50%, #0A1628 100%) — dark cosmic
- Accent gradient: linear-gradient(135deg, #00C9A7 0%, #00F5D4 100%) — teal glow

TYPOGRAPHY:
- Display/Headlines: Sora (Google Fonts) — weight 700-800, letter-spacing -0.5px to -1px
- Body/UI: Inter (Google Fonts) — weight 400-600
- Scale: Display 56-72px / H1 40-56px / H2 32-48px / H3 24-28px / Body 15-17px / Small 12-13px
- Rule: Never use a font that isn't Sora or Inter

LOGO DIRECTION:
The logo is "FreeYou" wordmark + a square icon mark.
- Icon mark: Square with rounded corners (8-10px radius), filled with saffron gradient
  Contains the letter "F" in bold Sora 800 weight, navy colored
- Wordmark: "Free" in white/navy, "You" in saffron — both in Sora 700
- Alternatively: "FreeYou" all in one color with the icon mark beside it
- Must work on: dark navy background, white background, saffron background
- Forbidden: drop shadows on logo, gradients on the wordmark letters, serif fonts

VISUAL LANGUAGE:
- Glassmorphism cards: background rgba(255,255,255,0.05-0.08), backdrop-filter blur(20-30px), 
  border 1px rgba(255,255,255,0.10-0.15), border-radius 16-24px
- Animated orbs: large blurred radial gradient circles in saffron/teal/purple, 
  positioned behind content, opacity 0.2-0.4 — creates depth without noise
- Grid overlay: subtle 60px grid in rgba(255,255,255,0.03) on dark backgrounds
- Gradient text: key headline words use the saffron gradient as text-fill
- Border radius: consistent — buttons 8-12px, cards 16-24px, pills 999px
- Spacing: generous — lots of breathing room, never crowded
- Icons: outline style (not filled), 24px base size, stroke-width 1.5-2px

PHOTOGRAPHY / ILLUSTRATION DIRECTION:
- Real Indian freelancers (diverse: South Indian, North Indian, different skin tones)
- Environments: home offices, cafes (Third Wave/Blue Tokai vibes), coworking spaces (WeWork, 91springboard)
- Avoid: white people, fake smiles, stock photo poses, US/European contexts, suits
- Mood: focused, capable, slightly warm ambient lighting
- If using illustration: flat/geometric, not 3D, characters with Indian features
- Dark overlay on photos (navy 40-60% opacity) to maintain brand consistency

TONE OF VOICE IN COPY:
- Headlines: Short, punchy, confident. Max 8 words. No exclamation marks.
- Body: Direct, no jargon, no corporate fluff. Write like a smart friend.
- CTA text: Action-first ("Apply now" not "Click here to apply")
- Avoid words: "leverage", "synergy", "empower" (overused), "simple" (show it instead)
- Indian context: Use ₹ symbol, reference Indian cities, UPI, WhatsApp naturally
- Forbidden phrases: "game-changer", "disrupting", "world-class"

COMPONENT LIBRARY:
Primary Button: background linear-gradient(135deg,#F5A623,#FF8C00), color #0D1B4B, 
  Sora 700, 14-16px, padding 12-16px 24-32px, radius 8-10px, 
  hover: translateY(-2px) + box-shadow 0 8px 32px rgba(245,166,35,0.45)

Secondary Button: background transparent, border 1.5px solid rgba(255,255,255,0.2), 
  color white, same font, hover: border-color rgba(245,166,35,0.4) + 
  background rgba(245,166,35,0.06)

Ghost/Text Button: no border, color #F5A623, underline on hover

Input Fields: background rgba(255,255,255,0.07), border 1px rgba(255,255,255,0.12),
  radius 10px, color white, placeholder rgba(255,255,255,0.3),
  focus: border rgba(245,166,35,0.6) + background rgba(255,255,255,0.10)

Badge/Pill: background rgba(0,201,167,0.15), border 1px rgba(0,201,167,0.3),
  color #00C9A7, radius 20px, font-size 11-12px, weight 600, uppercase, letter-spacing 0.5px

Section Label: small uppercase tag above h2, saffron color, with a 20px line before it

WHAT TO AVOID:
- White/light backgrounds for hero sections (FreeYou is a dark-first brand)
- Bright red for any element (conflicts with saffron)
- Comic Sans, Helvetica, Arial (use Inter)
- Flat design with zero depth (we use glassmorphism and gradients)
- Cluttered layouts (choose max 3 elements per visual zone)
- Blue that isn't in our palette (#0D1B4B navy only)
- Generic tech startup look (abstract network graphics, floating code, etc.)

ASSET SIZES REFERENCE:
- Landing page hero: 1440px wide desktop, 390px mobile
- Social — Instagram post: 1080×1080px
- Social — Instagram Story/Reel cover: 1080×1920px
- Social — LinkedIn banner: 1584×396px
- Social — LinkedIn post: 1200×627px
- Twitter/X header: 1500×500px
- Twitter/X post: 1600×900px
- WhatsApp broadcast image: 1080×1080px or 1080×566px (landscape)
- OG image (web preview): 1200×630px
- Favicon: 32×32px and 180×180px (Apple touch)
```

---

## Extended Brand Notes (for human designers)

### Brand Story in One Paragraph
FreeYou was built because India's 15 million skilled freelancers are invisible to the systems designed for employees. They earn well, they're talented, but they have no contracts, no protection, no financial access, and no community. FreeYou gives them what a good employer gives its best people — without the office politics or the loss of freedom. The brand should feel like that: on your side, confident, a little bit defiant. Not asking for permission. Not apologizing for ambition.

### What FreeYou Looks Like in the Real World
Think of the brand living in these spaces: the WhatsApp notification a member gets when their contract is signed. The Discord channel where three Bangalore developers build a product together at 11pm. The Cloudflare-hosted landing page that loads in 800ms on a Jio connection. The digital badge on a LinkedIn profile that says "FreeYou Verified." Every touchpoint should feel premium, real, and unmistakably Indian — but not in a kitschy way. In the way Zerodha feels Indian: quietly confident, no flash, very capable.

### Logo Variants Needed
1. **Primary** — Icon mark + wordmark, horizontal, on dark background
2. **Reversed** — Icon mark + wordmark, horizontal, on white/light background
3. **Icon only** — Square icon mark, for favicons, app icons, Discord server icon
4. **Wordmark only** — "FreeYou" text only, no icon, for co-branding contexts
5. **Monochrome** — Single white or single navy version for when color isn't available

### Color Psychology (for designer reference)
- **Navy** signals trust and stability — the same reason Indian banks use dark blues. Freelancers need to trust the platform with their professional identity.
- **Saffron** is immediately Indian, energetic, and warm. It says ambition without aggression. It's the call-to-action color and the primary accent.
- **Teal** signals financial growth and technology. It's used for success states, financial features, and secondary CTAs.
- Together: the palette reads as "serious about your career" without being "another boring SaaS tool."

### Typography Rules
- Sora for everything the user reads first (headlines, hero text, card titles, button labels)
- Inter for everything the user reads second (body copy, labels, metadata, helper text)
- Never mix a third font family
- Headlines: weight 800, negative letter-spacing (-0.5px to -1px)
- Subheadings: weight 700
- Body: weight 400, line-height 1.65-1.75
- Small/meta text: weight 500-600 (heavier than you'd expect — reads better on dark backgrounds)

### Campaign Visual Themes

**Campaign 1 — "Not a marketplace"**
Visual: Split-screen. Left side: the exhausting, transactional, bidding-war reality of Upwork/Fiverr (muted, desaturated, crowded). Right side: the FreeYou experience (warm, focused, protected). Line: "They bid for work. You do work."

**Campaign 2 — "The fear is gone"**
Visual: A freelancer at their desk, late at night, phone showing "Invoice paid in full ✓" (WhatsApp notification UI). Warm light. Relaxed expression. Line: "You used to worry about getting paid. Not anymore."

**Campaign 3 — "Verified"**
Visual: A FreeYou profile badge glowing on a LinkedIn profile. Clean, minimal, aspirational. Line: "India's most trusted freelancer identity."

**Campaign 4 — "The companion"**
Visual: Series of micro-moments — contract being signed digitally, Discord channel buzzing with team building, invoice sent and paid, KYC badge appearing on profile. Line: "Every stage of your career. We're there."

---

## Asset Request Templates

Use these exact phrases when asking Claude's design tool to generate specific assets:

**Logo:**
> "Using the FreeYou brand brief above, design the primary logo: a square icon mark with rounded corners, saffron gradient background (#F5A623 to #FF8C00), letter F in Sora 800 weight in navy (#0D1B4B), paired with the wordmark 'FreeYou' in Sora 700 where 'Free' is white and 'You' is saffron. Show it on a dark navy background. Also show a reversed version on white."

**Instagram Post:**
> "Using the FreeYou brand brief, design a 1080×1080px Instagram post for the theme: [THEME]. Dark navy background with saffron gradient accents and glassmorphism card. Include the FreeYou logo bottom-right. Bold Sora headline, Inter body copy."

**LinkedIn Banner:**
> "Using the FreeYou brand brief, design a 1584×396px LinkedIn banner. Dark navy background, animated orb suggestion (blurred saffron circle top-right). Headline: 'India's Freelancer Companion.' Subtext: 'Legal protection · Financial tools · Community · Studio'. FreeYou logo left-aligned."

**OG Image:**
> "Using the FreeYou brand brief, design a 1200×630px Open Graph image for the FreeYou landing page. Dark navy gradient background with teal and saffron orbs. Large bold headline: 'Freelance in India Without the Fear.' FreeYou logo top-left. URL 'freeyou.co.in' bottom-right in small Inter."

---

*Brief version: 1.0 | June 2026 | FY Freelancing Solutions (OPC) Pvt. Ltd.*
