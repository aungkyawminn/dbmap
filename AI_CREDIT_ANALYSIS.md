# 📊 AI Credit Valuation & Financial Analysis

## 1. Executive Summary

This document outlines the economic, financial, and infrastructural valuation of **50,000 AI Credits** in DbMap AI Studio, detailing both the end-user retail market value and the underlying cloud computation/API expense.

| Perspective | Valuation for 50,000 Credits | Unit Price (Per Credit) | Notes |
| :--- | :--- | :--- | :--- |
| **In-App Retail (Credit Boost Top-Up)** | **$1.00 USD** | $0.000020 | Based on $10.00 / 500,000 credits package |
| **In-App Retail (Pro Monthly Plan)** | **$1.45 USD** | $0.000029 | Based on $29.00 / 1,000,000 credits plan |
| **In-App Retail (Pro Annual Plan)** | **$1.21 USD** | $0.000024 | Based on $290.00 / 12,000,000 credits plan |
| **Underlying Raw API Cost (Gemini Flash)** | **~$0.015 – $0.020 USD** (1.5¢ – 2.0¢) | ~$0.00000035 | Blended rate across input & output tokens |
| **Delivered Functional Value (Engineering)** | **~$100 – $300+ in saved labor** | ~15 to 30 full schemas | Replaces hours of manual DB design & DDL drafting |

---

## 2. In-App Retail Valuation (What Users Pay)

The application maps AI credit packages to pricing tiers managed via **TallySale**:

### Option A: AI Credit Boost (One-time Top-Up)
* **Retail Pricing**: **$10.00 USD** for **500,000 credits**.
* **Formula**:  
  $$\text{Price per credit} = \frac{\$10.00}{500,000} = \$0.000020\text{ USD}$$
* **Valuation of 50,000 credits**:  
  $$50,000 \times \$0.000020 = \mathbf{\$1.00\text{ USD}}$$

### Option B: Pro Monthly Subscription
* **Retail Pricing**: **$29.00 USD / month** for **1,000,000 credits** + 20,000-character prompt capacity.
* **Formula**:  
  $$\text{Price per credit} = \frac{\$29.00}{1,000,000} = \$0.000029\text{ USD}$$
* **Valuation of 50,000 credits**:  
  $$50,000 \times \$0.000029 = \mathbf{\$1.45\text{ USD}}$$

### Option C: Pro Annual Subscription
* **Retail Pricing**: **$290.00 USD / year** for **12,000,000 credits** ($24.17/month effective).
* **Formula**:  
  $$\text{Price per credit} = \frac{\$290.00}{12,000,000} = \$0.00002417\text{ USD}$$
* **Valuation of 50,000 credits**:  
  $$50,000 \times \$0.00002417 = \mathbf{\$1.21\text{ USD}}$$

---

## 3. Underlying Raw API Cost (What It Costs You)

In `server.js`, credits are mapped **1:1 with Gemini tokens** (`totalTokens = promptTokens + completionTokens` deducted from `creditsRemaining`).

The system uses **Gemini 2.5/3.6 Flash**:
* **Input Tokens**: ~$0.075 – $0.10 per 1,000,000 tokens
* **Output Tokens**: ~$0.30 – $0.40 per 1,000,000 tokens

A typical database ERD generation produces structured JSON:
* Average prompt + system instructions: **~400 – 600 input tokens**
* Average generated schema (tables, columns, types, relationships): **~1,200 – 2,200 output tokens**
* Blended effective rate: **~$0.30 – $0.35 per 1,000,000 tokens**

### Real API Expense for 50,000 Credits:
$$\text{Cost} = 50,000 \times \left(\frac{\$0.35}{1,000,000}\right) \approx \mathbf{\$0.0175\text{ USD}}\text{ (less than 2 cents)}$$

### Gross Margin:
$$\text{Gross Margin} = \frac{\$1.00 - \$0.0175}{\$1.00} \approx \mathbf{98.25\%}$$

You sell 50,000 credits for **$1.00** while raw computation expense is **~$0.018**, providing a **~98% gross profit margin** on AI token consumption.

---

## 4. Operational & Usage Capacity (What 50,000 Credits Can Do)

| Prompt Complexity | Est. Token Consumption | Number of AI Generations with 50,000 Credits |
| :--- | :--- | :--- |
| **Small / Micro Schema** (2–4 tables, e.g. blog, auth) | ~1,000 – 1,400 tokens | **~35 to 50 generations** |
| **Medium / Typical Schema** (5–9 tables, full relations) | ~1,800 – 2,500 tokens | **~20 to 28 generations** |
| **Large Enterprise ERD** (10–18 tables, complex FKs & types) | ~3,000 – 4,200 tokens | **~12 to 16 generations** |

---

## 5. Free Tier Credit Allocation & Admin Controls

### Why 50,000 Free Credits is the Optimal Acquisition Strategy
1. **Low Marginal Cost**: Providing 50,000 credits to each free user costs you under **2 cents ($0.018)**.
2. **High Perceived Value**: Users perceive a **$1.00+ USD** gift of functional service.
3. **Sufficient Evaluation Runway**: ~20 to 25 complete schema designs gives new users ample runway to experience the core product value without friction.
4. **Natural Upgrade Trigger**: When users exhaust their 50,000 credits, they have built substantial project state and are prime candidates for the **$29/month Pro plan** or **$10 top-up**.

### Admin Control
System Administrators can configure the default free user credit allowance dynamically from the **Admin Control Center > System Config** tab:
- **Field**: `Free Tier Monthly Allowance (Credits)`
- **Default**: `50,000 credits`
- **Dynamic Propagation**: Stored in Firestore (`system/config`) and synchronized to new and resetting accounts.
