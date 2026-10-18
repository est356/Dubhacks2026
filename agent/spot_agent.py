import os
import re
from pathlib import Path

import requests
from dotenv import load_dotenv
from google import genai
from google.genai import errors, types

load_dotenv(Path(__file__).with_name(".env"))

api_key = os.getenv("GEMINI_API_KEY")
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY")
model = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")

if not api_key:
    raise ValueError(
        "GEMINI_API_KEY not found. Check your .env file contains: GEMINI_API_KEY=..."
    )
if not supabase_url or not supabase_key:
    raise ValueError(
        "SUPABASE_URL and SUPABASE_KEY not found. Copy agent/.env.example to agent/.env."
    )

client = genai.Client(
    api_key=api_key,
    http_options=types.HttpOptions(
        timeout=30_000,
        retry_options=types.HttpRetryOptions(attempts=1),
    ),
)

PRICE_RANK = {"$": 1, "$$": 2, "$$$": 3}

TOOLS = [
    {
        "name": "search_spots",
        "description": (
            "Search Seattle study spots. Call this several times with related keywords "
            "to improve recall. For example, for 'quiet place to study' also search "
            "'library' and 'focus'. Omit keyword to filter only on structured fields."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "keyword": {
                    "type": "string",
                    "description": "Word or short phrase to match against name, address, summary, tags, and reviews. Omit for filter-only queries.",
                },
                "noise": {
                    "type": "string",
                    "enum": ["quiet", "chatter", "loud"],
                    "description": "quiet, chatter, or loud.",
                },
                "outlets": {
                    "type": "string",
                    "enum": ["every-table", "few", "none"],
                    "description": "every-table, few, or none.",
                },
                "wifi": {
                    "type": "string",
                    "enum": ["slow", "med", "fast"],
                    "description": "slow, med, or fast.",
                },
                "open_late": {
                    "type": "boolean",
                    "description": "True when the user wants a spot open past 9pm.",
                },
                "max_price": {
                    "type": "string",
                    "enum": ["$", "$$", "$$$"],
                    "description": "Most expensive price the user will accept. $ includes only free or cheap spots.",
                },
                "tag": {
                    "type": "string",
                    "description": "One tag: campus, library, cafe, cozy, focused, sunny, friendly, outlets, quiet, bookstore.",
                },
                "min_seating": {
                    "type": "integer",
                    "description": "Minimum people the spot should seat. Use 4 for a group.",
                },
                "max_seating": {
                    "type": "integer",
                    "description": "Maximum people the spot should seat. Use 2 for a solo nook.",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_spot",
        "description": "Get one spot by its exact name when the user asks about a specific cafe or library.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The spot name, such as 'Suzzallo Reading Room' or 'Analog Coffee'.",
                }
            },
            "required": ["name"],
        },
    },
]


def _headers():
    return {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
    }


def fetch_spots():
    response = requests.get(
        f"{supabase_url.rstrip('/')}/rest/v1/spots",
        headers=_headers(),
        params={
            "select": "id,name,address,place_id,noise,outlets,wifi,seating,price,price_note,hours,open_late,tags,summary,busiest_hours,avg_rating,rating_count,ratings(note,score)"
        },
        timeout=20,
    )
    response.raise_for_status()
    rows = response.json()
    if not rows and supabase_key.startswith("sb_publishable"):
        raise RuntimeError(
            "Supabase returned no spots. SUPABASE_KEY is the publishable key, "
            "and spots are only readable by a signed-in user. In agent/.env, set "
            "SUPABASE_KEY to the secret key from Project Settings → API."
        )
    spots = []
    for row in rows:
        reviews = row.pop("ratings", None) or []
        row["reviews"] = [review.get("note") for review in reviews if review.get("note")]
        row["avg_rating"] = float(row["avg_rating"]) if row.get("avg_rating") is not None else 0
        row["tags"] = row.get("tags") or []
        spots.append(row)
    return spots


def _blob(spot):
    return " ".join(
        [
            spot.get("name") or "",
            spot.get("address") or "",
            spot.get("summary") or "",
            spot.get("hours") or "",
            spot.get("noise") or "",
            spot.get("outlets") or "",
            spot.get("wifi") or "",
            " ".join(spot.get("tags") or []),
            " ".join(spot.get("reviews") or []),
        ]
    ).lower()


def _mentions(query, *phrases):
    return any(re.search(rf"\b{re.escape(phrase)}\b", query) for phrase in phrases)


def relevance(spot, query):
    """Score one spot against the user's sentence.

    The star rating is only a tiebreaker (about 3.5 to 5). Each constraint the
    user actually stated is worth 12 points, so a missed constraint always
    outranks a higher rating.
    """
    q = (query or "").lower()
    score = float(spot.get("avg_rating") or 0)
    tags = [tag.lower() for tag in spot.get("tags") or []]

    if _mentions(q, "late", "night") or "open late" in q or "past 9" in q:
        score += 12 if spot.get("open_late") is True else -12

    if _mentions(q, "cheap", "free", "inexpensive", "budget", "affordable"):
        score += {"$": 12, "$$": 0, "$$$": -12}.get(spot.get("price"), -12)
    elif _mentions(q, "expensive", "fancy", "splurge"):
        score += {"$$$": 12, "$$": 4, "$": -8}.get(spot.get("price"), 0)

    if _mentions(q, "quiet", "silent", "calm"):
        score += 12 if spot.get("noise") == "quiet" else -12
    elif _mentions(q, "loud", "lively", "bustling"):
        score += 12 if spot.get("noise") == "loud" else -12

    if _mentions(q, "outlet", "outlets", "plug", "plugs", "charger"):
        score += 12 if spot.get("outlets") == "every-table" else -8

    if _mentions(q, "wifi", "wi-fi", "internet"):
        wanted = "slow" if _mentions(q, "slow") else "fast"
        score += 12 if spot.get("wifi") == wanted else -8

    if _mentions(q, "library"):
        score += 12 if "library" in tags else -12
    if _mentions(q, "cafe", "coffee", "food", "eat", "snack"):
        score += 8 if "cafe" in tags else -8

    if _mentions(q, "campus", "uw"):
        score += 8 if "campus" in tags else -4

    for tag in ("cozy", "sunny", "friendly", "focused"):
        if _mentions(q, tag):
            score += 8 if tag in tags else -4

    seating = spot.get("seating") or 0
    if _mentions(q, "solo", "alone", "myself"):
        score += 8 if seating <= 2 else -6
    if _mentions(q, "group", "friends", "team"):
        score += 8 if seating >= 4 else -6

    return round(score, 2)


def _score(spot, keyword):
    score = spot.get("avg_rating") or 0
    if not keyword:
        return score
    text = keyword.lower().strip()
    name = (spot.get("name") or "").lower()
    if text == name:
        score += 8
    elif text in name:
        score += 5
    if text in _blob(spot):
        score += 2
    for field in ("noise", "outlets", "wifi"):
        if text == (spot.get(field) or "").lower():
            score += 3
    if text in [tag.lower() for tag in spot.get("tags") or []]:
        score += 3
    return score


def search_spots(
    keyword=None,
    noise=None,
    outlets=None,
    wifi=None,
    open_late=None,
    max_price=None,
    tag=None,
    min_seating=None,
    max_seating=None,
):
    matches = []
    price_cap = PRICE_RANK.get(max_price)
    for spot in fetch_spots():
        if noise and spot.get("noise") != noise:
            continue
        if outlets and spot.get("outlets") != outlets:
            continue
        if wifi and spot.get("wifi") != wifi:
            continue
        if open_late is True and spot.get("open_late") is not True:
            continue
        if price_cap is not None and PRICE_RANK.get(spot.get("price"), 99) > price_cap:
            continue
        if tag and tag.lower() not in [item.lower() for item in spot.get("tags") or []]:
            continue
        if min_seating is not None and (spot.get("seating") or 0) < min_seating:
            continue
        if max_seating is not None and (spot.get("seating") or 0) > max_seating:
            continue
        if keyword and keyword.lower().strip() not in _blob(spot) and keyword.lower().strip() not in (spot.get("name") or "").lower():
            continue
        ranked = dict(spot)
        ranked["relevanceScore"] = _score(spot, keyword)
        matches.append(ranked)
    return sorted(matches, key=lambda spot: spot["relevanceScore"], reverse=True)


def get_spot(name):
    wanted = (name or "").lower().strip()
    found = []
    for spot in fetch_spots():
        spot_name = (spot.get("name") or "").lower()
        if wanted == spot_name or wanted in spot_name or spot_name in wanted:
            ranked = dict(spot)
            ranked["relevanceScore"] = _score(spot, name) + 1
            found.append(ranked)
    return sorted(found, key=lambda spot: spot["relevanceScore"], reverse=True)


def handle_tool_call(tool_name, tool_input):
    if tool_name == "search_spots":
        return search_spots(
            keyword=tool_input.get("keyword"),
            noise=tool_input.get("noise"),
            outlets=tool_input.get("outlets"),
            wifi=tool_input.get("wifi"),
            open_late=tool_input.get("open_late"),
            max_price=tool_input.get("max_price"),
            tag=tool_input.get("tag"),
            min_seating=tool_input.get("min_seating"),
            max_seating=tool_input.get("max_seating"),
        )
    if tool_name == "get_spot":
        return get_spot(tool_input.get("name"))
    return []


def rank_spots(spots, user_query):
    ranked = []
    for spot in spots:
        chosen = dict(spot)
        chosen["relevanceScore"] = relevance(chosen, user_query)
        ranked.append(chosen)
    return sorted(ranked, key=lambda spot: spot["relevanceScore"], reverse=True)


def local_search(user_query: str) -> list[dict]:
    """Rank every spot from the database without calling Gemini."""
    return rank_spots(fetch_spots(), user_query)


def ai_search(user_query: str) -> list[dict]:
    """Take a natural language query and return spots, best match first."""
    system_prompt = (
        "You are a Seattle study-spot search assistant. Use the search_spots tool to find "
        "the best cafe or library in the database. Prefer one or two calls that set the "
        "structured filters for what the user asked: noise, outlets, wifi, open_late, "
        "max_price, tag, min_seating, max_seating. "
        "For 'opens late' set open_late true. For 'cheap' or 'free' set max_price to '$'. "
        "For food or coffee set tag to 'cafe'. Do not add extra keyword searches for "
        "unrelated words. "
        "If they name a spot, call get_spot with that exact name. "
        "Spots have fields: name, address, place_id, noise (quiet|chatter|loud), "
        "outlets (every-table|few|none), wifi (slow|med|fast), seating, price, hours, "
        "open_late, tags, summary, busiest_hours, avg_rating, rating_count, reviews, relevanceScore. "
        "Do not invent a spot."
    )
    tool = types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name=item["name"],
                description=item["description"],
                parameters_json_schema=item["input_schema"],
            )
            for item in TOOLS
        ]
    )
    config = types.GenerateContentConfig(
        tools=[tool],
        system_instruction=system_prompt,
    )
    contents = [
        types.Content(role="user", parts=[types.Part.from_text(text=user_query)])
    ]
    seen_ids = {}

    for _ in range(2):
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config,
            )
        except errors.APIError as error:
            print(f"Gemini unavailable ({error.code}). Ranking spots locally.")
            return local_search(user_query)
        calls = response.function_calls or []
        if not calls:
            break

        response_parts = []
        for call in calls:
            arguments = dict(call.args) if call.args else {}
            result = handle_tool_call(call.name, arguments)
            for spot in result:
                previous = seen_ids.get(spot["id"])
                if previous is None or spot.get("relevanceScore", 0) > previous.get("relevanceScore", 0):
                    seen_ids[spot["id"]] = spot
            response_parts.append(
                types.Part.from_function_response(
                    name=call.name,
                    response={"spots": result},
                )
            )

        contents.append(response.candidates[0].content)
        contents.append(types.Content(role="user", parts=response_parts))

    if not seen_ids:
        return local_search(user_query)
    return rank_spots(seen_ids.values(), user_query)


if __name__ == "__main__":
    query = input("Find a study spot: ")
    results = ai_search(query)
    if not results:
        print("No spots found.")
    else:
        best = results[0]
        print(f"\nBest match: {best['name']}  (relevance {best.get('relevanceScore')})")
        print(f"  {best.get('address')}")
        print(
            f"  noise {best.get('noise')}  |  outlets {best.get('outlets')}  |  wifi {best.get('wifi')}"
        )
        print(
            f"  {best.get('hours')}  |  {best.get('price')}  |  rating {best.get('avg_rating')}"
        )
        if best.get("summary"):
            print(f"  {best['summary']}")
        if len(results) > 1:
            print("\nAlso considered:")
            for spot in results[1:4]:
                print(f"  {spot['name']} (relevance {spot.get('relevanceScore')}, rating {spot.get('avg_rating')})")
