from ortools.sat.python import cp_model


def solve(faculty_list, subject_list, room_list, constraints, allocation_map=None):
    """
    Inputs:
      faculty_list    : [{ _id, availability[[bool]*8]*6, max_hours_per_week, expertise, preferences }]
      subject_list    : [{ _id, sessions_per_week, room_type_required, type, name, code }]
      room_list       : [{ _id, type, blocked_slots:[{day,slot}] }]
      constraints     : [{ type, parsed_json }]
      allocation_map  : { subject_id -> faculty_id }  (AI-suggested pre-binding, optional)

    Returns:
      sessions : [{ faculty_id, subject_id, room_id, day, slot, batch }]
      status   : "OPTIMAL" | "FEASIBLE" | "INFEASIBLE"
    """

    DAYS  = 6   # Mon–Sat
    SLOTS = 8   # 8 periods/day
    MAX_CONSECUTIVE = 3  # max back-to-back periods for any faculty

    model = cp_model.CpModel()

    F = len(faculty_list)
    S = len(subject_list)
    R = len(room_list)

    if allocation_map is None:
        allocation_map = {}

    # ── PRE-PRUNING: expertise-based variable elimination ─────────
    # Skip x[s,f,...] variables where faculty expertise doesn't match subject.
    # Eliminates ~70-80% of variables before the solver even starts.

    def faculty_can_teach(fac, subj):
        s_id = str(subj.get('_id', ''))
        # If this subject is locked to a specific faculty via AI allocation, enforce it
        if allocation_map and s_id in allocation_map:
            return str(fac.get('_id', '')) == allocation_map[s_id]

        expertise = [e.lower() for e in fac.get('expertise', [])]
        if not expertise:
            return True  # no restrictions — can teach anything

        subj_name = subj.get('name', '').lower()
        subj_code = subj.get('code', '').lower()

        for kw in expertise:
            if kw in subj_name or kw in subj_code:
                return True

        # Lab assistants can only teach lab subjects
        if fac.get('type') == 'lab_assistant':
            return subj.get('type') == 'lab'

        return False

    # eligible[s_idx][f_idx] = True if this faculty can teach this subject
    eligible = {}
    for s in range(S):
        for f in range(F):
            eligible[(s, f)] = faculty_can_teach(faculty_list[f], subject_list[s])

    # Fallback: if NO faculty is eligible for a subject, allow all faculty.
    # This prevents subjects from being silently dropped when expertise doesn't match.
    for s in range(S):
        if not any(eligible[(s, f)] for f in range(F)):
            for f in range(F):
                eligible[(s, f)] = True

    # Build only the eligible variables — pruned set
    x = {}
    for s in range(S):
        for f in range(F):
            if not eligible[(s, f)]:
                continue
            for r in range(R):
                for d in range(DAYS):
                    for t in range(SLOTS):
                        x[(s, f, r, d, t)] = model.NewBoolVar(f'x_{s}_{f}_{r}_{d}_{t}')

    # ── HARD CONSTRAINTS ─────────────────────────────────────────

    # 1. Each subject gets exactly sessions_per_week sessions
    for s_idx, subj in enumerate(subject_list):
        needed = subj.get('sessions_per_week', 1)
        terms = [x[(s_idx, f, r, d, t)]
                 for f in range(F) if eligible[(s_idx, f)]
                 for r in range(R)
                 for d in range(DAYS)
                 for t in range(SLOTS)
                 if (s_idx, f, r, d, t) in x]
        if terms:
            model.Add(sum(terms) == needed)

    # 2. Faculty can teach at most one class per slot
    for f in range(F):
        for d in range(DAYS):
            for t in range(SLOTS):
                terms = [x[(s, f, r, d, t)]
                         for s in range(S) if eligible[(s, f)]
                         for r in range(R)
                         if (s, f, r, d, t) in x]
                if terms:
                    model.Add(sum(terms) <= 1)

    # 3. Room can host at most one class per slot
    for r in range(R):
        for d in range(DAYS):
            for t in range(SLOTS):
                terms = [x[(s, f, r, d, t)]
                         for s in range(S)
                         for f in range(F) if eligible[(s, f)]
                         if (s, f, r, d, t) in x]
                if terms:
                    model.Add(sum(terms) <= 1)

    # 4. Faculty availability
    for f_idx, fac in enumerate(faculty_list):
        avail = fac.get('availability', [[True] * SLOTS] * DAYS)
        for d in range(DAYS):
            row = avail[d] if d < len(avail) else [True] * SLOTS
            for t in range(SLOTS):
                if t < len(row) and not row[t]:
                    for s in range(S):
                        for r in range(R):
                            if (s, f_idx, r, d, t) in x:
                                model.Add(x[(s, f_idx, r, d, t)] == 0)

    # 5. Room type must match subject requirement
    for s_idx, subj in enumerate(subject_list):
        required_type = subj.get('room_type_required')
        if required_type:
            for r_idx, room in enumerate(room_list):
                if room.get('type') != required_type:
                    for f in range(F):
                        for d in range(DAYS):
                            for t in range(SLOTS):
                                if (s_idx, f, r_idx, d, t) in x:
                                    model.Add(x[(s_idx, f, r_idx, d, t)] == 0)

    # 6. Room blocked slots
    for r_idx, room in enumerate(room_list):
        for blocked in room.get('blocked_slots', []):
            d, t = blocked.get('day', -1), blocked.get('slot', -1)
            if 0 <= d < DAYS and 0 <= t < SLOTS:
                for s in range(S):
                    for f in range(F):
                        if (s, f, r_idx, d, t) in x:
                            model.Add(x[(s, f, r_idx, d, t)] == 0)

    # 7. Faculty workload: max_hours_per_week (1 slot = 1 hour)
    for f_idx, fac in enumerate(faculty_list):
        max_h = fac.get('max_hours_per_week', 20)
        terms = [x[(s, f_idx, r, d, t)]
                 for s in range(S) if eligible[(s, f_idx)]
                 for r in range(R)
                 for d in range(DAYS)
                 for t in range(SLOTS)
                 if (s, f_idx, r, d, t) in x]
        if terms:
            model.Add(sum(terms) <= max_h)

    # 8. Maximum consecutive teaching slots per faculty (hard)
    # For each window of (MAX_CONSECUTIVE+1) slots, at most MAX_CONSECUTIVE can be occupied.
    # This ensures no faculty teaches more than MAX_CONSECUTIVE periods in a row.
    for f_idx in range(F):
        for d in range(DAYS):
            for start_t in range(SLOTS - MAX_CONSECUTIVE):
                window_vars = [x[(s, f_idx, r, d, t)]
                               for t in range(start_t, start_t + MAX_CONSECUTIVE + 1)
                               for s in range(S) if eligible[(s, f_idx)]
                               for r in range(R)
                               if (s, f_idx, r, d, t) in x]
                if window_vars:
                    model.Add(sum(window_vars) <= MAX_CONSECUTIVE)

    # ── SOFT CONSTRAINTS (penalty minimization) ──────────────────

    penalties = []

    # Penalty 1: Faculty teaching in avoid_slots
    for f_idx, fac in enumerate(faculty_list):
        avoid = fac.get('preferences', {}).get('avoid_slots', [])
        for slot_pref in avoid:
            d, t = slot_pref.get('day', -1), slot_pref.get('slot', -1)
            if 0 <= d < DAYS and 0 <= t < SLOTS:
                for s in range(S):
                    for r in range(R):
                        if (s, f_idx, r, d, t) in x:
                            penalties.append(x[(s, f_idx, r, d, t)])

    # Penalty 2: Uneven weekly spread — penalise 2+ sessions of same subject on same day
    for s_idx, subj in enumerate(subject_list):
        max_per_week = subj.get('sessions_per_week', 1)
        for d in range(DAYS):
            day_vars = [x[(s_idx, f, r, d, t)]
                        for f in range(F) if eligible[(s_idx, f)]
                        for r in range(R)
                        for t in range(SLOTS)
                        if (s_idx, f, r, d, t) in x]
            if len(day_vars) >= 2:
                day_count = model.NewIntVar(0, max_per_week, f'dc_{s_idx}_{d}')
                model.Add(day_count == sum(day_vars))
                # overcrowded = max(0, day_count - 1): use >= constraint, minimizer does the rest
                overcrowded = model.NewIntVar(0, max_per_week, f'oc_{s_idx}_{d}')
                model.Add(overcrowded >= day_count - 1)
                penalties.append(overcrowded)

    if penalties:
        model.Minimize(sum(penalties))

    # ── SOLVE ─────────────────────────────────────────────────────
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60
    solver.parameters.num_search_workers = 4

    status = solver.Solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return [], 'INFEASIBLE'

    sessions = []
    for s_idx, subj in enumerate(subject_list):
        for f_idx, fac in enumerate(faculty_list):
            if not eligible[(s_idx, f_idx)]:
                continue
            for r_idx, room in enumerate(room_list):
                for d in range(DAYS):
                    for t in range(SLOTS):
                        if (s_idx, f_idx, r_idx, d, t) in x and solver.Value(x[(s_idx, f_idx, r_idx, d, t)]) == 1:
                            sessions.append({
                                'faculty_id': str(fac['_id']),
                                'subject_id': str(subj['_id']),
                                'room_id':    str(room['_id']),
                                'day':        d + 1,   # 1=Mon … 6=Sat
                                'slot':       t,
                                'is_locked':  False,
                                'batch':      1,
                            })

    status_str = 'OPTIMAL' if status == cp_model.OPTIMAL else 'FEASIBLE'
    return sessions, status_str
