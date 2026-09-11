# Release Plan: 3.3.3 - Bug Fixes & Polish

**Target Version:** 3.3.3 (patch release)  
**Type:** Bug fixes + UI polish  
**Status:** Planning  
**Current Version:** 3.3.2

## Release Goals

Polish release focused on fixing usability issues and adding small quality-of-life improvements before tackling the larger 3.4.0 auth work.

## Scope

### P0 - Critical Fixes (Must Ship)

1. **Calisthenics input width fix**
   - **Issue:** When +lbs field shows for weighted calisthenics, row becomes too wide on mobile and X button gets cut off
   - **Impact:** Users can't delete sets properly on mobile
   - **Solution:** Wrap added weight input to second row on mobile screens
   - **Files:** `web/components/CalisthenicsSetInput.tsx`
   - **Estimate:** 1 hour

2. **Stair Stepper / Step Master tracking**
   - **Issue:** Uses distance (miles) which doesn't make sense for stair climbers
   - **Impact:** Users logging stair stepper have incorrect data model
   - **Solution:** Add "steps" field option for stair climber cardio types
   - **Files:** `packages/shared/cardio.ts`, `web/components/CardioInput.tsx`, data model
   - **Estimate:** 2-3 hours
   - **Note:** May need data migration for existing stair climber logs

### P1 - High Value Polish (Should Ship)

3. **Day overview summary**
   - **Feature:** Show daily progress summary without navigating to Analytics
   - **Impact:** Better immediate feedback on daily accomplishments
   - **Solution:** Add collapsible stats card at bottom of day log showing:
     - Total volume (strength)
     - Total exercises logged
     - Total cardio duration/distance
     - PRs hit today (if any)
   - **Files:** `web/app/(app)/day/[date]/page.tsx`, new component
   - **Estimate:** 3-4 hours

### P2 - Nice to Have (If Time Allows)

4. **First-time onboarding hints**
   - **Feature:** Tooltip or info badge pointing to 3-dot menu on first day log visit
   - **Impact:** Better discoverability of rest days, hold timer, supersets
   - **Solution:** Show dismissible hint on first visit, store in preferences
   - **Files:** `web/app/(app)/day/[date]/page.tsx`, preferences
   - **Estimate:** 2 hours

## Out of Scope for 3.3.3

- Catalog additions (Russian Twist, etc.) - moved to 3.4.0
- Tab icon fill fix - moved to 3.4.0
- Hold timer stop button size - moved to 3.4.0
- Calisthenics reps on Analytics Overview - moved to 3.4.0

These were originally planned for 3.3.3 but are being pushed to give more focus to critical bug fixes.

## Technical Considerations

### Stair Stepper Changes
- Need to determine if this is a breaking change
- Check if anyone has existing stair climber logs with distance data
- May need to support both distance and steps temporarily
- Update cardio activity type resolver
- Update PRs and analytics to handle steps

### Day Overview Component
- Should be opt-in or always visible?
- Mobile vs desktop placement (might need different positions)
- Should it show historical data for past days or only current day?
- Consider showing comparison to previous days' stats

### Data Model Impact
If we add steps field to cardio:
```typescript
type CardioData = {
  duration: number; // seconds
  distance?: number; // miles
  steps?: number; // NEW - for stair climbers
  activityType?: CardioActivityType;
}
```

## Testing Plan

### Manual Testing Required
1. **Calisthenics Width Fix:**
   - Test on iPhone SE (small screen)
   - Test with weight field empty
   - Test with weight field populated
   - Test deleting sets

2. **Stair Stepper:**
   - Add new stair climber log with steps
   - Verify PRs work correctly
   - Check Analytics cardio tab displays properly
   - Test import/export with steps data

3. **Day Overview:**
   - Log various exercise types (strength, cardio, calisthenics)
   - Verify volume calculations
   - Test with no exercises logged (empty state)
   - Test on mobile and desktop

### Automated Testing
- Run existing test suite (no new tests needed for width fix)
- Add unit tests for steps field if added to cardio model
- Test analytics calculations with steps data

## Rollout Plan

1. **Pre-release:**
   - Run pre-release checklist skill
   - Test on local emulator
   - Deploy to staging (if exists)

2. **Release:**
   - Bump version to 3.3.3 in root, web, and shared package.json
   - Update lockfile
   - Commit: "Release 3.3.3: Bug fixes and polish"
   - Tag: `v3.3.3`
   - Push commit + tag
   - Netlify auto-deploys from main

3. **Post-release:**
   - Monitor for errors in production
   - Watch for user feedback on stair stepper changes
   - Update roadmap docs

## Dependencies

None - all features are self-contained.

## Risks

1. **Stair Stepper Data Model Change:**
   - Low risk if we make steps optional
   - Medium risk if users have existing stair climber logs we need to migrate

2. **Day Overview Performance:**
   - Need to ensure calculations don't slow down day log
   - Should use cached/memoized data where possible

## Success Metrics

- Mobile users can delete calisthenics sets without UI issues
- Users with stair climbers can properly track their workouts
- Users engage with day overview (check usage analytics after release)
- No critical bugs reported post-release

## Timeline

**Estimate:** 6-9 hours of focused work
- P0 items: 3-4 hours
- P1 item: 3-4 hours  
- Testing: 2 hours

**Realistic timeline:** 1-2 days for implementation + testing

## Next Steps

1. Clarify stair stepper requirements (steps only? or support both steps and distance?)
2. Review day overview design (placement, mobile layout)
3. Implement P0 items first
4. Test thoroughly on mobile
5. Ship 3.3.3
6. Begin 3.4.0 auth work
