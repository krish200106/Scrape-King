import re
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
import feedparser
from bs4 import BeautifulSoup

SOURCES = [
    {
        "name": "The Hacker News",
        "url": "https://feeds.feedburner.com/TheHackersNews",
        "icon": "fa-newspaper",
        "color": "#0ea5e9",
    },
    {
        "name": "CISA Advisories",
        "url": "https://www.cisa.gov/cybersecurity-advisories/all.xml",
        "icon": "fa-shield-halved",
        "color": "#3b82f6",
    },
    {
        "name": "BleepingComputer",
        "url": "https://www.bleepingcomputer.com/feed/",
        "icon": "fa-laptop-code",
        "color": "#f97316",
    },
    {
        "name": "SecurityWeek",
        "url": "https://www.securityweek.com/feed/",
        "icon": "fa-lock",
        "color": "#8b5cf6",
    },
    {
        "name": "Dark Reading",
        "url": "https://www.darkreading.com/rss.xml",
        "icon": "fa-book-skull",
        "color": "#ec4899",
    },
    {
        "name": "SANS ISC InfoSec",
        "url": "https://isc.sans.edu/rssfeed.xml",
        "icon": "fa-bolt",
        "color": "#eab308",
    },
    {
        "name": "Help Net Security",
        "url": "https://www.helpnetsecurity.com/feed/",
        "icon": "fa-user-shield",
        "color": "#10b981",
    },
    {
        "name": "Zero Day Initiative",
        "url": "https://www.zerodayinitiative.com/blog?format=rss",
        "icon": "fa-bug",
        "color": "#ef4444",
    },
    {
        "name": "The Register Security",
        "url": "https://www.theregister.com/security/headlines.atom",
        "icon": "fa-microchip",
        "color": "#06b6d4",
    },
]

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ScrapeKing/3.0"
}

SEVERITY_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}


def extract_cves(text):
    """Detects Common Vulnerabilities and Exposures (e.g., CVE-2024-1234)."""
    pattern = r"CVE-\d{4}-\d{4,7}"
    return sorted(list(set(re.findall(pattern, text, re.IGNORECASE))))


def assess_severity(title, summary):
    """Categorizes threat severity based on keywords."""
    combined = (title + " " + summary).lower()
    if any(
        k in combined
        for k in [
            "critical",
            "zero-day",
            "0-day",
            "remote code execution",
            "rce",
            "active exploit",
            "actively exploited",
            "emergency patch",
            "unauthenticated",
            "wormable",
        ]
    ):
        return "CRITICAL"
    elif any(
        k in combined
        for k in [
            "high",
            "privilege escalation",
            "dos",
            "denial of service",
            "ransomware",
            "data breach",
            "credential theft",
            "supply chain",
            "backdoor",
            "trojan",
            "malware",
        ]
    ):
        return "HIGH"
    elif any(
        k in combined
        for k in [
            "medium",
            "phishing",
            "bypass",
            "spoof",
            "cross-site",
            "xss",
            "csrf",
            "information disclosure",
            "leak",
        ]
    ):
        return "MEDIUM"
    return "LOW"


def _scrape_single_source(src, limit=8):
    """Fetches and parses a single RSS/Atom feed source."""
    feed_items = []
    try:
        feed = feedparser.parse(src["url"], request_headers=HEADERS)
        for entry in feed.entries[:limit]:
            title = entry.get("title", "No title").strip()
            link = entry.get("link", "#")
            published = entry.get("published") or entry.get("updated") or str(datetime.utcnow().strftime("%a, %d %b %Y %H:%M:%S UTC"))

            # Clean raw HTML out of the summary
            raw_summary = entry.get("summary", "") or entry.get("description", "")
            if "<" in raw_summary and ">" in raw_summary:
                clean_summary = BeautifulSoup(raw_summary, "html.parser").get_text().strip()
            else:
                clean_summary = raw_summary.strip()
            # Remove redundant newlines/tabs
            clean_summary = re.sub(r"\s+", " ", clean_summary)

            cves = extract_cves(title + " " + clean_summary)
            severity = assess_severity(title, clean_summary)

            feed_items.append(
                {
                    "source": src["name"],
                    "source_icon": src.get("icon", "fa-satellite-dish"),
                    "source_color": src.get("color", "#38bdf8"),
                    "title": title,
                    "summary": (
                        clean_summary[:240] + "..."
                        if len(clean_summary) > 240
                        else clean_summary
                    ),
                    "link": link,
                    "published": published,
                    "cves": cves,
                    "severity": severity,
                }
            )
    except Exception as e:
        print(f"Error scraping {src['name']}: {e}")

    return feed_items


def fetch_threat_data():
    """Concurrently scrapes external feeds across all sources and structures the findings."""
    threats = []

    with ThreadPoolExecutor(max_workers=min(len(SOURCES), 10)) as executor:
        future_to_src = {
            executor.submit(_scrape_single_source, src): src for src in SOURCES
        }
        for future in as_completed(future_to_src):
            try:
                data = future.result()
                threats.extend(data)
            except Exception as e:
                src = future_to_src[future]
                print(f"Feed worker failed for {src['name']}: {e}")

    # Sort threats by severity priority first (CRITICAL -> HIGH -> MEDIUM -> LOW)
    threats.sort(key=lambda x: SEVERITY_ORDER.get(x["severity"], 99))
    return threats
