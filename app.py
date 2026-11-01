
from flask import Flask, jsonify, render_template
from scraper import SOURCES, fetch_threat_data

app = Flask(__name__)

# In-memory storage for scraped threats
threat_cache = []


@app.route("/")
def home():
    """Renders the ScrapeKing dashboard."""
    return render_template("index.html")


@app.route("/api/sources", methods=["GET"])
def get_sources():
    """Returns the list of monitored threat intelligence sources."""
    sources_info = [
        {"name": s["name"], "icon": s.get("icon"), "color": s.get("color")}
        for s in SOURCES
    ]
    return jsonify({"count": len(sources_info), "sources": sources_info})


@app.route("/api/threats", methods=["GET"])
def get_threats():
    """Returns the cached threats, fetching initially if empty."""
    global threat_cache
    if not threat_cache:
        threat_cache = fetch_threat_data()
    return jsonify({"count": len(threat_cache), "threats": threat_cache})


@app.route("/api/scrape", methods=["POST"])
def trigger_scrape():
    """Manually re-scrapes all feeds and refreshes cache."""
    global threat_cache
    threat_cache = fetch_threat_data()
    return jsonify(
        {
            "status": "success",
            "count": len(threat_cache),
            "threats": threat_cache,
        }
    )


if __name__ == "__main__":
    # macOS AirPlay often occupies port 5000, so port 5050 avoids conflicts
    app.run(debug=True, host="127.0.0.1", port=5050)
