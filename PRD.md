# Smart Kitchen Assistant

An AI-powered app that analyzes photos of your food items to inventory ingredients, suggest recipes, and help you find missing items with purchase links.

**Experience Qualities**:
1. **Intuitive** - Simple photo upload instantly reveals cooking possibilities
2. **Helpful** - Provides actionable recipe suggestions based on what you actually have
3. **Efficient** - Streamlines meal planning from inventory to shopping to cooking

**Complexity Level**: Light Application (multiple features with basic state)
- Combines image analysis, recipe suggestions, and shopping integration in a cohesive workflow that maintains ingredient lists and user preferences.

## Essential Features

**Image Upload & Analysis**
- Functionality: Upload photo of pantry/fridge contents for AI ingredient identification
- Purpose: Eliminate manual inventory tracking and provide accurate ingredient detection
- Trigger: User taps camera icon or drag-drops image
- Progression: Select image → Upload → AI processing → Display identified ingredients → Review/edit list
- Success criteria: 85%+ accuracy in common ingredient identification with ability to manually correct

**Recipe Suggestions**
- Functionality: Generate recipe options based on available ingredients with missing item indicators
- Purpose: Help users cook with what they have while showing what's needed for better meals
- Trigger: After ingredient analysis or manual ingredient selection
- Progression: View ingredient list → Generate recipes → Browse options → Select recipe → View instructions
- Success criteria: Relevant recipes displayed with clear indication of missing ingredients

**Shopping Integration**
- Functionality: Generate shopping links for missing ingredients from suggested recipes
- Purpose: Seamlessly connect meal planning to ingredient acquisition
- Trigger: User selects recipe with missing ingredients
- Progression: Select recipe → View missing items → Click "Get ingredients" → External shopping links open
- Success criteria: Working links to grocery services for 90%+ of common ingredients

**Ingredient Management**
- Functionality: Manual add/remove ingredients, mark items as used, set quantities
- Purpose: Fine-tune inventory accuracy and track consumption over time
- Trigger: Edit button on ingredient list or after cooking
- Progression: View inventory → Edit mode → Add/remove/modify → Save changes
- Success criteria: Persistent ingredient list that accurately reflects kitchen contents

## Edge Case Handling

- **Unrecognizable Items**: Manual ingredient entry with search suggestions
- **Poor Image Quality**: Guidance prompts for better photos with lighting tips
- **No Recipe Matches**: Fallback suggestions for partial ingredient matches
- **Broken Shopping Links**: Graceful error handling with alternative retailer options
- **Empty Inventory**: Onboarding flow with sample recipes and ingredient suggestions

## Design Direction

The design should feel clean and kitchen-friendly - like a premium cooking app that's both sophisticated and approachable, with emphasis on visual hierarchy that makes complex information digestible.

## Color Selection

Complementary (opposite colors) - Warm oranges paired with cool teals to create an appetite-appealing palette that feels both modern and kitchen-appropriate.

- **Primary Color**: Warm Orange (oklch(0.75 0.15 45)) - Represents warmth, appetite, and cooking energy
- **Secondary Colors**: Soft Teal (oklch(0.65 0.08 200)) for supporting actions and calm contrast
- **Accent Color**: Vibrant Orange (oklch(0.70 0.18 40)) for CTAs and important interactive elements
- **Foreground/Background Pairings**: 
  - Background (White oklch(1 0 0)): Dark Gray text (oklch(0.2 0 0)) - Ratio 10.4:1 ✓
  - Card (Light Gray oklch(0.98 0 0)): Dark Gray text (oklch(0.2 0 0)) - Ratio 9.8:1 ✓
  - Primary (Warm Orange oklch(0.75 0.15 45)): White text (oklch(1 0 0)) - Ratio 5.2:1 ✓
  - Secondary (Soft Teal oklch(0.65 0.08 200)): White text (oklch(1 0 0)) - Ratio 4.8:1 ✓
  - Accent (Vibrant Orange oklch(0.70 0.18 40)): White text (oklch(1 0 0)) - Ratio 4.6:1 ✓

## Font Selection

Typography should convey reliability and clarity with a friendly, modern feel that works well for both ingredient lists and recipe instructions.

- **Typographic Hierarchy**: 
  - H1 (App Title): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal spacing
  - H3 (Recipe Names): Inter Medium/20px/normal spacing
  - Body (Ingredients/Instructions): Inter Regular/16px/relaxed line height
  - Caption (Metadata): Inter Regular/14px/muted color

## Animations

Subtle and purposeful animations that guide attention through the multi-step workflow without feeling gimmicky - focusing on smooth transitions between upload, analysis, and results states.

- **Purposeful Meaning**: Loading states communicate AI processing, ingredient cards animate in to show discovery, smooth transitions between workflow steps
- **Hierarchy of Movement**: Upload area gets subtle pulse on hover, ingredient detection animates in order of confidence, recipe cards have gentle hover lift

## Component Selection

- **Components**: Card for ingredient/recipe display, Button for primary actions, Input for manual ingredient entry, Dialog for recipe details, Badge for ingredient status, Skeleton for loading states, Tabs for organizing recipe categories, ScrollArea for long ingredient lists
- **Customizations**: Custom image upload zone with drag-drop styling, ingredient card with quantity controls, recipe card with missing ingredient indicators
- **States**: Upload button (idle/uploading/success/error), ingredient items (detected/confirmed/missing), recipe cards (available/partial/favorited)
- **Icon Selection**: Camera for upload, Plus for add ingredient, ShoppingCart for purchase links, ChefHat for recipes, Check for confirmed ingredients
- **Spacing**: Consistent 4-unit (16px) spacing between major sections, 2-unit (8px) for related items, 6-unit (24px) for distinct content groups
- **Mobile**: Stack layout on mobile with full-width cards, collapsible ingredient list, bottom sheet for recipe details, touch-friendly 44px minimum targets