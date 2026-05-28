#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "Usage: $0 <key> <value>" >&2
  exit 1
fi

key="$1"
value="$2"

root_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

files=("$root_dir/packages/uniswap/src/i18n/locales/source/en-US.json")
while IFS= read -r -d '' file; do
  files+=("$file")
done < <(find "$root_dir/packages/uniswap/src/i18n/locales/translations" -name "*.json" -type f -print0)

export LANG_KEY="$key"
export LANG_VALUE="$value"
export LANG_FILES="$(printf "%s\n" "${files[@]}")"
export TRANSLATE_API_URLS="${TRANSLATE_API_URLS:-https://libretranslate.de/translate,https://libretranslate.com/translate}"
export TRANSLATE_API_KEY="${TRANSLATE_API_KEY:-}"
export TRANSLATE_SOURCE="${TRANSLATE_SOURCE:-en}"
export TRANSLATE_DISABLE="${TRANSLATE_DISABLE:-0}"
export TRANSLATE_GOOGLE_FALLBACK="${TRANSLATE_GOOGLE_FALLBACK:-1}"
export TRANSLATE_DRY_RUN="${TRANSLATE_DRY_RUN:-0}"
export TRANSLATE_LOCALES="${TRANSLATE_LOCALES:-}"

python3 - <<'PY'
import json
import os
import re
import sys
import urllib.request
import urllib.error
import urllib.parse

key = os.environ["LANG_KEY"]
value = os.environ["LANG_VALUE"]
paths = os.environ["LANG_FILES"].split("\n")
api_urls = [u.strip() for u in os.environ.get("TRANSLATE_API_URLS", "").split(",") if u.strip()]
api_key = os.environ.get("TRANSLATE_API_KEY", "")
translate_source = os.environ.get("TRANSLATE_SOURCE", "en")
translate_disable = os.environ.get("TRANSLATE_DISABLE", "0") == "1"
google_fallback = os.environ.get("TRANSLATE_GOOGLE_FALLBACK", "1") == "1"
dry_run = os.environ.get("TRANSLATE_DRY_RUN", "0") == "1"
locales_filter_value = os.environ.get("TRANSLATE_LOCALES", "").strip()
locales_filter = None
if locales_filter_value:
    locales_filter = {l.strip() for l in locales_filter_value.split(",") if l.strip()}

key_pattern = re.compile(r'^(\s*)"([^"]+)":\s*(.*?)(,?)\s*$')
translation_cache = {}

def locale_from_path(path):
    if path.endswith("/source/en-US.json"):
        return "en-US"
    filename = os.path.basename(path)
    if filename.endswith(".json"):
        return filename[:-5]
    return "en-US"

def target_language(locale):
    overrides = {
        "zh-CN": "zh",
        "zh-TW": "zh",
        "pt-BR": "pt",
        "pt-PT": "pt",
        "es-ES": "es",
        "fil-PH": "tl",
        "sr-SP": "sr",
    }
    if locale in overrides:
        return overrides[locale]
    if "-" in locale:
        return locale.split("-")[0]
    return locale

def translate(text, locale):
    if translate_disable:
        return text
    target = target_language(locale)
    cache_key = f"{target}:{text}"
    if cache_key in translation_cache:
        return translation_cache[cache_key]
    payload = {
        "q": text,
        "source": translate_source,
        "target": target,
        "format": "text",
    }
    if api_key:
        payload["api_key"] = api_key
    data = json.dumps(payload).encode("utf-8")
    headers = {
        "Content-Type": "application/json",
        "User-Agent": "ring-i18n-script/1.0",
    }
    for api_url in api_urls:
        req = urllib.request.Request(api_url, data=data, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                body = res.read().decode("utf-8")
            result = json.loads(body)
            translated = result.get("translatedText", text)
            translation_cache[cache_key] = translated
            return translated
        except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError) as err:
            sys.stderr.write(f"Translation failed for {locale} via {api_url}: {err}\n")
            continue
    if google_fallback:
        try:
            query = urllib.parse.quote(text)
            google_url = (
                "https://translate.googleapis.com/translate_a/single"
                f"?client=gtx&sl={translate_source}&tl={target}&dt=t&q={query}"
            )
            req = urllib.request.Request(google_url, headers=headers)
            with urllib.request.urlopen(req, timeout=20) as res:
                body = res.read().decode("utf-8")
            result = json.loads(body)
            segments = result[0] if isinstance(result, list) else []
            translated = "".join(seg[0] for seg in segments if seg and len(seg) > 0)
            if translated:
                translation_cache[cache_key] = translated
                return translated
        except (urllib.error.URLError, urllib.error.HTTPError, json.JSONDecodeError, IndexError, TypeError) as err:
            sys.stderr.write(f"Translation failed for {locale} via google fallback: {err}\n")
    translation_cache[cache_key] = text
    return text

def update_file(path, file_value):
    with open(path, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()

    key_lines = []
    for idx, line in enumerate(lines):
        match = key_pattern.match(line)
        if match:
            indent, found_key, _, trailing = match.groups()
            key_lines.append(
                {
                    "idx": idx,
                    "key": found_key,
                    "indent": indent,
                    "trailing": trailing == ",",
                }
            )

    json_value = json.dumps(file_value, ensure_ascii=False)

    for entry in key_lines:
        if entry["key"] == key:
            new_line = f'{entry["indent"]}"{key}": {json_value}'
            if entry["trailing"]:
                new_line += ","
            lines[entry["idx"]] = new_line
            with open(path, "w", encoding="utf-8") as f:
                f.write("\n".join(lines) + "\n")
            return

    insert_index = None
    insert_indent = "  "
    for entry in key_lines:
        insert_indent = entry["indent"]
        if entry["key"] > key:
            insert_index = entry["idx"]
            break

    if insert_index is None:
        closing_index = None
        for i in range(len(lines) - 1, -1, -1):
            if lines[i].strip() == "}":
                closing_index = i
                break
        if closing_index is None:
            raise RuntimeError(f"Missing closing brace in {path}")

        if key_lines:
            last_entry = key_lines[-1]
            last_line = lines[last_entry["idx"]]
            if not last_entry["trailing"]:
                lines[last_entry["idx"]] = last_line + ","
        insert_index = closing_index
        new_line = f'{insert_indent}"{key}": {json_value}'
    else:
        new_line = f'{insert_indent}"{key}": {json_value},'

    lines.insert(insert_index, new_line)
    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

for path in paths:
    locale = locale_from_path(path)
    if locales_filter and locale not in locales_filter:
        continue
    file_value = value if locale == "en-US" else translate(value, locale)
    if dry_run:
        sys.stdout.write(f"{locale}: {file_value}\n")
        continue
    update_file(path, file_value)
PY
