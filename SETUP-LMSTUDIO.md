# LM Studio Setup Guide

*v0.0 · 23 March 2026 22:00 SAST*

Run Skales with a fully local LM Studio model. No API key, no internet, no cost.

---

## Prerequisites

| Requirement | Details |
|---|---|
| **LM Studio** | [Download at lmstudio.ai](https://lmstudio.ai) — free |
| **Skales** | v5.0.0 or later |

---

## Step 1 — Download and Install LM Studio

1. Go to [lmstudio.ai](https://lmstudio.ai) and download the installer for your OS
2. Run the installer and open LM Studio

---

## Step 2 — Download a Model

1. In LM Studio, click the **Search** tab (magnifying glass icon in the left sidebar)
2. Search for a model — recommended options:

| Model | Best For | Minimum RAM |
|---|---|---|
| **Llama 3.1 8B Instruct** | General chat and tasks | 16 GB |
| **Mistral 7B Instruct** | Fast responses, lower resource usage | 8 GB |

3. Click **Download** next to your chosen model and wait for it to complete

---

## Step 3 — Start the Local Server

1. Click the **Local Server** tab (the `<->` icon in the left sidebar)
2. Select your downloaded model from the dropdown at the top
3. Click **Start Server**

The status bar will confirm:

```
Running on http://127.0.0.1:1234
```

> **Note:** Keep LM Studio open and the server running whenever you use it with Skales.

---

## Step 4 — Configure Skales

1. Open Skales → click **Settings** in the left sidebar
2. Click the **AI Providers** tab at the top
3. Scroll down to the **Custom (OpenAI-compatible)** section
4. Fill in the fields:

| Field | Value |
|---|---|
| **Endpoint URL** | `http://127.0.0.1:1234/v1` |
| **API Key** | Leave empty — it is optional |

> **Why 127.0.0.1 and not localhost?** On some systems, `localhost` resolves over IPv6 and causes a connection failure. `127.0.0.1` forces IPv4 and is always reliable.

---

## Step 5 — Fetch Models

1. Still in the **Custom (OpenAI-compatible)** section
2. Click **Fetch Models** on the right
3. Skales queries your LM Studio server and populates the model list
4. Select your model from the dropdown that appears

---

## Step 6 — Enable Tool Calling (Optional)

In the same section, you will see an **Enable tool calling** toggle.

- Turn it **ON** if your model supports function calling (Llama 3.1 8B Instruct and Mistral 7B Instruct both support it)
- Leave it **OFF** if you are using a smaller or older model — enabling it on unsupported models will cause broken or unpredictable responses

---

## Step 7 — Save and Activate

1. Click **Save Settings**
2. Click **Set Active** on the Custom (OpenAI-compatible) card to make it your active provider
3. The top-left connection indicator in Skales will update to confirm the active provider

---

## Step 8 — Start Chatting

1. Click **Chat** in the left sidebar
2. Start a new conversation — Skales is now running entirely on your local LM Studio model

---

## Troubleshooting

### Connection Refused

1. Open LM Studio
2. Click the **Local Server** tab
3. Confirm the status bar shows `Running on http://127.0.0.1:1234`
4. If it shows Stopped, select a model and click **Start Server**
5. Go back to Skales → **Settings → AI Providers → Custom (OpenAI-compatible)**
6. Confirm the Endpoint URL is `http://127.0.0.1:1234/v1`
7. Click **Fetch Models** again

### Fetch Models Returns Empty List

1. Open LM Studio → **Local Server** tab
2. Confirm a model is selected in the dropdown at the top of the panel
3. If no model is loaded, select one and click **Start Server**
4. Go back to Skales and click **Fetch Models** again

### Broken or Incoherent Responses After Enabling Tool Calling

1. Go to **Settings → AI Providers → Custom (OpenAI-compatible)**
2. Toggle **Enable tool calling** OFF
3. Click **Save Settings**
4. If you want tool calling, switch to a model that supports function calling such as Llama 3.1 8B Instruct

### Port Conflict — LM Studio Will Not Start the Server

1. Another application may already be using port 1234
2. In LM Studio → **Local Server** tab → **Server Settings**, change the port (e.g. to 1235)
3. Update the Endpoint URL in Skales to match: `http://127.0.0.1:1235/v1`
4. Click **Save Settings** and **Fetch Models** again

### Windows Firewall Blocks the Connection

1. When LM Studio starts its server for the first time, Windows Firewall may show a security prompt
2. Click **Allow access**
3. If you missed the prompt, go to Windows Defender Firewall → Allow an app through firewall → find LM Studio and enable it

### Slow Responses

1. Open LM Studio → **Local Server** tab → **Server Settings**
2. Reduce the **Context Length** value (try 2048 if it is set higher)
3. Alternatively switch to Mistral 7B which is faster on lower-end hardware
4. Restart the server after making changes

---

## Notes

- LM Studio exposes an OpenAI-compatible API. This is why Skales connects to it via the **Custom (OpenAI-compatible)** provider option.
- All inference runs entirely on your machine. No data is sent anywhere.
- Works fully offline once your model is downloaded.

---

**Related:** [Ollama Setup](https://docs.skales.app) · [skales.app](https://skales.app)
