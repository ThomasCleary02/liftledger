# Deployment Checklist - v1.0.0 (Day-Based Foundation)

## Pre-Deployment

- [x] All analytics use `days` collection exclusively
- [x] PRs calculated from `days` collection
- [x] No new writes to `workouts` (except legacy routes with warnings)
- [x] Workouts collection remains readable for rollback
- [x] App builds and typechecks cleanly
- [x] No UI behavior changes
- [x] All acceptance criteria met

## Deployment Steps

### 1. Tag Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

### 2. Deploy Web App
- [ ] Deploy to Netlify/production
- [ ] Verify deployment successful
- [ ] Check for build errors

### 3. Deploy Mobile App (If Applicable)
- [ ] Build Expo app
- [ ] Submit to app stores (if ready)
- [ ] Or deploy via EAS

### 4. Deploy Firestore Rules
- [ ] Verify `firestore.rules` are deployed
- [ ] Verify `firestore.indexes.json` indexes are created
- [ ] Test security rules in production

## Post-Deployment Monitoring (Next Few Days)

### Firestore Monitoring

- [ ] **Watch Firestore Writes**
  - Monitor Firestore console for writes
  - Confirm no unexpected writes to `workouts` collection
  - Verify all new data goes to `days` collection
  - Check write patterns match expectations

- [ ] **Monitor Read Patterns**
  - Verify `days` collection reads are working
  - Check query performance
  - Monitor for any read errors

### Analytics Verification

- [ ] **Compare Analytics (If Historical Data Exists)**
  - Compare analytics from `days` vs `workouts` (if both exist)
  - Verify PRs are calculated correctly
  - Check streak calculations with rest days
  - Verify volume/distance calculations

- [ ] **Test Analytics Views**
  - Overview tab displays correctly
  - Strength analytics work
  - Cardio analytics work
  - PRs display and navigate correctly

### Offline & Sync Testing

- [ ] **Test Offline Workflow**
  - Log workout while offline
  - Verify data saved locally
  - Reconnect to internet
  - Verify sync occurs
  - Check sync status indicators

- [ ] **Test Sync Status**
  - Verify "Syncing..." appears during writes
  - Verify "Synced" appears after successful sync
  - Verify "Offline" appears when disconnected

### User Experience

- [ ] **Test Day Navigation**
  - Navigate between days
  - Use date picker
  - Test "Today" button
  - Verify day data loads correctly

- [ ] **Test Exercise Logging**
  - Add exercises to a day
  - Edit exercises
  - Remove exercises
  - Load templates
  - Toggle rest day

- [ ] **Test PR Navigation**
  - Click on PRs in analytics
  - Verify navigation to correct day
  - Verify day data displays correctly

### Error Monitoring

- [ ] **Monitor Error Logs**
  - Check Firebase console for errors
  - Monitor application error logs
  - Watch for any Firestore permission errors
  - Check for any undefined/null errors

- [ ] **User Feedback**
  - Monitor user reports
  - Watch for any data loss reports
  - Check for sync issues
  - Monitor performance complaints

## Do NOT Do Yet

- ❌ Add new features
- ❌ Work on deferred items (see `POST_LAUNCH_DEBT.md`)
- ❌ Optimize performance (unless critical)
- ❌ Delete workouts collection
- ❌ Remove legacy routes

## Success Criteria

After 2-4 weeks of monitoring:

- [ ] No critical bugs reported
- [ ] Analytics verified correct
- [ ] No unexpected workouts writes
- [ ] Offline sync working reliably
- [ ] User feedback is positive
- [ ] Performance is acceptable

**Only after these criteria are met should you consider working on deferred items.**

---

## Emergency Rollback Plan

If critical issues arise:

1. **Data Rollback**
   - Workouts collection still readable
   - Can revert to workouts-based analytics if needed
   - Migration script can be re-run if needed

2. **Code Rollback**
   - Git tag allows easy rollback
   - Can revert to pre-migration state
   - Legacy routes still functional

3. **Firestore Rules**
   - Rules can be reverted if needed
   - Indexes can be removed if needed

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Monitoring Period:** Next 2-4 weeks
