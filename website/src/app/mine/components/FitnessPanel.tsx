"use client";

interface FitnessActivity {
  id: number;
  activity_type: string;
  duration_min: number;
  effort_score: number;
  verified: boolean;
  submitted_at: string;
  source_provider: string;
}

interface FitnessPanelProps {
  connected: boolean;
  provider: string | null;
  lastSync: string | null;
  todayEffort: number;
  weekEffort: number;
  streak: number;
  recentActivities: FitnessActivity[];
  syncing: boolean;
  onSync: () => void;
  onDisconnect: () => void;
  onConnect: () => void;
}

export default function FitnessPanel({
  connected,
  provider,
  lastSync,
  todayEffort,
  weekEffort,
  streak,
  recentActivities,
  syncing,
  onSync,
  onDisconnect,
  onConnect,
}: FitnessPanelProps) {
  const activityIcons: Record<string, string> = {
    run: "R",
    walk: "W",
    cycle: "C",
    swim: "S",
    workout: "X",
    hike: "H",
    yoga: "Y",
  };

  return (
    <div className="border border-green-800 rounded p-3">
      <div className="text-green-500 text-xs uppercase tracking-widest mb-3">
        Fitness Mining
      </div>

      {!connected ? (
        <div className="space-y-2">
          <div className="text-green-700 text-xs">
            Connect a wearable to earn POH through physical activity.
            Supports Apple Health, Garmin, Strava, and Fitbit.
          </div>
          <button
            onClick={onConnect}
            className="w-full border border-green-600 text-green-400 py-2 px-3 rounded font-mono text-xs hover:bg-green-900/30 transition-colors"
          >
            [ CONNECT WEARABLE ]
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex justify-between items-center">
            <div className="text-green-600 text-xs">
              <span className="text-green-400">Connected</span>
              {provider && ` — ${provider}`}
            </div>
            <button
              onClick={onSync}
              disabled={syncing}
              className="text-green-600 text-xs hover:text-green-400 transition-colors"
            >
              {syncing ? "SYNCING..." : "[ SYNC ]"}
            </button>
          </div>

          {lastSync && (
            <div className="text-green-900 text-xs">
              Last sync: {new Date(lastSync).toLocaleTimeString()}
            </div>
          )}

          {/* Today's Effort Score */}
          <div className="border-t border-green-900 pt-2">
            <div className="flex justify-between items-baseline">
              <div className="text-green-700 text-xs">Today&apos;s Effort</div>
              <div className="text-green-400 text-lg font-mono">
                {Math.round(todayEffort)}
              </div>
            </div>
            <div className="w-full bg-green-900 h-1 rounded mt-1">
              <div
                className="bg-green-500 h-1 rounded transition-all"
                style={{ width: `${Math.min(100, (todayEffort / 500) * 100)}%` }}
              />
            </div>
            <div className="text-green-900 text-xs mt-1">
              {todayEffort >= 500 ? "Daily cap reached!" : `${500 - Math.round(todayEffort)} until daily cap`}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-2 border-t border-green-900 pt-2">
            <div className="text-center">
              <div className="text-green-400 text-sm font-mono">{Math.round(weekEffort)}</div>
              <div className="text-green-900 text-xs">Week</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 text-sm font-mono">{streak}</div>
              <div className="text-green-900 text-xs">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-green-400 text-sm font-mono">
                {streak >= 10 ? "1.5x" : `${(1 + streak * 0.05).toFixed(2)}x`}
              </div>
              <div className="text-green-900 text-xs">Bonus</div>
            </div>
          </div>

          {/* Recent Activities */}
          {recentActivities.length > 0 && (
            <div className="border-t border-green-900 pt-2">
              <div className="text-green-700 text-xs mb-1">Recent Activities</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {recentActivities.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-green-500 font-mono w-3">
                        {activityIcons[a.activity_type] || "?"}
                      </span>
                      <span className="text-green-600">
                        {Math.round(a.duration_min)}min {a.activity_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 font-mono">
                        +{Math.round(a.effort_score)}
                      </span>
                      {a.verified ? (
                        <span className="text-green-500 text-xs">OK</span>
                      ) : (
                        <span className="text-yellow-600 text-xs">...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Disconnect */}
          <button
            onClick={onDisconnect}
            className="text-green-900 text-xs hover:text-red-400 transition-colors"
          >
            [ DISCONNECT WEARABLE ]
          </button>
        </div>
      )}
    </div>
  );
}
