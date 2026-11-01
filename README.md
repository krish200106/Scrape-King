# Scrape-King
An automated Cyber Threat Intelligence (CTI) aggregation framework that ingests live security feeds, extracts CVE identifiers, and visualizes threat telemetry in real-time.

# 👑 ScapeKing: Automated Cyber Threat Intelligence Platform

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
  <img src="https://img.shields.io/badge/Flask-3.0.3-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask" />
  <img src="https://img.shields.io/badge/Chart.js-4.4.2-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white" alt="Chart.js" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License" />
</p>

> **ScapeKing** is an automated, real-time Cyber Threat Intelligence (CTI) web aggregation, indicator extraction, and visual monitoring platform[cite: 7, 11]. It concurrently ingests public vulnerability feeds across 9 verified security channels, extracts formal CVE indicators using regex, applies heuristic risk classification, and presents live triage telemetry through a glassmorphic SOC command dashboard[cite: 11, 12, 13].

---

## 📸 Dashboard Preview

| **Executive SOC Telemetry & Stacked Analytics** | **Live Threat Stream & Extracted CVEs** |
| :---: | :---: |
| *(Add your dashboard screenshot here)* | *(Add your feed cards screenshot here)* |

---

## ⚡ Key Features

* **Multi-Source Ingestion Pipeline:** Uses Python's `ThreadPoolExecutor` to concurrently harvest advisories across 9 verified intelligence feeds in under 3 seconds[cite: 11, 16, 18, 21].
* **Automated IoC (CVE) Extraction:** Deterministic regular expression parsing (`CVE-\d{4}-\d{4,7}`) captures and deduplicates official Common Vulnerabilities and Exposures tokens[cite: 11, 17].
* **Heuristic Risk Classification:** Contextual payload assessment categorizes threats into **Critical**, **High**, **Medium**, or **Low** tiers based on weaponization markers (e.g., zero-days, RCE, ransomware, privilege escalation)[cite: 11, 14, 17].
* **Stacked Multi-Source Telemetry:** Interactive Chart.js analytics that map threat severity per individual ingestion feed rather than displaying basic uniform volume bars[cite: 11, 14, 20].
* **Zero-Latency Client-Side Triage:** Instant in-memory search and multi-criteria filtering by severity tier, keywords, or feed source[cite: 12, 14, 20, 21].
* **One-Click Data Exporters:** Exports filtered intelligence streams to standard **RFC 4180-compliant CSV** or structured **JSON** for SIEM ingestion (Splunk, Elastic) and incident response logging[cite: 12, 14, 22].

---

## 📡 Monitored Intelligence Sources (9 Total)

ScapeKing aggregates feeds across official regulatory advisories, enterprise vulnerability disclosures, and incident handling hubs[cite: 13, 14]:

1. **CISA Cybersecurity Advisories** (Critical Infrastructure & Federal Alerts)[cite: 13, 16]
2. **The Hacker News** (Zero-Days, Malware & Exploits)[cite: 13, 16]
3. **Zero Day Initiative (ZDI)** (Coordinated Disclosures & Vulnerability Research)[cite: 13, 16]
4. **BleepingComputer** (Ransomware & Enterprise Breaches)[cite: 13, 16]
5. **SecurityWeek** (Enterprise Security & APT Tracking)[cite: 13, 16]
6. **Dark Reading** (Vulnerability Analysis & Cyber Defense)[cite: 13, 16]
7. **The Register Security** (Kernel Compromises & Supply-Chain Exploits)[cite: 13, 16]
8. **Help Net Security** (Management & Technical Bulletins)[cite: 13, 16]
9. **SANS ISC InfoSec** (Network Traffic Telemetry & Attack Bulletins)[cite: 13, 16]

---

## 🛠️ System Architecture

```text
+-------------------------------------------------------------------------+
|                  9 EXTERNAL THREAT INTELLIGENCE FEEDS                   |
| (CISA, The Hacker News, ZDI, BleepingComputer, SecurityWeek, etc.)      |
+-------------------------------------------------------------------------+
                                    |
                                    v [ThreadPoolExecutor]
+-------------------------------------------------------------------------+
|                     INGESTION & SANITIZATION ENGINE                     |
|           - feedparser & BeautifulSoup4 Markup Elimination              |
|           - Timestamp & Metadata Normalization                          |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    HEURISTIC EVALUATION & PARSING                       |
|           - Deterministic Regex Engine: CVE-\d{4}-\d{4,7}               |
|           - Contextual Keyword Severity Classification                  |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                       FLASK APPLICATION CONTROLLER                      |
|           - REST APIs: GET /api/threats | POST /api/scrape              |
|           - In-Memory Caching & JSON Serialization                      |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         PRESENTATION DASHBOARD                          |
|    - Glassmorphic Interface & Dual Canvas Chart.js Visual Telemetry     |
|    - Dynamic Client-Side Filtering & RFC-4180 CSV / JSON Exporters      |
+-------------------------------------------------------------------------+
