# BruinGains Product Spec

Todo 
1. Make the onboarding image better with GPT images












## Product Summary

BruinGains is an Expo-first mobile app for UCLA students that combines three loops into one polished daily product:

- check dining menus and log meals fast
- check gym crowding before leaving
- log workouts with enough depth to feel serious, not toy-like

The app should feel more like a premium collegiate performance product than a generic calorie tracker. The design language is "Collegiate Elite": UCLA heritage, sports-editorial scale, clear hierarchy, tactile motion, and minimal visual noise.

## Product Goals

- Make meal logging faster than opening the UCLA dining website.
- Make gym decisions easier by showing current capacity in seconds.
- Make workout logging strong enough that lifters trust it for daily use.
- Turn raw logs into motivating summaries: weekly trends, PRs, streaks, goal progress.
- Feel polished enough that UCLA students want to open it multiple times per day.

## Non-Goals For Initial Build

- campus-wide social feed or friend system
- wearable integrations
- Apple Health / Google Fit sync
- barcode scanning
- AI coaching chat
- push notification systems that require a native-heavy setup before the core product works

## Repo Baseline

Current repo state:

- Expo Router starter scaffold
- `expo ~54.0.33`
- default tabs starter content still present

Technical constraint:

- We are building for Expo Go first.
- As of April 8, 2026, Expo SDK 55 is the latest SDK, but Expo's own docs still note an SDK 54 transition window for Expo Go on physical devices. The rule for this project should be: use the latest Expo SDK that is fully supported by the target Expo Go runtime, and upgrade immediately once physical-device Expo Go support catches up.

Practical implication:

- Do not design the architecture around custom native modules.
- Prefer libraries that work in Expo Go and degrade cleanly to web when possible.
- Keep the product shippable with JavaScript, Expo SDK modules, local device storage for personal data, and a lightweight Appwrite backend for public UCLA data.

## Experience Principles

### 1. Fast-glance utility

Every main surface should answer a question in under 3 seconds:

- Dining: "What can I eat right now and how does it affect my goals?"
- Gym: "Is it worth going now?"
- Workout: "Can I start logging immediately?"
- Profile: "Am I trending in the right direction?"

### 2. Delight through response, not decoration

Polish should come from:

- crisp press states
- springy card expansion
- ring and bar fill animations
- haptics on high-value moments
- smooth skeleton loading states
- stable number animations for timers and stats

Not from:

- noisy shadows
- excessive gradients
- decorative borders
- long onboarding before value is shown

### 3. Tonal depth over chrome

Honor the design system:

- no hard 1px card borders
- depth created through surface shifts and white-space
- shadows only for truly floating elements
- typography does the heavy lifting

### 4. One-hand use during motion

This matters most in the gym:

- 48x48dp minimum touch targets
- bottom-aligned primary actions
- high-contrast logging fields
- minimal cognitive branching mid-set

## Recommended Information Architecture

Top-level tabs for launch:

1. `Dining`
2. `Gym`
3. `Profile`

Reasoning:

- `Dining` can act as the default landing surface because it already contains the strongest daily home behavior: calorie ring, hall switching, meal logging, recommendations, and recent meals.
- `Gym` should contain both capacity and workout logging so students stay in one mental mode.
- `Profile` is where summaries, goals, PRs, templates, and preferences live.

Within `Gym`, active workout is a dedicated focus mode route, not a tab.

## Core User Flows

### Flow A: Dining-first user

1. Open app.
2. Land directly in `Dining`.
3. See calorie progress, macros, and current hall selector.
4. Swipe halls, view menu items with calories/macros.
5. Tap a meal item to log it.
6. See updated ring, macros, recommendations, and recent meals.

### Flow B: Lift-first user

1. Open `Gym`.
2. Check Wooden / BFit capacity.
3. Start workout from blank session or template.
4. Log sets with previous performance visible.
5. Finish workout.
6. See updated streak, volume, and PR if earned.

### Flow C: Returning user

1. Open `Profile`.
2. Review weekly summary.
3. Adjust calorie goal or dining preferences.
4. Edit workout templates or revisit onboarding-driven setup choices.

## Product Architecture

### Mobile App

- Expo Router app for navigation
- local-only storage for user data, goals, logs, templates, and preferences
- local-first interaction for workout logging and meal logging
- strong empty states so the app feels complete before all integrations land

### Data Ownership Split

- local device storage: meal logs, workout logs, templates, goals, PR history, and user preferences
- Appwrite: normalized UCLA dining menus, dining hall metadata, gym locations, and gym-capacity snapshots

### Backend / Data Layer

This app should not scrape UCLA pages directly from the phone.

Instead:

- scheduled server jobs fetch source data
- normalize menu and gym-capacity data into stable JSON records
- cache aggressively
- expose a clean API to the mobile app

Recommended backend shape:

- Appwrite TablesDB for normalized public UCLA dining and gym data
- Appwrite Functions for scraping, parsing, normalization, cache building, and read endpoints
- scheduled jobs / cron to refresh dining and capacity snapshots
- a compact authenticated public-data gateway consumed by the app
- anonymous auth for rate limiting without requiring visible sign-up in v1
- user-created data remains on device and is not synced to Appwrite in v1

Why this matters:

- client-side scraping will be brittle
- website markup changes should not require an app update
- server-side caching reduces load time and request volume
- normalized public data stays separate from private on-device user data
- Appwrite gives us an admin-friendly hosted backend without forcing visible user accounts on day one

## Primary Data Entities

Local-only entities:

- `local_profile`
- `goals`
- `meal_logs`
- `exercise_library`
- `workout_templates`
- `template_exercises`
- `workout_sessions`
- `workout_session_exercises`
- `workout_sets`
- `personal_records`
- `user_preferences`

Appwrite-backed public entities:

- `dining_halls`
- `menu_snapshots`
- `menu_items`
- `gym_locations`
- `gym_capacity_snapshots`

## Design System Translation

### Typography

- `Lexend` for display stats, section headlines, PR moments
- `Plus Jakarta Sans` for body, labels, inputs, and navigation

Use oversized stat moments:

- calorie ring number
- current lifted weight
- PR cards
- weekly totals

### Color Usage

- UCLA Blue as the primary structural brand color
- UCLA Gold as energy, achievement, and high-priority action color
- neutral surfaces should carry most of the layout
- gold should stay rare enough to feel earned

### Motion Rules

- press feedback: 90-140ms scale and tint response
- card enter transitions: 180-240ms
- progress rings / bars: eased but quick, never sluggish
- active workout interactions: near-instant feedback
- celebratory PR moments: stronger spring + haptic, but less than 600ms total

### Signature Moments

- calorie ring animates after meal log
- capacity bars animate on refresh
- set logging confirms with tactile snap and row lock-in
- PR card expands into view after finishing workout
- weekly streak fills with sequential micro-animation

## Incremental Module Plan

The work should be split into these modules so we can build in a stable order without redoing core decisions later.

### Module 1: Product Foundation And App Shell

Goal:

- Replace the starter scaffold with the real route map, shell, and navigation model.

Includes:

- route structure for `Dining`, `Gym`, `Profile`, and active-workout subroutes
- shared safe-area handling
- tab bar design
- theme bootstrapping
- empty states and placeholder loading shells

Done when:

- the starter app no longer looks like a template
- all core routes exist
- the app shell feels intentional even before live data is connected

### Module 2: Design Tokens, Components, And Motion System

Goal:

- Build the reusable visual language before feature screens multiply.

Includes:

- color tokens
- typography scale
- spacing and radius system
- button variants
- card system
- progress ring
- capacity bar
- stat rows
- sheet / modal patterns
- haptic interaction standards

Done when:

- feature teams can build screens from shared primitives instead of custom one-offs
- the design system rules from this brief are reflected in code-level components

### Module 3: Local Persistence, Appwrite Client, And App Data Layer

Goal:

- Stand up the local app data model, device storage, and Appwrite public-data client rules.

Includes:

- anonymous-auth architecture for v1
- local profile store
- goal storage
- local persistence for offline workout and meal logs
- local template storage
- Appwrite client setup for public data reads
- cache strategy for UCLA public data
- API client and query/cache strategy

Done when:

- a user can create and persist data across sessions
- the app can recover gracefully from offline or stale network states
- the app never requires sign-in to access its core features
- Appwrite-backed public data can be fetched and cached without mixing in user-private state

### Module 4: UCLA Dining Ingestion Pipeline

Goal:

- Create a stable source of dining menu data with calories and macros.

Includes:

- source audit for official UCLA dining menu pages / feeds
- Appwrite Function scraper or parser
- normalization rules for halls, meal periods, and item names
- calorie and macro extraction
- cache windows and refresh cadence
- failure monitoring and fallback behavior

Done when:

- the app receives predictable dining JSON even if UCLA page markup changes slightly
- menu refreshes happen without manual app intervention

### Module 5: Dining Experience And Meal Logging

Goal:

- Ship the first daily-use loop.

Includes:/

- calorie ring with macro breakdown
- horizontal dining hall selector
- menu list with calories inline
- tap-to-log meal flow
- logged meals list
- dining recommendations placeholder logic

Done when:

- a user can open the app, browse a hall, log food, and immediately see updated totals

### Module 6: Gym Capacity Ingestion And Gym Surface

Goal:

- Make gym availability glanceable and trustworthy.

Includes:

- identify official capacity source for Wooden and BFit
- Appwrite-backed ingestion for capacity snapshots
- normalize occupancy into a shared format
- freshness timestamps
- gym screen weekly strip
- capacity cards
- refresh behavior and stale-data fallback states

Done when:

- a user can tell in seconds whether Wooden or BFit is busy
- stale data is clearly communicated instead of silently misleading

### Module 7: Workout Logging Core

Goal:

- Build a Strong-style logging flow that is fast enough for real lifting sessions.

Includes:

- start blank workout
- add exercises manually
- set rows with weight / reps / completion state
- previous performance shown in muted text
- rest timer
- finish workout flow

Done when:

- a user can complete an entire workout session without friction or route confusion
- timing, data entry, and confirmation feedback feel production-ready

### Module 8: Templates And Exercise Library

Goal:

- Remove setup friction for repeat users.

Includes:

- create template
- edit template
- reorder exercises
- duplicate template
- launch workout from template
- base exercise library structure with room for future search and tags

Done when:

- a user can create routines like `Push Day` or `Leg Day` and reliably reuse them

### Module 9: Profile, Weekly Summary, Goals, And PR Engine

Goal:

- Turn raw logs into motivation and retention.

Includes:

- weekly summary cards
- average calories
- average protein
- workouts completed
- PR detection rules
- calorie goal editing
- streak and trend summaries

Done when:

- the profile page feels earned by real data, not like placeholder summary filler
- new PRs appear automatically from logged sessions

### Module 10: Recommendations And Preferences

Goal:

- Add personalization and close the rough edges.

Includes:

- preferred dining halls
- smarter meal recommendations
- smart empty states
- first-run defaults

Done when:

- the app feels tailored instead of generic
- preferences meaningfully shape the dining experience

### Module 11: Onboarding And Recovery Flows

Goal:

- Add lightweight setup without slowing down first use.

Includes:

- optional first-run onboarding
- calorie goal setup
- preferred dining hall setup
- workout template starter suggestions
- skipped-setup recovery prompts
- profile completion nudges

Done when:

- a new user can skip onboarding and still use the app immediately
- skipped setup no longer leaves users in a confusing state

### Module 12: QA, Analytics, And Release Hardening

Goal:

- Make the app reliable before broader campus usage.

Includes:

- event tracking plan
- ingestion monitoring
- performance budgets
- error states audit
- test plan across iOS, Android, and web
- accessibility audit
- launch checklist

Done when:

- the product is stable under normal campus usage patterns
- failures are observable
- high-value flows are tested end to end

## Suggested Build Order

### Milestone A: Make it feel real

Ship:

- Module 1
- Module 2
- the local parts of Module 3

Outcome:

- polished shell
- real navigation
- reusable system components

### Milestone B: Deliver the first useful loop

Ship:

- Module 4
- Module 5

Outcome:

- live dining menus
- meal logging
- visible calorie progress

### Milestone C: Deliver the second useful loop

Ship:

- Module 6
- Module 7
- Module 8

Outcome:

- gym capacity
- strong workout logging
- reusable templates

### Milestone D: Make the app sticky

Ship:

- Module 9
- Module 10
- Module 11

Outcome:

- weekly value
- PRs
- smarter recommendations
- cleaner onboarding recovery

### Milestone E: Harden for launch

Ship:

- Module 12

Outcome:

- confidence, monitoring, and release readiness

## Acceptance Criteria By Surface

### Dining

- serves as the default landing route for the app
- shows today's calorie progress immediately
- hall switching feels instant after initial data load
- meals can be logged in one tap plus optional quantity adjustment
- totals update immediately
- logged meal history is easy to scan

### Gym

- capacity data feels live and timestamped
- starting a workout is always a single primary action
- blank workflow and template workflow are equally supported

### Active Workout

- previous numbers are visible without overwhelming the row
- logging a set is faster than typing a note in Notes app
- rest timer is present but non-blocking

### Profile

- weekly summary is understandable at a glance
- PRs feel celebratory but still clean
- goals and preferences are editable without deep settings hunting

## Key Risks And Mitigations

### Risk: UCLA data sources are inconsistent or change often

Mitigation:

- keep scraping logic server-side
- store normalized snapshots
- monitor parse failures
- build fallback UI for unavailable halls or stale feeds

### Risk: Appwrite becomes a single dependency for campus data delivery

Mitigation:

- keep the Appwrite schema narrow and public-data-focused
- separate ingestion functions from mobile-facing read endpoints
- cache the latest successful payload on device so the app still works during temporary backend issues

### Risk: Expo Go limits native options

Mitigation:

- keep the first version inside Expo-compatible libraries
- avoid premature native dependencies
- only move to dev builds when the product truly needs it

### Risk: Workout logging becomes slow or fiddly

Mitigation:

- optimize the set-row interaction first
- keep editing inline
- minimize modals during active sessions

### Risk: The app feels fragmented between dining and lifting

Mitigation:

- unify everything around daily performance
- let dining and profile connect nutrition and training summaries

## Open Decisions To Revisit Later

- whether dining recommendations should be rule-based first or deferred
- whether `Dining` should remain the default landing route long-term or whether `Gym` deserves a personalized landing mode for frequent lifters
- whether to support weight in lbs only at launch or allow unit switching immediately

## Build Recommendation

If we want to move quickly without rework, start by making the shell and design system look unmistakably like BruinGains, then ship the dining loop first, then the gym/workout loop, then the profile / recommendations / onboarding layer.

That order gives us:

- a believable product quickly
- one useful daily habit before the harder lifting features
- an Appwrite backend that can support both dining and gym data cleanly
- less risk of building polished screens on top of unstable foundations
