# Smart Kitchen Assistant - UK Market PRD

## Core Purpose & Success
- **Mission Statement**: Help UK households reduce food waste and make cooking decisions by analyzing their ingredients and providing shopping-integrated recipe suggestions
- **Success Indicators**: Users successfully create shopping baskets from missing ingredients, find suitable recipes with available ingredients, reduce food waste
- **Experience Qualities**: Intuitive, efficient, helpful - like having a smart kitchen assistant in your pocket

## Project Classification & Approach
- **Complexity Level**: Light Application (multiple features with persistent state and external integrations)
- **Primary User Activity**: Acting and Creating (analyzing ingredients, generating recipes, creating shopping lists)

## Thought Process for Feature Selection
- **Core Problem Analysis**: UK families struggle with meal planning, often buy ingredients they don't use, and need quick solutions for "what can I make with what I have?"
- **User Context**: Primarily mobile usage while in kitchen, at shops, or planning meals. Need quick, one-handed operation
- **Critical Path**: Photo upload → Ingredient recognition → Recipe suggestions → Shopping basket creation
- **Key Moments**: Image analysis moment, recipe discovery, seamless transition to shopping

## Essential Features

### Image Analysis & Ingredient Recognition
- **What it does**: AI-powered recognition of ingredients from photos with confidence scores
- **Why it matters**: Eliminates manual ingredient entry, core value proposition
- **Success criteria**: 85%+ accuracy on common UK ingredients, handles various lighting/angles

### UK Supermarket Integration
- **What it does**: Creates shopping baskets for missing ingredients at major UK chains (Tesco, ASDA, Sainsbury's, Morrisons)
- **Why it matters**: Removes friction between recipe discovery and ingredient procurement
- **Success criteria**: Direct links to online shopping, proper product matching

### Mobile-First Recipe Interface
- **What it does**: Touch-optimized recipe viewing with step-by-step cooking mode
- **Why it matters**: Most users cook while looking at their phone
- **Success criteria**: Readable on 375px screens, swipe navigation, large touch targets

### Smart Shopping Lists
- **What it does**: Aggregates missing ingredients across multiple recipes into optimized shopping lists
- **Why it matters**: Enables bulk shopping and meal planning
- **Success criteria**: Categorized by store section, quantity optimization

## Design Direction

### Visual Tone & Identity
- **Emotional Response**: Confidence, efficiency, and culinary inspiration
- **Design Personality**: Clean, modern, trustworthy - like premium UK food apps
- **Visual Metaphors**: Fresh ingredients, clean kitchens, British food culture
- **Simplicity Spectrum**: Minimal interface that prioritizes content and actions

### Color Strategy
- **Color Scheme Type**: Analogous with accent
- **Primary Color**: Deep British Racing Green (`oklch(0.35 0.12 150)`) - trustworthy, natural
- **Secondary Colors**: Warm cream (`oklch(0.95 0.02 85)`) - clean, appetizing background
- **Accent Color**: Vibrant orange (`oklch(0.65 0.15 45)`) - energy, appetite, call-to-action
- **Color Psychology**: Green conveys freshness and health, orange stimulates appetite and action
- **Color Accessibility**: All combinations meet WCAG AA standards
- **Foreground/Background Pairings**:
  - Background (cream): Dark green text (`oklch(0.20 0.08 150)`) - 7.5:1 ratio
  - Primary (green): White text (`oklch(1.00 0 0)`) - 8.2:1 ratio
  - Accent (orange): White text (`oklch(1.00 0 0)`) - 4.8:1 ratio

### Typography System
- **Font Pairing Strategy**: Single font family for consistency and performance
- **Typographic Hierarchy**: Clear size jumps (2xl/xl/lg/base/sm) with weight variations
- **Font Personality**: Modern, readable, professional
- **Readability Focus**: 16px minimum, 1.5 line height, appropriate contrast
- **Typography Consistency**: Consistent sizing scale across all components
- **Which fonts**: Inter - excellent mobile readability, wide character set
- **Legibility Check**: Inter tested extensively for mobile screens and cooking contexts

### Visual Hierarchy & Layout
- **Attention Direction**: Card-based layout guides eye to key actions (recipes, shopping)
- **White Space Philosophy**: Generous spacing prevents accidental taps, creates breathing room
- **Grid System**: Mobile-first 4px grid system, expanding to larger grids on desktop
- **Responsive Approach**: Mobile-first with progressive enhancement
- **Content Density**: Prioritize key information, progressive disclosure for details

### Animations
- **Purposeful Meaning**: Smooth transitions reinforce app responsiveness and polish
- **Hierarchy of Movement**: Loading states and state changes get priority
- **Contextual Appropriateness**: Subtle, functional animations that don't delay interaction

### UI Elements & Component Selection
- **Component Usage**: Shadcn components optimized for touch (Cards, Buttons, Dialogs, Sheets)
- **Component Customization**: Larger touch targets (44px minimum), rounded corners for friendly feel
- **Component States**: Clear visual feedback for all interactive elements
- **Icon Selection**: Phosphor icons for consistency and clarity at small sizes
- **Component Hierarchy**: Primary actions (recipe view, shop) prominent, secondary actions subtle
- **Spacing System**: 4px base unit for precise mobile spacing
- **Mobile Adaptation**: Bottom sheets for mobile, dialogs for desktop

### Visual Consistency Framework
- **Design System Approach**: Component-based with strict mobile-first guidelines
- **Style Guide Elements**: Touch target sizes, spacing rules, color usage patterns
- **Visual Rhythm**: Consistent card spacing, button sizing, typography scale
- **Brand Alignment**: Clean, professional, food-focused aesthetic

### Accessibility & Readability
- **Contrast Goal**: WCAG AA compliance minimum, AAA where possible for critical text

## UK Market Considerations

### Supermarket Integration
- **Target Chains**: Tesco, ASDA, Sainsbury's, Morrisons (covers 70%+ UK market)
- **Integration Method**: Deep links to online shopping with pre-populated baskets
- **Product Matching**: UK-specific ingredient names and brands
- **Delivery Options**: Account for click & collect and delivery services

### Cultural Food Preferences
- **Recipe Focus**: British classics, multicultural UK favorites, healthy options
- **Ingredient Recognition**: UK-specific brands, packaging, and seasonal items
- **Measurement Units**: Metric system, UK cup/spoon measurements where traditional

### Mobile Usage Patterns
- **Peak Usage**: Evening meal planning, weekend shopping preparation
- **Context**: Kitchen counters, in-store shopping, meal planning at home
- **Connectivity**: Assume intermittent connectivity, offline recipe viewing

## Edge Cases & Problem Scenarios
- **Poor Image Quality**: Provide guidance for better photos, multiple angle support
- **Unusual Ingredients**: Fallback to manual entry, learning system
- **Out of Stock Items**: Alternative suggestions, multiple store options
- **Recipe Dietary Restrictions**: Filter system for allergies, preferences

## Implementation Considerations
- **Performance**: Image processing optimization, fast recipe generation
- **Scalability**: Modular supermarket integration, expandable to more chains
- **Testing Focus**: Mobile usability, ingredient recognition accuracy, shopping integration
- **Critical Questions**: Can we maintain accuracy across diverse UK ingredients? Will users complete the shopping journey?

## Mobile-First Specific Considerations
- **Touch Targets**: Minimum 44px, generous spacing between interactive elements
- **One-Handed Usage**: Key actions accessible by thumb, critical content in safe zones
- **Loading States**: Immediate feedback for all actions, skeleton screens
- **Offline Support**: Recipe viewing without network, sync when connected
- **Performance**: Optimized images, lazy loading, minimal JavaScript bundles

## Reflection
This UK-focused, mobile-first approach addresses real market needs: reducing food waste, simplifying meal planning, and integrating with established shopping patterns. The focus on major UK supermarkets and mobile-optimized experience should create genuine utility for British households managing their kitchens on-the-go.