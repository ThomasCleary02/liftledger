# Post-Launch Debt List

**Status:** Explicitly Deferred  
**Created:** After v1.0.0 (Day-Based Foundation Release)  
**Purpose:** Document intentionally deferred work to avoid scope creep

---

## 🚫 Explicitly Out of Scope (Do Not Touch Yet)

These items are **intentionally deferred** and should **not** be worked on until after the day-based foundation is stable in production.

### Data Cleanup
- ❌ **Deleting workouts collection**
  - Keep for rollback capability
  - Will be removed in a future cleanup phase
  - No timeline set

### UI Enhancements
- ❌ **Calendar heatmap UI**
  - Visual calendar with workout/rest/missed indicators
  - Nice-to-have, not critical for MVP
  - Defer until core stability is proven

### Social Features
- ❌ **Friends / leaderboards**
  - Social features explicitly out of scope
  - Will require significant architecture changes
  - Defer until core platform is stable

### Advanced Features
- ❌ **Coach mode**
  - Multi-user coaching features
  - Requires permission system
  - Defer until core features are solid

- ❌ **Push notifications**
  - Reminder notifications
  - Achievement notifications
  - Requires notification infrastructure
  - Defer until core stability

### Data & Performance
- ❌ **Data export**
  - Export workouts/days to CSV/JSON
  - Nice-to-have feature
  - Defer until core features are stable

- ❌ **Performance tuning**
  - Query optimization
  - Bundle size optimization
  - Caching improvements
  - Only optimize if performance issues arise

---

## ✅ What to Focus On Now

### Immediate Post-Launch (Next Few Days)

1. **Monitor Firestore Writes**
   - Confirm no workouts writes occur (except legacy routes)
   - Watch for any unexpected writes
   - Verify all new data goes to `days` collection

2. **Verify Analytics Correctness**
   - Compare analytics between days and workouts (if data exists in both)
   - Confirm PRs are calculated correctly
   - Verify streaks work with rest days

3. **Test Offline → Sync Flows**
   - Test offline workout logging
   - Verify sync when connection restored
   - Check sync status indicators work correctly

4. **Monitor for Bugs**
   - Watch for any errors in production
   - Monitor user feedback
   - Fix critical bugs only

### Do NOT Add Features Yet

- No new features
- No enhancements
- No "quick wins"
- Focus on stability and observation

---

## 📋 Future Cleanup (After Stability Proven)

Once the day-based foundation is proven stable (2-4 weeks minimum):

### Phase 1: Legacy Route Cleanup
- Remove `/workout/new` routes (redirect to `/day/today`)
- Remove `/workout/[id]` routes (redirect to `/day/[date]`)
- Update any remaining workout references

### Phase 2: Collection Cleanup
- Plan workouts collection deletion
- Ensure all data migrated to days
- Create final migration verification script

### Phase 3: Feature Additions
- Only after core stability is proven
- Calendar UI
- Data export
- Other enhancements

---

## 🎯 Success Criteria for Moving Forward

Before working on any deferred items:

1. ✅ No critical bugs for 2+ weeks
2. ✅ Analytics verified correct
3. ✅ No unexpected workouts writes
4. ✅ Offline sync working reliably
5. ✅ User feedback is positive
6. ✅ Performance is acceptable

**Do not proceed with deferred items until these criteria are met.**

---

## 📝 Notes

- This list is **intentional** - these items are deferred by design
- Do not second-guess this decision
- Focus on stability first, features later
- Revisit this list after stability period (minimum 2-4 weeks)

---

**Last Updated:** v1.0.0 Release  
**Next Review:** After stability period
