"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AnalyticsOCR } from "@/components/AnalyticsOCR";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StreamLog = {
  id: number;
  date: string;
  game: string;
  duration: string;
  avgViewers: string;
  peakViewers: string;
  uniqueViewers: string;
  comments: string;
  followers: string;
  memo: string;
};

type MemoKeyword = {
  word: string;
  label: string;
  icon: string;
  count: number;
};

const inputClass =
  "h-12 w-full rounded-xl border border-zinc-700 bg-black px-3 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-purple-500";

const toNumber = (value?: string | number | null) => Number(value || 0);

const hasInput = (value?: string | number | null) =>
  value !== undefined && value !== null && String(value).trim() !== "";

const percent = (value: number) => `${(value * 100).toFixed(1)}%`;

const memoKeywordDefinitions = [
  { word: "初見", label: "初見", icon: "🔥" },
  { word: "常連", label: "常連", icon: "👥" },
  { word: "参加型", label: "参加型", icon: "🎮" },
  { word: "コメント", label: "コメント", icon: "💬" },
  { word: "深夜", label: "深夜", icon: "🌙" },
  { word: "雑談", label: "雑談", icon: "🗣️" },
  { word: "フォロー", label: "フォロー", icon: "⭐" },
  { word: "初コメ", label: "初コメ", icon: "✨" },
  { word: "ROM", label: "ROM", icon: "👀" },
];

const CONTACT_X = "@StreamCoachAI";
const LAST_UPDATED = "2026年6月18日";

export default function Home() {
  const [logs, setLogs] = useState<StreamLog[]>([]);
  const [date, setDate] = useState("");
  const [game, setGame] = useState("");
  const [duration, setDuration] = useState("");
  const [avgViewers, setAvgViewers] = useState("");
  const [peakViewers, setPeakViewers] = useState("");
  const [uniqueViewers, setUniqueViewers] = useState("");
  const [comments, setComments] = useState("");
  const [followers, setFollowers] = useState("");
  const [memo, setMemo] = useState("");
  const [activeTab, setActiveTab] = useState<"record" | "dashboard" | "analysis" | "analytics" | "gear" | "terms" | "privacy">("record");

  useEffect(() => {
    const saved = localStorage.getItem("streamcoach-logs");

    if (!saved) return;

    try {
      setLogs(JSON.parse(saved));
    } catch {
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("streamcoach-logs", JSON.stringify(logs));
  }, [logs]);

  const chartLogs = [...logs].reverse();

  const memoKeywords = useMemo(() => {
    const memoTexts = logs.map((log) => log.memo || "").join("\n");

    return memoKeywordDefinitions
      .map((item) => ({
        ...item,
        count: (memoTexts.match(new RegExp(item.word, "g")) || []).length,
      }))
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [logs]);

  const memoCount = useMemo(
    () => logs.filter((log) => (log.memo || "").trim().length > 0).length,
    [logs]
  );

  const stats = useMemo(() => {
    const count = logs.length;
    const avg =
      count === 0
        ? 0
        : logs.reduce((sum, log) => sum + toNumber(log.avgViewers), 0) / count;

    const peak =
      count === 0 ? 0 : Math.max(...logs.map((log) => toNumber(log.peakViewers)));

    const uniqueLogs = logs.filter((log) => hasInput(log.uniqueViewers));
    const totalUnique = uniqueLogs.reduce(
      (sum, log) => sum + toNumber(log.uniqueViewers),
      0
    );

    const totalComments = logs.reduce(
      (sum, log) => sum + toNumber(log.comments),
      0
    );

    const totalFollowers = logs.reduce(
      (sum, log) => sum + toNumber(log.followers),
      0
    );

    const totalAvgViewers = logs.reduce(
      (sum, log) => sum + toNumber(log.avgViewers),
      0
    );

    const retentionRate =
      totalUnique > 0 ? totalAvgViewers / totalUnique : null;

    const commentRate =
      totalUnique > 0 ? totalComments / totalUnique : null;

    const followRate =
      totalUnique > 0 ? totalFollowers / totalUnique : null;

    return {
      count,
      avg: avg.toFixed(1),
      peak,
      totalUnique,
      hasUniqueData: uniqueLogs.length > 0,
      totalComments,
      totalFollowers,
      retentionRate,
      commentRate,
      followRate,
    };
  }, [logs]);

  const gameStats = useMemo(() => {
    const games: Record<
      string,
      {
        totalViewers: number;
        totalUnique: number;
        comments: number;
        followers: number;
        streams: number;
        uniqueStreams: number;
      }
    > = {};

    logs.forEach((log) => {
      if (!games[log.game]) {
        games[log.game] = {
          totalViewers: 0,
          totalUnique: 0,
          comments: 0,
          followers: 0,
          streams: 0,
          uniqueStreams: 0,
        };
      }

      games[log.game].totalViewers += toNumber(log.avgViewers);
      games[log.game].comments += toNumber(log.comments);
      games[log.game].followers += toNumber(log.followers);
      games[log.game].streams += 1;

      if (hasInput(log.uniqueViewers)) {
        games[log.game].totalUnique += toNumber(log.uniqueViewers);
        games[log.game].uniqueStreams += 1;
      }
    });

    return Object.entries(games)
      .map(([game, data]) => {
        const avgViewers =
          data.streams === 0 ? 0 : data.totalViewers / data.streams;
        const avgUnique =
          data.uniqueStreams === 0 ? null : data.totalUnique / data.uniqueStreams;
        const retentionRate =
          data.totalUnique > 0 ? data.totalViewers / data.totalUnique : null;
        const commentRate =
          data.totalUnique > 0 ? data.comments / data.totalUnique : null;
        const followRate =
          data.totalUnique > 0 ? data.followers / data.totalUnique : null;

        const strength =
          avgViewers >= 5
            ? "平均視聴者が高めです。このカテゴリは今後の軸候補になります。"
            : data.comments >= 10
              ? "コメントが比較的多く、会話が生まれやすい可能性があります。"
              : data.streams >= 3
                ? "配信回数が増えてきているので、傾向を判断しやすくなっています。"
                : "まだデータ収集中です。数回続けると判断しやすくなります。";

        const weakness =
          avgUnique === null
            ? "ユニーク視聴者がデータ不足なので、流入不足か定着不足かはまだ判断できません。"
            : retentionRate !== null && retentionRate < 0.15
              ? "ユニークに対して平均視聴者が低めです。来た人を残す工夫が必要かもしれません。"
              : data.comments === 0
                ? "コメントが少ないため、視聴者が反応しやすい話題作りが課題です。"
                : "大きな弱点はまだ見えにくいです。メモを増やすと原因分析しやすくなります。";

        const recommendation =
          data.comments >= 10
            ? "次回もコメントが生まれた流れを再現できるように、会話内容をメモに残しましょう。"
            : avgUnique === null
              ? "次回はユニーク視聴者も入力して、流入と定着を分けて見ましょう。"
              : "同じカテゴリであと数回記録して、平均視聴者・コメント・フォローの変化を比較しましょう。";

        return {
          game,
          avgViewers,
          avgUnique,
          comments: data.comments,
          followers: data.followers,
          streams: data.streams,
          retentionRate,
          commentRate,
          followRate,
          strength,
          weakness,
          recommendation,
        };
      })
      .sort((a, b) => b.avgViewers - a.avgViewers);
  }, [logs]);

  const lineChartData = chartLogs.map((log, index) => ({
    name: log.date || `${index + 1}`,
    game: log.game,
    avg: toNumber(log.avgViewers),
    peak: toNumber(log.peakViewers),
    unique: hasInput(log.uniqueViewers) ? toNumber(log.uniqueViewers) : null,
    comments: toNumber(log.comments),
    followers: toNumber(log.followers),
    followRate:
      hasInput(log.uniqueViewers) && toNumber(log.uniqueViewers) > 0
        ? toNumber(log.followers) / toNumber(log.uniqueViewers)
        : null,
  }));

  const analysis = useMemo(() => {
    if (logs.length === 0) {
      return {
        strength: ["まだ分析できるデータがありません。"],
        weakness: ["まずは配信記録を3〜5件ほど追加すると傾向が見えやすくなります。"],
        trend: ["平均視聴者、コメント数、ユニーク視聴者を記録すると伸び方を判断できます。"],
        memo: ["配信メモを書くと、数字だけでは分からない理由を分析できます。"],
        next: "直近の配信データを入力して、まずは比較できる状態を作りましょう。",
      };
    }

    const bestGame = gameStats[0];
    const worstGame = gameStats[gameStats.length - 1];

    const recent = chartLogs.slice(-3);
    const firstRecent = recent[0];
    const lastRecent = recent[recent.length - 1];

    const firstAvg = toNumber(firstRecent?.avgViewers || "");
    const lastAvg = toNumber(lastRecent?.avgViewers || "");

    const avgTrend =
      recent.length < 2
        ? "直近傾向はまだ判断するにはデータが少なめです。"
        : lastAvg > firstAvg
          ? "平均視聴者は直近で上向きです。今の方向性は悪くありません。"
          : lastAvg < firstAvg
            ? "平均視聴者は直近で下がっています。配信内容・時間帯・タイトルを見直す余地があります。"
            : "平均視聴者は横ばいです。新しい企画や告知を試す価値があります。";

    const topCommentLog = [...logs].sort(
      (a, b) => toNumber(b.comments) - toNumber(a.comments)
    )[0];

    const topFollowerLog = [...logs].sort(
      (a, b) => toNumber(b.followers) - toNumber(a.followers)
    )[0];

    return {
      strength: [
        bestGame
          ? `最も強いカテゴリは「${bestGame.game}」で、平均視聴者は${bestGame.avgViewers.toFixed(
              1
            )}人です。`
          : "カテゴリ別の強みはまだありません。",
        topCommentLog
          ? `コメントが最も多かった配信は「${topCommentLog.game}」で、${topCommentLog.comments || 0}件でした。`
          : "コメント分析はまだできません。",
        topFollowerLog
          ? `フォロワーが最も増えた配信は「${topFollowerLog.game}」で、+${topFollowerLog.followers || 0}人でした。`
          : "フォロー分析はまだできません。",
      ],
      weakness: [
        worstGame && bestGame && worstGame.game !== bestGame.game
          ? `弱めのカテゴリは「${worstGame.game}」で、平均${worstGame.avgViewers.toFixed(
              1
            )}人です。`
          : "同じカテゴリの記録が増えると、弱いカテゴリも見えやすくなります。",
        stats.hasUniqueData
          ? "ユニーク視聴者データが入っているため、流入と定着の分析ができます。"
          : "ユニーク視聴者がデータ不足なので、今は流入不足か定着不足かの判断は保留です。",
      ],
      trend: [
        `現在の総配信数は${stats.count}回、全体の平均視聴者は${stats.avg}人です。`,
        avgTrend,
        stats.retentionRate === null
          ? "視聴維持率はまだデータ不足です。ユニーク視聴者を入れると、来た人がどれだけ残ったかを見られます。"
          : `現在の視聴維持率は${percent(stats.retentionRate)}です。平均視聴者とユニーク視聴者の差を見て判断しましょう。`,
      ],
      memo: [
        memoCount > 0
          ? `配信メモは${memoCount}件あります。数字だけでは分からない理由を分析する材料になります。`
          : "配信メモがまだ少ないです。初見・常連・コメント内容・配信の雰囲気を残しましょう。",
        memoKeywords.length > 0
          ? `メモ内で多い言葉は「${memoKeywords
              .slice(0, 3)
              .map((k) => `${k.label} ${k.count}回`)
              .join("、")}」です。`
          : "メモの頻出ワードはまだ少なめです。",
      ],
      next: bestGame
        ? `次回は「${bestGame.game}」を軸にしつつ、コメントが来た場面や初見の反応をメモに残しましょう。`
        : "まずは同じカテゴリで数回記録して、比較できる状態を作りましょう。",
    };
  }, [logs, chartLogs, gameStats, stats, memoKeywords, memoCount]);

  const addLog = () => {
    if (!date || !game) return;

    setLogs([
      {
        id: Date.now(),
        date,
        game,
        duration,
        avgViewers,
        peakViewers,
        uniqueViewers,
        comments,
        followers,
        memo,
      },
      ...logs,
    ]);

    setDate("");
    setGame("");
    setDuration("");
    setAvgViewers("");
    setPeakViewers("");
    setUniqueViewers("");
    setComments("");
    setFollowers("");
    setMemo("");
  };

  const deleteLog = (id: number) => {
    setLogs(logs.filter((log) => log.id !== id));
  };

  const exportCSV = () => {
    if (logs.length === 0) {
      alert("出力するデータがありません");
      return;
    }

    const headers = [
      "date",
      "category",
      "duration",
      "avgViewers",
      "peakViewers",
      "uniqueViewers",
      "comments",
      "followers",
      "memo",
    ];

    const rows = logs.map((log) => [
      log.date,
      log.game,
      log.duration,
      log.avgViewers,
      log.peakViewers,
      log.uniqueViewers,
      log.comments,
      log.followers,
      (log.memo || "").replace(/\n/g, " "),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `streamcoach-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const parseCSVLine = (line: string) => {
    const result: string[] = [];
    let current = "";
    let insideQuotes = false;

    for (let i = 0; i < line.length; i += 1) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"' && insideQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === "," && !insideQuotes) {
        result.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  };

  const importCSV = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const text = String(reader.result || "").replace(/^\uFEFF/, "");
      const lines = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.length <= 1) {
        alert("読み込めるデータがありません");
        return;
      }

      const importedLogs: StreamLog[] = lines.slice(1).map((line, index) => {
        const [
          csvDate,
          csvCategory,
          csvDuration,
          csvAvg,
          csvPeak,
          csvUnique,
          csvComments,
          csvFollowers,
          csvMemo,
        ] = parseCSVLine(line);

        return {
          id: Date.now() + index,
          date: csvDate || "",
          game: csvCategory || "",
          duration: csvDuration || "",
          avgViewers: csvAvg || "",
          peakViewers: csvPeak || "",
          uniqueViewers: csvUnique || "",
          comments: csvComments || "",
          followers: csvFollowers || "",
          memo: csvMemo || "",
        };
      });

      const validLogs = importedLogs.filter((log) => log.date && log.game);

      if (validLogs.length === 0) {
        alert("有効な配信記録が見つかりませんでした");
        return;
      }

      const shouldReplace = confirm(
        "CSVを読み込みます。OKを押すと現在の記録に追加します。"
      );

      if (!shouldReplace) return;

      setLogs((currentLogs) => [...validLogs, ...currentLogs]);
      alert(`${validLogs.length}件の記録を読み込みました`);
    };

    reader.readAsText(file, "utf-8");
  };


  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-6 border-b border-zinc-800 pb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-5xl font-black tracking-tight">StreamCoach AI</h1>
            <span className="rounded-full border border-purple-500/40 bg-purple-500/10 px-3 py-1 text-sm font-bold text-purple-300">
              β版
            </span>
          </div>
          <p className="mt-2 text-zinc-400">
            Twitch配信者向け 成長分析ダッシュボード
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">
            配信データを記録し、画像読み取り・グラフ・配信分析で「次に何を改善するか」を見つけるためのβ版ツールです。
          </p>
        </header>

        <div className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
          <p className="text-sm font-bold text-purple-200">β版公開中</p>
          <p className="mt-1 text-sm leading-6 text-zinc-300">
            現在は無料で利用できます。今後、AIコーチ分析やTwitch連携などの機能を追加予定です。
          </p>
        </div>

        <nav className="mb-6 flex flex-wrap gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3">
          <TabButton
            active={activeTab === "record"}
            onClick={() => setActiveTab("record")}
          >
            記録追加
          </TabButton>
          <TabButton
            active={activeTab === "dashboard"}
            onClick={() => setActiveTab("dashboard")}
          >
            ダッシュボード
          </TabButton>
          <TabButton
            active={activeTab === "analysis"}
            onClick={() => setActiveTab("analysis")}
          >
            分析
          </TabButton>
          <TabButton
            active={activeTab === "analytics"}
            onClick={() => setActiveTab("analytics")}
          >
            アナリティクス
          </TabButton>
          <TabButton
            active={activeTab === "gear"}
            onClick={() => setActiveTab("gear")}
          >
            配信環境
          </TabButton>
        </nav>

        {activeTab === "record" && (
          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="mb-5 text-xl font-bold">配信記録を追加</h2>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_430px]">
              <div className="grid gap-4 md:grid-cols-12">
                <TextField label="日付" className="md:col-span-3">
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                </TextField>

                <TextField label="カテゴリ" className="md:col-span-5">
                  <input placeholder="例：雑談、モンハン、VALORANT、マイクラ" value={game} onChange={(e) => setGame(e.target.value)} className={inputClass} />
                </TextField>

                <NumberField label="配信時間" value={duration} unit="時間" placeholder="例：3.5" onChange={setDuration} className="md:col-span-4" />
                <NumberField label="平均視聴者" value={avgViewers} unit="人" placeholder="例：4.2" onChange={setAvgViewers} className="md:col-span-4" />
                <NumberField label="最大同接" value={peakViewers} unit="人" placeholder="例：7" onChange={setPeakViewers} className="md:col-span-4" />
                <NumberField label="ユニーク視聴者" value={uniqueViewers} unit="人" placeholder="例：25" onChange={setUniqueViewers} className="md:col-span-4" />
                <NumberField label="コメント数" value={comments} unit="件" placeholder="例：15" onChange={setComments} className="md:col-span-4" />
                <NumberField label="フォロワー増減" value={followers} unit="人" placeholder="例：2" onChange={setFollowers} className="md:col-span-4" />

                <TextField label="配信メモ" className="md:col-span-12">
                  <p className="mb-2 text-xs leading-5 text-zinc-500">
                    初見・常連・参加型・コメントが増えた理由などを残すと、分析で振り返りやすくなります。
                  </p>
                  <textarea
                    placeholder={"例：初見が来た\nコメントが多かった\nタイトルを変えた\n常連が来た"}
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className={`${inputClass} min-h-24 resize-y py-3`}
                  />
                </TextField>

                <button onClick={addLog} className="rounded-xl bg-purple-600 px-4 py-3 text-sm font-bold hover:bg-purple-500 md:col-span-12">
                  ＋ 配信記録を保存
                </button>
              </div>

              <div className="space-y-4">
                <AnalyticsOCR
                  setDuration={setDuration}
                  setAvgViewers={setAvgViewers}
                  setPeakViewers={setPeakViewers}
                  setUniqueViewers={setUniqueViewers}
                  setComments={setComments}
                  setFollowers={setFollowers}
                />

                <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="font-bold">Twitch連携</h3>
                    <span className="rounded-full border border-purple-400/40 bg-black/40 px-3 py-1 text-xs font-bold text-purple-300">
                      準備中
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-zinc-300">
                    将来的にTwitchから配信データを自動取得し、手入力やスクショ読み取りの手間を減らします。
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "dashboard" && (
          <>
            <section className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-6">
              <StatCard title="総配信数" value={`${stats.count}`} unit="回" />
              <StatCard title="平均視聴者" value={`${stats.avg}`} unit="人" />
              <StatCard title="最高同接" value={`${stats.peak}`} unit="人" />
              <StatCard
                title="ユニーク合計"
                value={stats.hasUniqueData ? `${stats.totalUnique}` : "データ不足"}
                unit={stats.hasUniqueData ? "人" : ""}
              />
              <StatCard title="総コメント" value={`${stats.totalComments}`} unit="件" />
              <StatCard
                title="フォロワー増減"
                value={`${stats.totalFollowers >= 0 ? "+" : ""}${stats.totalFollowers}`}
                unit="人"
              />
            </section>

            <section className="mb-6 grid gap-4 md:grid-cols-3">
              <RateCard
                title="視聴維持率"
                value={stats.retentionRate === null ? "データ不足" : percent(stats.retentionRate)}
                description="平均視聴者 ÷ ユニーク視聴者"
              />
              <RateCard
                title="コメント率"
                value={stats.commentRate === null ? "データ不足" : percent(stats.commentRate)}
                description="コメント数 ÷ ユニーク視聴者"
              />
              <RateCard
                title="フォロー率"
                value={stats.followRate === null ? "データ不足" : percent(stats.followRate)}
                description="フォロワー増減 ÷ ユニーク視聴者"
              />
            </section>

            <div className="mt-6">
              <Panel title="カテゴリ別ランキング">
                {gameStats.length === 0 ? (
                  <EmptyState text="データがありません" />
                ) : (
                  <div className="overflow-x-auto pb-2">
                    <div className="flex min-w-max gap-4">
                      {gameStats.map((game, index) => (
                        <div
                          key={game.game}
                          className="w-[390px] shrink-0 rounded-xl border border-zinc-800 bg-black p-4"
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold">#{index + 1}</span>
                              <span className="font-bold">{game.game}</span>
                            </div>
                            <span className="font-bold text-purple-400">
                              平均 {game.avgViewers.toFixed(1)}人
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <MiniBox label="配信回数" value={`${game.streams}回`} />
                            <MiniBox
                              label="ユニーク平均"
                              value={
                                game.avgUnique === null
                                  ? "-"
                                  : `${game.avgUnique.toFixed(1)}人`
                              }
                            />
                            <MiniBox label="コメント合計" value={`${game.comments}件`} />
                            <MiniBox
                              label="フォロワー合計"
                              value={`${game.followers >= 0 ? "+" : ""}${game.followers}人`}
                            />
                          </div>

                          <div className="mt-3 grid gap-2 text-sm">
                            <CommentLine label="強み" color="text-green-400" text={game.strength} />
                            <CommentLine label="改善点" color="text-yellow-400" text={game.weakness} />
                            <CommentLine label="おすすめ" color="text-purple-400" text={game.recommendation} />
                          </div>

                          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-500">
                            <span>
                              視聴維持率{" "}
                              {game.retentionRate === null ? "-" : percent(game.retentionRate)}
                            </span>
                            <span>
                              コメント率{" "}
                              {game.commentRate === null ? "-" : percent(game.commentRate)}
                            </span>
                            <span>
                              フォロー率{" "}
                              {game.followRate === null ? "-" : percent(game.followRate)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            </div>


          </>
        )}


        {activeTab === "analysis" && (
          <>
            <div>
              <ComingSoonCard
                title="AIコーチ分析"
                badge="準備中"
                description="保存済みの配信データ・カテゴリ別傾向・配信メモをAIがまとめて分析し、次の配信をより良くするための改善案を提案します。"
                items={[
                  "配信改善提案",
                  "週次レポート",
                  "月次レポート",
                  "伸びた理由・伸びなかった理由の分析",
                ]}
              />
            </div>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">配信環境の改善</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    コメント率や初見の定着には、配信内容だけでなく「聞きやすさ」「見やすさ」も関係します。
                    音質・映像・配信の安定性を見直したい場合は、配信環境タブで機材候補を確認できます。
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("gear")}
                  className="shrink-0 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold hover:bg-purple-500"
                >
                  配信環境を見る
                </button>
              </div>
            </div>

            <Panel title="配信分析">
              <div className="grid gap-4 lg:grid-cols-2">
                <AnalysisCard icon="✅" title="強み" items={analysis.strength} />
                <AnalysisCard icon="⚠" title="改善点" items={analysis.weakness} />
                <AnalysisCard icon="📈" title="成長傾向" items={analysis.trend} />
                <AnalysisCard icon="📝" title="メモ傾向" items={analysis.memo} />
                <div className="rounded-2xl border border-purple-500/40 bg-purple-500/10 p-5 lg:col-span-2">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xl">🎯</span>
                    <h3 className="font-bold text-purple-300">次回おすすめ</h3>
                  </div>
                  <p className="text-sm leading-6 text-zinc-200">{analysis.next}</p>
                </div>
              </div>
            </Panel>


            <div className="mt-6">
              <Panel title="メモ分析">
                <MemoAnalysis keywords={memoKeywords} memoCount={memoCount} />
              </Panel>
            </div>


          </>
        )}

        {activeTab === "analytics" && (
          <>
            <Panel title="アナリティクス概要">
              <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="最高同接" value={`${stats.peak}`} unit="人" />
                <StatCard title="平均視聴者" value={`${stats.avg}`} unit="人" />
                <StatCard
                  title="ユニーク合計"
                  value={stats.hasUniqueData ? `${stats.totalUnique}` : "データ不足"}
                  unit={stats.hasUniqueData ? "人" : ""}
                />
                <StatCard title="総コメント" value={`${stats.totalComments}`} unit="件" />
              </div>
            </Panel>

            <div className="mt-6">
              <Panel title="視聴者推移（平均・最大）">
                {lineChartData.length === 0 ? (
                  <EmptyState text="まだデータがありません。配信記録を追加するとグラフが表示されます。" />
                ) : (
                  <div className="h-80 min-h-[320px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={lineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                        <XAxis dataKey="name" stroke="#a1a1aa" />
                        <YAxis stroke="#a1a1aa" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#09090b",
                            border: "1px solid #3f3f46",
                            borderRadius: "12px",
                            color: "#ffffff",
                          }}
                        />
                        <Line type="monotone" dataKey="avg" name="平均視聴者" stroke="#a855f7" strokeWidth={3} />
                        <Line type="monotone" dataKey="peak" name="最大同接" stroke="#3b82f6" strokeWidth={3} />
                        {stats.hasUniqueData && (
                          <Line type="monotone" dataKey="unique" name="ユニーク視聴者" stroke="#22c55e" strokeWidth={3} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>
            </div>

            <section className="mt-6 grid gap-6 lg:grid-cols-2">
              <MetricLineChart title="平均視聴者推移" data={lineChartData} dataKey="avg" name="平均視聴者" valueSuffix="人" />
              <MetricLineChart title="フォロワー推移" data={lineChartData} dataKey="followers" name="フォロワー増減" valueSuffix="人" />
              <MetricLineChart title="ユニーク推移" data={lineChartData} dataKey="unique" name="ユニーク視聴者" valueSuffix="人" />
              <MetricLineChart title="コメント推移" data={lineChartData} dataKey="comments" name="コメント数" valueSuffix="件" />
              <MetricLineChart
                title="フォロー率推移"
                data={lineChartData}
                dataKey="followRate"
                name="フォロー率"
                valueFormatter={(value) => percent(value)}
              />
            </section>

            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold">バックアップ</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">
                    β版では配信記録はブラウザ内に保存されます。ブラウザデータ削除や端末変更に備えて、定期的にCSVで保存してください。
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={exportCSV}
                    className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold hover:bg-green-500"
                  >
                    CSVバックアップ出力
                  </button>

                  <label className="cursor-pointer rounded-xl border border-zinc-700 px-4 py-3 text-center text-sm font-bold text-zinc-300 hover:border-purple-500 hover:text-white">
                    CSV読み込み
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        importCSV(e.target.files?.[0] || null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Panel title="配信履歴">
                {logs.length === 0 ? (
                  <EmptyState text="保存した配信記録がここに表示されます。" />
                ) : (
                  <div className="max-h-[520px] overflow-y-auto pr-2">
                    <div className="overflow-x-auto rounded-xl border border-zinc-800">
                      <table className="w-full min-w-[1100px] text-left text-sm">
                        <thead className="sticky top-0 bg-zinc-950 text-xs text-zinc-500">
                          <tr>
                            <Th>日付</Th>
                            <Th>カテゴリ</Th>
                            <Th>時間</Th>
                            <Th>平均</Th>
                            <Th>最大</Th>
                            <Th>ユニーク</Th>
                            <Th>コメント</Th>
                            <Th>フォロワー</Th>
                            <Th>メモ</Th>
                            <Th>削除</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {logs.map((log) => (
                            <tr key={log.id} className="border-t border-zinc-800 bg-black">
                              <Td>{log.date}</Td>
                              <Td>
                                <span className="font-bold text-white">{log.game}</span>
                              </Td>
                              <Td>{log.duration ? `${log.duration}時間` : "-"}</Td>
                              <Td>{log.avgViewers ? `${log.avgViewers}人` : "-"}</Td>
                              <Td>{log.peakViewers ? `${log.peakViewers}人` : "-"}</Td>
                              <Td>{log.uniqueViewers ? `${log.uniqueViewers}人` : "-"}</Td>
                              <Td>{log.comments ? `${log.comments}件` : "-"}</Td>
                              <Td>{log.followers ? `${log.followers}人` : "0人"}</Td>
                              <td className="min-w-[320px] px-4 py-3 text-zinc-300">
                                <p className="line-clamp-2 whitespace-normal text-zinc-400" title={log.memo}>
                                  {log.memo || "-"}
                                </p>
                              </td>
                              <Td>
                                <button
                                  onClick={() => deleteLog(log.id)}
                                  className="rounded-lg border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-red-500 hover:text-red-400"
                                >
                                  削除
                                </button>
                              </Td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </>
        )}
        {activeTab === "gear" && (
          <>
            <Panel title="配信環境">
              <div className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-4">
                <p className="text-sm font-bold text-purple-200">配信環境も成長の一部です</p>
                <p className="mt-2 text-sm leading-6 text-zinc-300">
                  声が聞き取りやすい、画面が見やすい、配信が安定しているだけで初見の印象は変わります。
                  ここでは配信者向けに、コスパ・性能・価格重視で機材候補を整理します。
                </p>
              </div>

              <div className="mt-6 grid gap-6">
                <GearCategory
                  title="マイク"
                  description="声の聞きやすさはコメント率や初見の残りやすさに関わります。まず優先したい配信機材です。"
                  items={[
                    {
                      type: "コスパ重視",
                      name: "FIFINE AM8",
                      note: "USB/XLR両対応。価格を抑えつつ配信向けの音質を狙いやすい定番候補。",
                      rating: "StreamCoach評価：★★★★☆",
                      url: "https://amzn.to/4vnAjvV",
                    },
                    {
                      type: "性能重視",
                      name: "Shure MV7+",
                      note: "音質重視で長く使いたい人向け。雑談配信や声を武器にしたい配信者と相性が良い候補。",
                      rating: "StreamCoach評価：★★★★★",
                      url: "https://amzn.to/4xD5fJT",
                    },
                    {
                      type: "値段重視",
                      name: "FIFINE K669B",
                      note: "できるだけ安くマイク環境を整えたい人向け。まず配信を始めたい人の入門候補。",
                      rating: "StreamCoach評価：★★★☆☆",
                      url: "https://amzn.to/4ewmK5T",
                    },
                  ]}
                />

                <GearCategory
                  title="Webカメラ"
                  description="顔出し・手元カメラ・雑談配信など、見た目の情報量を増やしたい人向けです。"
                  items={[
                    {
                      type: "コスパ重視",
                      name: "Logicool C922n",
                      note: "配信者向けWebカメラの定番候補。価格と画質のバランスを取りたい人向け。",
                      rating: "StreamCoach評価：★★★★☆",
                      url: "https://amzn.to/4oFhMIQ",
                    },
                    {
                      type: "性能重視",
                      name: "Elgato Facecam MK.2",
                      note: "画質をしっかり上げたい人向け。顔出し雑談やカメラ映像の印象を重視する人におすすめ。",
                      rating: "StreamCoach評価：★★★★★",
                      url: "https://amzn.to/3SBxSqV",
                    },
                    {
                      type: "値段重視",
                      name: "Logicool C270n",
                      note: "まず安く顔出しや手元カメラを試したい人向け。最低限の導入候補。",
                      rating: "StreamCoach評価：★★★☆☆",
                      url: "https://amzn.to/4b1iRF9",
                    },
                  ]}
                />

                <GearCategory
                  title="キャプチャーボード"
                  description="Switch・PS5など家庭用ゲーム機の配信をしたい人向けです。配信の幅を広げられます。"
                  items={[
                    {
                      type: "コスパ重視",
                      name: "AVerMedia Live Gamer MINI",
                      note: "家庭用ゲーム機配信を始めたい人向け。価格と安定性のバランスを取りやすい候補。",
                      rating: "StreamCoach評価：★★★★☆",
                      url: "https://amzn.to/3SkOrY3",
                    },
                    {
                      type: "性能重視",
                      name: "Elgato HD60 X",
                      note: "画質・安定性を重視したい人向け。PS5やSwitch配信をしっかりやりたい人の候補。",
                      rating: "StreamCoach評価：★★★★★",
                      url: "https://amzn.to/4oEta7U",
                    },
                    {
                      type: "値段重視",
                      name: "UGREEN キャプチャーボード",
                      note: "できるだけ安く家庭用ゲーム機配信を試したい人向け。入門用の候補。",
                      rating: "StreamCoach評価：★★★☆☆",
                      url: "https://amzn.to/4efGaxa",
                    },
                  ]}
                />

                <GearCategory
                  title="キーボード・周辺機器"
                  description="ゲーム配信や作業環境を整えたい人向けです。操作性や配信の快適さにつながります。"
                  items={[
                    {
                      type: "コスパ重視",
                      name: "Royal Kludge RK84",
                      note: "価格を抑えつつ無線・コンパクト構成を狙いやすい候補。デスク周りをすっきりさせたい人向け。",
                      rating: "StreamCoach評価：★★★★☆",
                      url: "https://amzn.to/44iyc0e",
                    },
                    {
                      type: "性能重視",
                      name: "Pulsar PCMK 2 HE",
                      note: "ゲーム用途で性能を重視したい人向け。FPS配信など操作性を重視する人の候補。",
                      rating: "StreamCoach評価：★★★★★",
                      url: "https://amzn.to/44fMwGW",
                    },
                    {
                      type: "値段重視",
                      name: "Logicool G213",
                      note: "できるだけ安くゲーミングキーボードを導入したい人向け。入門用の候補。",
                      rating: "StreamCoach評価：★★★☆☆",
                      url: "https://amzn.to/4aFBRZI",
                    },
                  ]}
                />
              </div>


                <GearCategory
                  title="モニター"
                  description="ゲーム配信や作業効率を上げたい人向けです。メインモニターだけでなく、OBSやコメント確認用のサブモニターにも役立ちます。"
                  items={[
                    {
                      type: "コスパ重視",
                      name: "KOORUI 24E4",
                      note: "高リフレッシュレートで価格を抑えたい人向け。FPSやアクションゲーム配信の入門候補。",
                      rating: "StreamCoach評価：★★★★☆",
                      url: "https://amzn.to/4xJANy6",
                    },
                    {
                      type: "性能重視",
                      name: "Dell AW2726DM",
                      note: "高画質・高性能で長く使いたい人向け。ゲームも作業も快適にしたい配信者向けの候補。",
                      rating: "StreamCoach評価：★★★★★",
                      url: "https://amzn.to/4w3K56q",
                    },
                    {
                      type: "値段重視",
                      name: "PHILIPS 242E2F",
                      note: "できるだけ安くモニターを増やしたい人向け。サブモニター用にも使いやすい候補。",
                      rating: "StreamCoach評価：★★★☆☆",
                      url: "https://amzn.to/4aFRxMw",
                    },
                  ]}
                />

                <GearCategory
                  title="オーディオインターフェース"
                  description="XLRマイクを使いたい人や、音質を本格的に整えたい人向けです。声を武器にしたい配信者ほど重要になります。"
                  items={[
                    {
                      type: "コスパ重視",
                      name: "Scarlett Solo",
                      note: "定番のオーディオインターフェース。XLRマイクを安定して使いたい人向けの候補。",
                      rating: "StreamCoach評価：★★★★☆",
                      url: "https://amzn.to/4vkHq87",
                    },
                    {
                      type: "性能重視",
                      name: "Wave XLR MK.2",
                      note: "配信者向け機能が豊富。音質だけでなく配信中の音量管理もしやすい候補。",
                      rating: "StreamCoach評価：★★★★★",
                      url: "https://amzn.to/4exkJGS",
                    },
                    {
                      type: "値段重視",
                      name: "M-Track Solo",
                      note: "できるだけ安くXLR環境を試したい人向け。入門用の候補。",
                      rating: "StreamCoach評価：★★★☆☆",
                      url: "https://amzn.to/4fQEzz5",
                    },
                  ]}
                />

                <GearCategory
                  title="照明"
                  description="顔出し配信や手元カメラの見やすさを改善したい人向けです。カメラ映りは初見の印象にも関わります。"
                  items={[
                    {
                      type: "コスパ重視",
                      name: "NEEWER LED",
                      note: "コスパ良く照明環境を整えたい人向け。顔出しや手元カメラの映りを改善しやすい候補。",
                      rating: "StreamCoach評価：★★★★☆",
                      url: "https://amzn.to/4xEhpSW",
                    },
                    {
                      type: "性能重視",
                      name: "Key Light Air",
                      note: "配信者定番の高品質ライト。明るさや見た目の安定感を重視したい人向け。",
                      rating: "StreamCoach評価：★★★★★",
                      url: "https://amzn.to/4fQEYBB",
                    },
                    {
                      type: "値段重視",
                      name: "UBeesize",
                      note: "安価に照明を導入したい人向け。まず顔出しや手元配信を試したい人の候補。",
                      rating: "StreamCoach評価：★★★☆☆",
                      url: "https://amzn.to/4oFzjAz",
                    },
                  ]}
                />

              <div className="mt-6 rounded-xl border border-zinc-800 bg-black p-4">
                <p className="text-xs font-bold text-zinc-400">アフィリエイトについて</p>
                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  当サイトはAmazonアソシエイト・プログラムに参加しています。
                  当サイトは適格販売により収入を得ています。
                  紹介している商品から購入された場合、運営者が紹介料を受け取ることがあります。
                  商品価格・在庫・仕様は販売サイトをご確認ください。
                </p>
              </div>
            </Panel>
          </>
        )}

        {activeTab === "terms" && <TermsSection />}

        {activeTab === "privacy" && <PrivacySection />}

        <footer className="mt-10 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-bold text-zinc-300">StreamCoach AI β</p>
              <p className="mt-1 max-w-2xl leading-6">
                配信者向け成長分析ツール。現在β版として開発中です。β版のため、重要な記録は必要に応じて別途バックアップしてください。
              </p>
              <p className="mt-2 text-xs">© 2026 StreamCoach AI. All Rights Reserved.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <button onClick={() => setActiveTab("terms")} className="hover:text-white">
                利用規約
              </button>
              <button onClick={() => setActiveTab("privacy")} className="hover:text-white">
                プライバシーポリシー
              </button>
              <a href="https://x.com/StreamCoachAI" target="_blank" rel="noreferrer" className="hover:text-white">
                お問い合わせ　　X：{CONTACT_X}
              </a>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}


function TermsSection() {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-2xl font-black">利用規約</h2>
      <p className="mt-2 text-sm text-zinc-500">最終更新日：{LAST_UPDATED}</p>
      <LegalBlock title="第1条（適用）">
        <p>本利用規約は、StreamCoach AIの利用条件を定めるものです。</p>
        <p>利用者は、本規約に同意した上で本サービスを利用するものとします。</p>
      </LegalBlock>
      <LegalBlock title="第2条（サービス内容）">
        <p>本サービスは、配信データの記録、分析、可視化および配信活動の改善支援を目的としたサービスです。</p>
        <p>本サービスの内容は、予告なく変更、追加、停止される場合があります。</p>
      </LegalBlock>
      <LegalBlock title="第3条（β版について）">
        <p>本サービスはβ版として提供されています。不具合、データ消失、サービス停止等が発生する可能性があります。</p>
      </LegalBlock>
      <LegalBlock title="第4条（禁止事項）">
        <ul className="list-disc space-y-2 pl-5">
          <li>法令または公序良俗に反する行為</li>
          <li>本サービスへの不正アクセス</li>
          <li>本サービスの運営を妨害する行為</li>
          <li>本サービスまたはその一部を無断で複製、転載、再配布する行為</li>
          <li>本サービスを解析し、類似サービスを作成する目的で利用する行為</li>
          <li>自動ツールやボット等により過度なアクセスを行う行為</li>
        </ul>
      </LegalBlock>
      <LegalBlock title="第5条（データ管理）">
        <p>利用者は、自身のデータについて必要に応じてバックアップを行うものとします。</p>
        <p>運営者は、データの消失、破損、変更について責任を負いません。</p>
      </LegalBlock>
      <LegalBlock title="第6条（免責事項）">
        <p>本サービスで提供される分析結果、改善提案、統計情報は参考情報であり、正確性、有用性、完全性を保証するものではありません。</p>
        <p>本サービスの利用によって生じた損害について、運営者は責任を負いません。</p>
      </LegalBlock>
      <LegalBlock title="第7条（お問い合わせ）">
        <p>お問い合わせは公式Xアカウントまでご連絡ください。現在の連絡先：{CONTACT_X}</p>
      </LegalBlock>
    </section>
  );
}

function PrivacySection() {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
      <h2 className="text-2xl font-black">プライバシーポリシー</h2>
      <p className="mt-2 text-sm text-zinc-500">最終更新日：{LAST_UPDATED}</p>
      <LegalBlock title="1. 基本方針">
        <p>StreamCoach AIは、利用者のプライバシーを尊重し、個人情報の適切な取り扱いに努めます。</p>
      </LegalBlock>
      <LegalBlock title="2. 取得する情報">
        <ul className="list-disc space-y-2 pl-5">
          <li>利用者が入力する配信データ、メモ情報</li>
          <li>お問い合わせ内容</li>
          <li>IPアドレス、ブラウザ情報、Cookie情報、アクセス履歴</li>
        </ul>
      </LegalBlock>
      <LegalBlock title="3. 情報の利用目的">
        <ul className="list-disc space-y-2 pl-5">
          <li>本サービスの提供</li>
          <li>不具合調査</li>
          <li>サービス改善</li>
          <li>利用状況の分析</li>
          <li>お問い合わせ対応</li>
        </ul>
      </LegalBlock>
      <LegalBlock title="4. アクセス解析ツールについて">
        <p>本サービスでは、Google Analytics等のアクセス解析ツールを利用する場合があります。</p>
        <p>これらのツールはCookieを利用して利用状況を収集することがあります。</p>
      </LegalBlock>
      <LegalBlock title="5. データ保存について">
        <p>現在のβ版では、配信データ等は利用者のブラウザ内（LocalStorage等）に保存されます。</p>
        <p>運営者は利用者の入力データをサーバー上に保存していません。</p>
      </LegalBlock>
      <LegalBlock title="6. 第三者提供">
        <p>運営者は法令に基づく場合を除き、利用者の個人情報を第三者へ提供しません。</p>
      </LegalBlock>
      <LegalBlock title="7. Twitch連携について">
        <p>今後、Twitch等の外部サービスとの連携機能を提供する場合があります。その際は取得する情報および利用目的を明示し、本ポリシーを更新します。</p>
      </LegalBlock>
      <LegalBlock title="8. お問い合わせ">
        <p>お問い合わせは公式Xアカウントまでご連絡ください。現在の連絡先：{CONTACT_X}</p>
      </LegalBlock>
    </section>
  );
}

function LegalBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6 border-t border-zinc-800 pt-5">
      <h3 className="font-bold text-zinc-100">{title}</h3>
      <div className="mt-3 space-y-2 text-sm leading-7 text-zinc-300">
        {children}
      </div>
    </div>
  );
}


function ComingSoonCard({
  title,
  badge,
  description,
  items,
}: {
  title: string;
  badge: string;
  description: string;
  items: string[];
}) {
  return (
    <section className="rounded-2xl border border-purple-500/30 bg-purple-500/10 p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold">{title}</h2>
        <span className="rounded-full border border-purple-400/40 bg-black/40 px-3 py-1 text-xs font-bold text-purple-300">
          {badge}
        </span>
      </div>
      <p className="text-sm leading-6 text-zinc-200">{description}</p>
      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <div
            key={item}
            className="rounded-lg border border-zinc-800 bg-black/50 px-3 py-2 text-sm text-zinc-300"
          >
            ✓ {item}
          </div>
        ))}
      </div>
    </section>
  );
}


function GearCategory({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: {
    type: string;
    name: string;
    note: string;
    rating?: string;
    url: string;
  }[];
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <GearItem key={`${title}-${item.type}`} item={item} />
        ))}
      </div>
    </section>
  );
}

function GearItem({
  item,
}: {
  item: {
    type: string;
    name: string;
    note: string;
    rating?: string;
    url: string;
  };
}) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-xs font-bold text-purple-300">{item.type}</p>
      <p className="mt-2 font-bold text-zinc-100">{item.name}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{item.note}</p>
      {item.rating && (
        <div className="mt-3 rounded-lg bg-zinc-900 p-3 text-xs font-bold text-zinc-300">
          {item.rating}
        </div>
      )}
      {item.url && item.url !== "#" ? (
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block rounded-lg bg-purple-600 px-3 py-2 text-xs font-bold text-white hover:bg-purple-500"
        >
          Amazonで見る
        </a>
      ) : (
        <span className="mt-4 inline-block rounded-lg border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-500">
          Amazonリンク準備中
        </span>
      )}
    </div>
  );
}


function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
        active
          ? "bg-purple-600 text-white"
          : "bg-black text-zinc-400 hover:bg-zinc-900 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function MetricLineChart({
  title,
  data,
  dataKey,
  name,
  valueSuffix = "",
  valueFormatter,
}: {
  title: string;
  data: {
    name: string;
    game: string;
    avg: number;
    peak: number;
    unique: number | null;
    comments: number;
    followers: number;
    followRate: number | null;
  }[];
  dataKey: "avg" | "peak" | "unique" | "comments" | "followers" | "followRate";
  name: string;
  valueSuffix?: string;
  valueFormatter?: (value: number) => string;
}) {
  const chartData = data.filter((item) => {
    const value = item[dataKey];
    return value !== null && value !== undefined && !Number.isNaN(Number(value));
  });

  return (
    <Panel title={title}>
      {chartData.length === 0 ? (
        <EmptyState text={`${title}を表示するには、対応するデータを入力してください。`} />
      ) : (
        <div className="h-72 min-h-[288px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" stroke="#a1a1aa" />
              <YAxis stroke="#a1a1aa" />
              <Tooltip
                formatter={(value) => {
                  const numberValue = Number(value);
                  if (Number.isNaN(numberValue)) return value;
                  return valueFormatter
                    ? valueFormatter(numberValue)
                    : `${numberValue}${valueSuffix}`;
                }}
                labelFormatter={(label, payload) => {
                  const game = payload?.[0]?.payload?.game;
                  return game ? `${label} / ${game}` : `${label}`;
                }}
                contentStyle={{
                  backgroundColor: "#09090b",
                  border: "1px solid #3f3f46",
                  borderRadius: "12px",
                  color: "#ffffff",
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                name={name}
                stroke="#a855f7"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function TextField({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-bold text-zinc-300">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  unit,
  placeholder,
  onChange,
  className = "",
}: {
  label: string;
  value: string;
  unit: string;
  placeholder: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <TextField label={label} className={className}>
      <div className="flex h-12 items-center overflow-hidden rounded-xl border border-zinc-700 bg-black focus-within:border-purple-500">
        <input
          type="number"
          step="0.1"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-full w-full bg-transparent px-3 text-sm text-white outline-none placeholder:text-zinc-500"
        />
        <span className="h-full border-l border-zinc-800 px-3 text-sm leading-[48px] text-zinc-400">
          {unit}
        </span>
      </div>
    </TextField>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="mb-4 text-xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function StatCard({
  title,
  value,
  unit,
}: {
  title: string;
  value: string;
  unit: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-3xl font-black">
        {value}
        {unit && <span className="ml-1 text-sm text-zinc-400">{unit}</span>}
      </p>
    </div>
  );
}

function RateCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-500">{title}</p>
      <p className="mt-2 text-2xl font-black text-purple-400">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{description}</p>
    </div>
  );
}

function AnalysisCard({
  icon,
  title,
  items,
}: {
  icon: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.map((item, index) => (
          <p key={index} className="text-sm leading-6 text-zinc-300">
            {item}
          </p>
        ))}
      </div>
    </div>
  );
}

function MemoAnalysis({
  keywords,
  memoCount,
}: {
  keywords: MemoKeyword[];
  memoCount: number;
}) {
  if (memoCount === 0) {
    return (
      <EmptyState text="まだ配信メモがありません。初見・常連・コメント内容・配信の雰囲気を残すと分析できます。" />
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-800 bg-black p-4">
          <p className="text-sm text-zinc-500">メモ記録数</p>
          <p className="mt-2 text-2xl font-black">{memoCount}件</p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-black p-4">
          <p className="text-sm text-zinc-500">検出ワード数</p>
          <p className="mt-2 text-2xl font-black">{keywords.length}種類</p>
        </div>
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-black p-4 md:col-span-1">
          <p className="text-sm text-zinc-500">最多ワード</p>
          <p className="mt-2 text-2xl font-black">
            {keywords[0] ? `${keywords[0].icon} ${keywords[0].label}` : "-"}
          </p>
        </div>
      </div>

      {keywords.length === 0 ? (
        <EmptyState text="メモはありますが、まだキーワードは検出されていません。初見・常連・参加型・コメントなどを書いてみましょう。" />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {keywords.map((keyword) => (
            <div key={keyword.word} className="rounded-xl border border-zinc-800 bg-black p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-zinc-200">
                  {keyword.icon} {keyword.label}
                </span>
                <span className="rounded-full bg-purple-500/10 px-3 py-1 text-sm font-bold text-purple-300">
                  {keyword.count}回
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-purple-500/30 bg-purple-500/10 p-4">
        <p className="text-sm leading-6 text-zinc-200">
          メモ分析は、あとでAIコーチ分析を入れる時の土台になります。
          数字だけでは分からない「なぜ伸びたか」「なぜコメントが来たか」を残していくのが大事です。
        </p>
      </div>
    </div>
  );
}

function MiniBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-900 p-3">
      <p className="text-zinc-500">{label}</p>
      <p className="mt-1 font-bold text-zinc-100">{value}</p>
    </div>
  );
}

function CommentLine({
  label,
  color,
  text,
}: {
  label: string;
  color: string;
  text: string;
}) {
  return (
    <p className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 leading-6 text-zinc-300">
      <span className={`mr-2 font-bold ${color}`}>{label}</span>
      {text}
    </p>
  );
}

function Th({ children }: { children: ReactNode }) {
  return <th className="whitespace-nowrap px-4 py-3 font-bold">{children}</th>;
}

function Td({ children }: { children: ReactNode }) {
  return <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{children}</td>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-sm text-zinc-500">
      {text}
    </div>
  );
}
