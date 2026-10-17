import { NextResponse } from "next/server";
import { catReply } from "@/lib/recommend";
import { STUDY_SPOTS } from "@/data/spots";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    prompt?: string;
  } | null;
  const prompt = body?.prompt?.trim();
  if (!prompt) {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const local = catReply(prompt);
    return NextResponse.json({
      source: "local",
      ...local,
      spot: STUDY_SPOTS.find((s) => s.id === local.recommendedSpotId),
    });
  }

  try {
    const catalog = STUDY_SPOTS.map((s) => ({
      id: s.id,
      name: s.name,
      noise: s.noise,
      outlets: s.outlets,
      wifi: s.wifi,
      vibe: s.vibe,
      tags: s.tags,
    }));

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `You are Catfe's cute AI cat. Recommend exactly one study spot from this catalog as JSON: {"text":"short purr-y reply","recommendedSpotId":"<id>"}. Catalog: ${JSON.stringify(catalog)}`,
          },
          { role: "user", content: prompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content;
    const parsed = content
      ? (JSON.parse(content) as {
          text?: string;
          recommendedSpotId?: string;
        })
      : null;

    if (!parsed?.recommendedSpotId || !parsed.text) {
      throw new Error("Bad model payload");
    }

    return NextResponse.json({
      source: "openai",
      text: parsed.text,
      recommendedSpotId: parsed.recommendedSpotId,
      spot: STUDY_SPOTS.find((s) => s.id === parsed.recommendedSpotId),
    });
  } catch {
    const local = catReply(prompt);
    return NextResponse.json({
      source: "local-fallback",
      ...local,
      spot: STUDY_SPOTS.find((s) => s.id === local.recommendedSpotId),
    });
  }
}
