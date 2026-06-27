"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const TABS = ["Progress", "Rewards", "Messages", "Add Reward"];

const TYPE_BADGE: Record<string, string> = {
  daily: "bg-blue-500/20 text-blue-400",
  weekly: "bg-purple-500/20 text-purple-400",
  milestone: "bg-orange-500/20 text-orange-400",
};

export default function QueensPanelPage() {
  const [tab, setTab] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [xp, setXp] = useState(0);
  const [athleteName, setAthleteName] = useState("Vedh");
  const [message, setMessage] = useState("");
  const [bonusXp, setBonusXp] = useState("");
  const [bonusReason, setBonusReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [athleteId, setAthleteId] = useState("");
  const [newReward, setNewReward] = useState({
    label: "",
    emoji: "🎁",
    type: "daily",
  });
  const [customRewards, setCustomRewards] = useState<any[]>([]);

  useEffect(() => {
    loadData();

    // ✅ ADD THIS — listen for task completions in real time
    const channel = supabase
      .channel("queens_panel_realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "daily_tasks",
        },
        () => {
          loadData(); // re-fetch everything when any task changes
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "xp_log",
        },
        () => {
          loadData(); // also re-fetch when XP is earned
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    const athlete = {
      id: "a1f1760c-7941-47b8-bec5-a0ce9daa1b33",
      name: "Vedh",
    };
    setAthleteId("a1f1760c-7941-47b8-bec5-a0ce9daa1b33");
    setAthleteName("Vedh");

    const today = new Date().toISOString().split("T")[0];
    const { data: todayTasks } = await supabase
      .from("daily_tasks")
      .select("*")
      .eq("athlete_id", athlete.id)
      .eq("date", today);
    if (todayTasks) setTasks(todayTasks);

    const { data: xpData } = await supabase
      .from("xp_log")
      .select("xp")
      .eq("athlete_id", athlete.id);
    if (xpData) setXp(xpData.reduce((s, r) => s + r.xp, 0));

    // ✅ Fetch ALL claims (pending + approved + rejected) so Ananya sees full history
    const { data: claimsData } = await supabase
      .from("reward_claims")
      .select("*")
      .eq("athlete_id", athlete.id)
      .order("claimed_date", { ascending: false });
    if (claimsData) setClaims(claimsData);

    const { data: rewardsData } = await supabase
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });
    if (rewardsData) setCustomRewards(rewardsData);

    setLoading(false);
  };

  const approveReward = async (id: string, approve: boolean) => {
    const newStatus = approve ? "approved" : "rejected";
    await supabase
      .from("reward_claims")
      .update({ status: newStatus })
      .eq("id", id);
    // Update locally so UI reflects immediately without refetch
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
    );
  };

  const sendMessage = async () => {
    if (!message.trim()) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase
      .from("messages")
      .insert({ sender_id: user?.id, message: message.trim() });
    setMessage("");
    alert("Message sent to Vedh! 💬");
  };

  const sendBonusXp = async () => {
    if (!bonusXp || !bonusReason) return;
    await supabase.from("xp_log").insert({
      athlete_id: athleteId,
      xp: parseInt(bonusXp),
      reason: bonusReason,
    });
    setXp((prev) => prev + parseInt(bonusXp));
    setBonusXp("");
    setBonusReason("");
    alert(`+${bonusXp} XP sent to Vedh! ⚡`);
  };

  const addReward = async () => {
    if (!newReward.label.trim()) return;
    await supabase.from("rewards").insert({
      reward_name: newReward.label,
      emoji: newReward.emoji,
      reward_type: newReward.type,
    });
    alert("Reward added! 🎁");
    setNewReward({ label: "", emoji: "🎁", type: "daily" });
    const { data } = await supabase
      .from("rewards")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setCustomRewards(data);
  };

  const deleteReward = async (id: string) => {
    await supabase.from("rewards").delete().eq("id", id);
    setCustomRewards((prev) => prev.filter((r) => r.id !== id));
  };

  const TASK_LABELS: Record<string, { label: string; emoji: string }> = {
    workout: { label: "Workout", emoji: "🏋️" },
    protein: { label: "Protein", emoji: "🥩" },
    water: { label: "Water", emoji: "💧" },
    mobility: { label: "Mobility", emoji: "🧘" },
    sleep: { label: "Sleep", emoji: "😴" },
  };

  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const completedCount = tasks.filter((t) => t.completed).length;

  if (loading)
    return (
      <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-pink-400 text-xl font-black animate-pulse">
          LOADING QUEEN'S PANEL...
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white pb-10">
      {/* Header */}
      <div className="bg-[#111] border-b border-white/5 px-5 py-4">
        <div className="text-[10px] text-pink-400 tracking-widest">
          QUEST MASTER
        </div>
        <div className="text-xl font-black">👑 Ananya's Panel</div>
        <div className="text-[11px] text-white/30 mt-1">Vedh's Training HQ</div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 px-5 pt-4">
        <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-orange-500">{xp}</div>
          <div className="text-[9px] text-white/30 tracking-widest mt-1">
            TOTAL XP
          </div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-white">
            {completedCount}/5
          </div>
          <div className="text-[9px] text-white/30 tracking-widest mt-1">
            TODAY
          </div>
        </div>
        <div className="bg-[#111] border border-white/5 rounded-xl p-3 text-center">
          <div className="text-xl font-black text-pink-400">{pendingCount}</div>
          <div className="text-[9px] text-white/30 tracking-widest mt-1">
            PENDING
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 pt-4 overflow-x-auto">
        {TABS.map((t, i) => (
          <button
            key={t}
            onClick={() => setTab(i)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
              tab === i ? "bg-pink-500 text-white" : "bg-[#111] text-white/30"
            }`}
          >
            {t}
            {i === 1 && pendingCount > 0 ? ` (${pendingCount})` : ""}
          </button>
        ))}
      </div>

      <div className="px-5 pt-4">
        {/* Progress Tab */}
        {tab === 0 && (
          <div className="flex flex-col gap-3">
            <div className="text-[10px] text-white/30 tracking-widest mb-1">
              {athleteName.toUpperCase()}'S TODAY
            </div>
            {tasks.length === 0 && (
              <div className="text-white/20 text-sm text-center py-8">
                No tasks logged yet today
              </div>
            )}
            {tasks.map((task) => {
              const info = TASK_LABELS[task.task_name] || {
                label: task.task_name,
                emoji: "✅",
              };
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border ${
                    task.completed
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-[#111] border-white/5"
                  }`}
                >
                  <span className="text-xl">{info.emoji}</span>
                  <span className="flex-1 text-sm font-medium">
                    {info.label}
                  </span>
                  <span
                    className={`text-xs font-bold ${task.completed ? "text-green-400" : "text-white/20"}`}
                  >
                    {task.completed ? "✓ DONE" : "PENDING"}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Rewards Tab — FIXED */}
        {tab === 1 && (
          <div className="flex flex-col gap-4">
            {/* Pending section */}
            <div className="text-[10px] text-white/30 tracking-widest">
              PENDING APPROVALS
            </div>
            {claims.filter((c) => c.status === "pending").length === 0 && (
              <div className="text-white/20 text-sm text-center py-6">
                No pending rewards 🎉
              </div>
            )}
            {claims
              .filter((c) => c.status === "pending")
              .map((claim) => (
                <div
                  key={claim.id}
                  className="bg-[#111] border border-white/5 rounded-2xl p-4"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-white">
                      🎁 {claim.reward_name}
                    </span>
                    {claim.reward_type && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${TYPE_BADGE[claim.reward_type] || "bg-white/10 text-white/40"}`}
                      >
                        {claim.reward_type}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-white/30 mb-4">
                    Claimed{" "}
                    {new Date(claim.claimed_date).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => approveReward(claim.id, true)}
                      className="flex-1 bg-green-500/20 border border-green-500/30 text-green-400 font-bold py-2 rounded-xl text-sm"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => approveReward(claim.id, false)}
                      className="flex-1 bg-red-500/20 border border-red-500/30 text-red-400 font-bold py-2 rounded-xl text-sm"
                    >
                      ✗ Reject
                    </button>
                  </div>
                </div>
              ))}

            {/* History section */}
            {claims.filter((c) => c.status !== "pending").length > 0 && (
              <>
                <div className="text-[10px] text-white/30 tracking-widest mt-2">
                  CLAIM HISTORY
                </div>
                {claims
                  .filter((c) => c.status !== "pending")
                  .map((claim) => (
                    <div
                      key={claim.id}
                      className="bg-[#111] border border-white/5 rounded-xl p-3 flex items-center gap-3"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">
                          {claim.reward_name}
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5">
                          {new Date(claim.claimed_date).toLocaleDateString(
                            "en-IN",
                            { day: "numeric", month: "short" },
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full capitalize ${
                          claim.status === "approved"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {claim.status === "approved"
                          ? "✅ Approved"
                          : "❌ Rejected"}
                      </span>
                    </div>
                  ))}
              </>
            )}
          </div>
        )}

        {/* Messages Tab */}
        {tab === 2 && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
              <div className="text-[10px] text-white/30 tracking-widest mb-3">
                SEND MOTIVATION 💬
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. Only 31 days left. Future HYROX beast loading 🔥"
                rows={3}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm resize-none"
              />
              <button
                onClick={sendMessage}
                className="mt-3 w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl text-sm"
              >
                Send Message 💌
              </button>
            </div>

            <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
              <div className="text-[10px] text-white/30 tracking-widest mb-3">
                GIVE BONUS XP ⚡
              </div>
              <input
                type="number"
                value={bonusXp}
                onChange={(e) => setBonusXp(e.target.value)}
                placeholder="XP amount (e.g. 100)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 text-sm mb-2"
              />
              <input
                type="text"
                value={bonusReason}
                onChange={(e) => setBonusReason(e.target.value)}
                placeholder="Reason (e.g. Extra running session)"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500 text-sm"
              />
              <button
                onClick={sendBonusXp}
                className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm"
              >
                Send Bonus XP ⚡
              </button>
            </div>
          </div>
        )}

        {/* Add Reward Tab */}
        {tab === 3 && (
          <div className="flex flex-col gap-4">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
              <div className="text-[10px] text-white/30 tracking-widest mb-3">
                CREATE REWARD 🎁
              </div>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newReward.emoji}
                  onChange={(e) =>
                    setNewReward((p) => ({ ...p, emoji: e.target.value }))
                  }
                  className="w-14 bg-black/40 border border-white/10 rounded-xl px-2 py-3 text-white text-center text-xl focus:outline-none focus:border-pink-500"
                />
                <input
                  type="text"
                  value={newReward.label}
                  onChange={(e) =>
                    setNewReward((p) => ({ ...p, label: e.target.value }))
                  }
                  placeholder="Reward name (e.g. Movie Night)"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-pink-500 text-sm"
                />
              </div>
              <select
                value={newReward.type}
                onChange={(e) =>
                  setNewReward((p) => ({ ...p, type: e.target.value }))
                }
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 text-sm mb-3"
              >
                <option value="daily">Daily Reward</option>
                <option value="weekly">Weekly Reward</option>
                <option value="milestone">Milestone Reward</option>
              </select>
              <button
                onClick={addReward}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-xl text-sm"
              >
                Add Reward 🎁
              </button>
            </div>

            <div className="text-[10px] text-white/30 tracking-widest">
              EXISTING REWARDS
            </div>
            {customRewards.length === 0 && (
              <div className="text-white/20 text-sm text-center py-4">
                No rewards added yet
              </div>
            )}
            {customRewards.map((r) => (
              <div
                key={r.id}
                className="bg-[#111] border border-white/5 rounded-xl p-3 flex items-center gap-3"
              >
                <span className="text-2xl">{r.emoji}</span>
                <div className="flex-1">
                  <div className="text-sm font-bold">{r.reward_name}</div>
                  <div className="text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                    {r.reward_type}
                  </div>
                </div>
                <button
                  onClick={() => deleteReward(r.id)}
                  className="text-red-400/50 hover:text-red-400 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
