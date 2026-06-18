import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: ".env.local に OPENAI_API_KEY が設定されていません。" },
        { status: 500 }
      );
    }

    const body = await request.json();

    const { logs, gameStats, memoKeywords, stats } = body;

    if (!logs || logs.length === 0) {
      return Response.json(
        { error: "分析する配信データがありません。" },
        { status: 400 }
      );
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        {
          role: "system",
          content:
            "あなたはTwitch配信者向けの成長コーチです。数字と配信メモをもとに分析してください。",
        },
        {
          role: "user",
          content: `
配信データを分析してください。

【総合評価】
現在の状態

【強み】
3個以内

【改善点】
3個以内

【次回の配信でやること】
3個以内

データ:
${JSON.stringify(
  {
    stats,
    gameStats,
    memoKeywords,
    logs,
  },
  null,
  2
)}
`,
        },
      ],
    });

    const result =
      response.choices[0]?.message?.content ||
      "AI分析を生成できませんでした。";

    return Response.json({ result });
  } catch (error: any) {
    console.error(error);

    return Response.json(
      {
        error:
          error?.message ||
          "AI分析中にエラーが発生しました。",
      },
      { status: 500 }
    );
  }
}