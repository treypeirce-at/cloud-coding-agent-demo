// Mock daily metrics for the last 15 days.
// In a real app this would come from an API. For Pulse demo purposes it's static.

window.PULSE_DATA = {
  // Daily metrics, oldest first
  daily: [
    { date: "2026-04-29", users: 11340, sessions: 17820, conversion: 3.4, revenue: 8120 },
    { date: "2026-04-30", users: 11502, sessions: 18045, conversion: 3.3, revenue: 8240 },
    { date: "2026-05-01", users: 11890, sessions: 18634, conversion: 3.5, revenue: 8810 },
    { date: "2026-05-02", users: 12104, sessions: 19012, conversion: 3.4, revenue: 8940 },
    { date: "2026-05-03", users: 11987, sessions: 18820, conversion: 3.2, revenue: 8650 },
    { date: "2026-05-04", users: 12245, sessions: 19234, conversion: 3.3, revenue: 9020 },
    { date: "2026-05-05", users: 12530, sessions: 19658, conversion: 3.6, revenue: 9410 },
    { date: "2026-05-06", users: 12710, sessions: 19942, conversion: 3.5, revenue: 9580 },
    { date: "2026-05-07", users: 12860, sessions: 20189, conversion: 3.4, revenue: 9720 },
    { date: "2026-05-08", users: 12745, sessions: 20012, conversion: 3.2, revenue: 9540 },
    { date: "2026-05-09", users: 12998, sessions: 20420, conversion: 3.3, revenue: 9870 },
    { date: "2026-05-10", users: 13104, sessions: 20612, conversion: 3.1, revenue: 9760 },
    { date: "2026-05-11", users: 13240, sessions: 20890, conversion: 3.2, revenue: 9950 },
    { date: "2026-05-12", users: 13380, sessions: 21102, conversion: 3.3, revenue: 10120 },
    { date: "2026-05-13", users: 12847, sessions: 20245, conversion: 3.2, revenue: 9580 }
  ],
  // Prior 15-day window, parallel comparison
  prior: [
    10980, 10845, 11102, 11340, 11108, 11420, 11680, 11820, 11960,
    11804, 12045, 12180, 12298, 12410, 11920
  ]
};
