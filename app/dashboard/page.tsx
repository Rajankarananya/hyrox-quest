"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import BottomNav from "../components/BottomNav";

const TASKS = [
  { key: "workout", label: "Complete Workout", emoji: "🏋️", xp: 50 },
  { key: "protein", label: "Hit Protein Goal", emoji: "🥩", xp: 20 },
  { key: "water",   label: "Drink 4L Water",   emoji: "💧", xp: 20 },
  { key: "mobility",label: "Mobility Session",  emoji: "🧘", xp: 10 },
  { key: "sleep",   label: "Sleep On Time",     emoji: "😴", xp: 30 },
];

const LEVELS = [
  { min: 0,    name: "Rookie" },
  { min: 500,  name: "Athlete" },
  { min: 1500, name: "Warrior" },
  { min: 3000, name: "Machine" },
  { min: 5000, name: "HYROX Beast" },
];

function getLevel(xp: number) {
  let level = LEVELS[0];
  for (const l of LEVELS) { if (xp >= l.min) level = l; }
  return level;
}

function Countdown() {
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    setMounted(true);
    const race = new Date("2026-07-24T08:00:00");
    const tick = () => {
      const diff = race.getTime() - Date.now();
      if (diff <= 0) return;
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => String(n).padStart(2, "0");
  if (!mounted) return null;

  return (
    <div className="flex items-end gap-2 justify-center">
      {[
        { v: time.d, l: "DAYS", o: true },
        { v: time.h, l: "HRS" },
        { v: time.m, l: "MIN" },
        { v: time.s, l: "SEC" },
      ].map((item, i) => (
        <div key={i} className="flex items-end gap-2">
          <div className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-center min-w-[52px]">
            <div className={`text-2xl font-black tabular-nums ${item.o ? "text-orange-500" : "text-white"}`}>
              {pad(item.v)}
            </div>
            <div className="text-[8px] text-white/30 tracking-widest mt-1">{item.l}</div>
          </div>
          {i < 3 && <span className="text-orange-500 text-xl font-black pb-2">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const [name, setName]   = useState("Vedh");
  const [xp, setXp]       = useState(0);
  const [streak, setStreak] = useState(0);
  const [tasks, setTasks] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [allDone, setAllDone] = useState(false);
  const [latestMessage, setLatestMessage] = useState<{ id: string; message: string } | null>(null)

  useEffect(() => {
    loadData()

    const channel = supabase
      .channel('messages_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        setLatestMessage({ id: payload.new.id, message: payload.new.message })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, []);

  useEffect(() => {
    const done = TASKS.every((t) => tasks[t.key]);
    setAllDone(done);
  }, [tasks]);

  const dismissMessage = async () => {
    if (!latestMessage) return
    await supabase
      .from('messages')
      .update({ read: true })
      .eq('id', latestMessage.id)
    setLatestMessage(null)
  }

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: profile } = await supabase
      .from("profiles").select("*").eq("id", user.id).single();
    if (!profile) { router.push("/onboarding"); return; }

    setName(profile.name || "Champ");

    const { data: xpData } = await supabase
      .from("xp_log").select("xp").eq("athlete_id", user.id);
    if (xpData) setXp(xpData.reduce((sum, r) => sum + r.xp, 0));

    const today = new Date().toISOString().split("T")[0];
    const { data: todayTasks } = await supabase
      .from("daily_tasks").select("*")
      .eq("athlete_id", user.id).eq("date", today);

    if (todayTasks && todayTasks.length > 0) {
      const map: Record<string, boolean> = {};
      todayTasks.forEach((t) => { map[t.task_name] = t.completed; });
      setTasks(map);
    } else {
      await seedTasks(user.id, today);
    }

    const { data: allTasks } = await supabase
      .from("daily_tasks").select("date, completed")
      .eq("athlete_id", user.id).order("date", { ascending: false });

    if (allTasks) {
      const dayMap: Record<string, boolean> = {};
      allTasks.forEach((t) => {
        if (!dayMap[t.date]) dayMap[t.date] = true;
        if (!t.completed) dayMap[t.date] = false;
      });
      let count = 0;
      const d = new Date();
      for (let i = 0; i < 60; i++) {
        const key = d.toISOString().split("T")[0];
        if (dayMap[key]) count++;
        else if (i > 0) break;
        d.setDate(d.getDate() - 1);
      }
      setStreak(count);
    }

    // Only fetch latest UNREAD message to show on dashboard
    const { data: msgData } = await supabase
      .from('messages')
      .select('id, message')
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (msgData) {
      setLatestMessage({ id: msgData.id, message: msgData.message })
    }

    setLoading(false);
  };

  const seedTasks = async (userId: string, date: string) => {
    const rows = TASKS.map((t) => ({
      athlete_id: userId,
      task_name: t.key,
      date,
      completed: false,
      xp: t.xp,
    }));
    await supabase.from("daily_tasks").insert(rows);
  };

  const toggleTask = async (key: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const newVal = !tasks[key];
    setTasks((prev) => ({ ...prev, [key]: newVal }));

    await supabase.from("daily_tasks")
      .update({ completed: newVal })
      .eq("athlete_id", user.id)
      .eq("task_name", key)
      .eq("date", today);

    const task = TASKS.find((t) => t.key === key);
    if (task && newVal) {
      await supabase.from("xp_log").insert({
        athlete_id: user.id,
        xp: task.xp,
        reason: task.label,
      });
      setXp((prev) => prev + task.xp);
    }
  };

  const level = getLevel(xp);
  const completedCount = TASKS.filter((t) => tasks[t.key]).length;

  if (loading) return (
    <div className="min-h-screen bg-[#0d0d0d] flex items-center justify-center">
      <div className="text-orange-500 text-xl font-black animate-pulse">LOADING QUEST...</div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#0d0d0d] text-white pb-24">

      {/* Header */}
      <div className="bg-[#111] border-b border-white/5 px-5 py-4 flex justify-between items-center">
        <div>
          <div className="text-[10px] text-white/30 tracking-widest">HYROX QUEST</div>
          <div className="text-lg font-black">GM, {name} 🔥</div>
        </div>
        <div className="text-right">
          <div className="text-orange-500 font-black text-lg">{streak} 🔥</div>
          <div className="text-[10px] text-white/30 tracking-widest">STREAK</div>
        </div>
      </div>

      <div className="px-5 pt-5 flex flex-col gap-4">

        {/* Message from Ananya — stays until X tapped */}
        {latestMessage && (
          <div className="bg-pink-500/10 border border-pink-500/20 rounded-2xl px-4 py-4 flex gap-3 items-start">
            <span className="text-xl">💌</span>
            <div className="flex-1">
              <div className="text-[10px] text-pink-400 tracking-widest font-bold mb-1">
                MESSAGE FROM ANANYA 👑
              </div>
              <div className="text-sm text-white/80 leading-relaxed">{latestMessage.message}</div>
            </div>
            <button
              onClick={dismissMessage}
              className="text-white/20 hover:text-white/60 text-lg leading-none transition-all mt-0.5">
              ✕
            </button>
          </div>
        )}

        {/* Countdown */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[10px] text-white/30 tracking-widest">RACE DAY — 24 JULY 2026</span>
          </div>
          <Countdown />
        </div>

        {/* XP + Level */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
            <div className="text-[10px] text-white/30 tracking-widest mb-1">TOTAL XP</div>
            <div className="text-3xl font-black text-orange-500">{xp}</div>
            <div className="text-[10px] text-white/30 mt-1">XP EARNED</div>
          </div>
          <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
            <div className="text-[10px] text-white/30 tracking-widest mb-1">LEVEL</div>
            <div className="text-xl font-black text-white leading-tight">{level.name}</div>
            <div className="text-[10px] text-orange-500 mt-1">CURRENT RANK</div>
          </div>
        </div>

        {/* Daily Missions */}
        <div className="bg-[#111] border border-white/5 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="text-[10px] text-white/30 tracking-widest">TODAY'S MISSIONS</div>
            <div className="text-[10px] text-orange-500 font-bold">{completedCount}/{TASKS.length} DONE</div>
          </div>

          <div className="flex flex-col gap-3">
            {TASKS.map((task) => (
              <button
                key={task.key}
                onClick={() => toggleTask(task.key)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                  tasks[task.key]
                    ? "bg-orange-500/10 border-orange-500/30"
                    : "bg-white/3 border-white/5"
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                  tasks[task.key] ? "border-orange-500 bg-orange-500" : "border-white/20"
                }`}>
                  {tasks[task.key] && <span className="text-white text-xs">✓</span>}
                </div>
                <span className="text-lg">{task.emoji}</span>
                <span className={`flex-1 text-sm font-medium ${tasks[task.key] ? "line-through text-white/40" : "text-white"}`}>
                  {task.label}
                </span>
                <span className="text-[10px] text-orange-500 font-bold">+{task.xp} XP</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reward Chest */}
        {allDone && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-5 text-center">
            <div className="text-4xl mb-2">🎁</div>
            <div className="font-black text-lg text-orange-500">REWARD UNLOCKED!</div>
            <div className="text-white/50 text-sm mt-1">All missions complete. Claim your reward!</div>
            <button
              onClick={() => router.push("/rewards")}
              className="mt-4 bg-orange-500 text-white font-bold px-6 py-3 rounded-xl text-sm">
              Claim Reward →
            </button>
          </div>
        )}

      </div>
      <BottomNav />
    </main>
  );
}