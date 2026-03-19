# KoboldCpp Setup Guide for Skales

This guide walks through connecting Skales to a local [KoboldCpp](https://github.com/LostRuins/koboldcpp) instance.

---

## Prerequisites

- Skales installed and running (see [INSTALL-MAC.md](./INSTALL-MAC.md) or [INSTALL-WINDOWS.md](./INSTALL-WINDOWS.md))
- KoboldCpp downloaded and a model loaded

---

## 1. Start KoboldCpp with the OpenAI-compatible API

KoboldCpp exposes an OpenAI-compatible endpoint on port **5001** by default. Launch it with the API server enabled:

```bash
# Basic launch (CPU)
python koboldcpp.py --model your-model.gguf --port 5001

# With GPU offload
python koboldcpp.py --model your-model.gguf --port 5001 --gpulayers 32

# Custom port example
python koboldcpp.py --model your-model.gguf --port 5002
```

The OpenAI-compatible base URL will be:

```
http://localhost:5001/v1
```

Adjust the port if you used `--port` with a different value.

---

## 2. Connect Skales to KoboldCpp

1. Open Skales and go to **Settings → AI Provider**.
2. Select **Custom (OpenAI-compatible)**.
3. Set the **Endpoint URL** to:
   ```
   http://localhost:5001/v1
   ```
4. Leave the **API Key** field blank (KoboldCpp does not require one by default).
5. Click **Test Connection**. You should see a green confirmation.

---

## 3. Model Configuration

After a successful connection, Skales will attempt to fetch the available model list. KoboldCpp reports the loaded model name via `/v1/models`.

- In **Settings → AI Provider**, select the detected model from the dropdown, or type the model name manually if it does not appear.
- KoboldCpp uses the loaded GGUF file's internal name (e.g. `"mistral-7b-instruct"`). If you are unsure, run:
  ```
  curl http://localhost:5001/v1/models
  ```
  and use the `id` field from the response.
- For best results, match the **prompt format** in KoboldCpp (`--format` flag) to the model you loaded (e.g. `--format chatml` for ChatML-based models like Mistral/Llama-3).

---

## 4. Vision Setup

KoboldCpp supports multimodal/vision models via **LLaVA** and **MiniCPM-V** (with the `--mmproj` flag).

1. Launch KoboldCpp with your multimodal model and its projection file:
   ```bash
   python koboldcpp.py \
     --model llava-v1.6-mistral-7b.gguf \
     --mmproj llava-v1.6-mistral-7b-mmproj.gguf \
     --port 5001
   ```
2. In Skales **Settings → AI Provider**, ensure the vision-capable model is selected.
3. Vision features in Skales (screenshot analysis, image upload) will automatically use the image endpoint when a `--mmproj` file is loaded.

> **Note:** Vision requires a model that was trained with image support (LLaVA, BakLLaVA, MiniCPM-V, etc.). Standard text-only GGUF models will not process images even with `--mmproj` set.

---

## 5. Text-to-Speech (TTS) Setup

KoboldCpp does not provide a TTS endpoint. To use voice output in Skales with a local KoboldCpp backend:

- **System TTS:** Skales can use the operating system's built-in speech engine. Enable it in **Settings → Voice → TTS Engine → System**.
- **OpenAI TTS:** If you have an OpenAI API key, you can configure Skales to use OpenAI for TTS while routing chat completions to KoboldCpp. Set the TTS provider separately in **Settings → Voice**.
- **Third-party local TTS:** Servers like [Piper](https://github.com/rhasspy/piper) or [Coqui TTS](https://github.com/coqui-ai/TTS) expose compatible endpoints that Skales can use for TTS independently of the LLM provider.

---

## 6. Tool Calling Toggle

Most GGUF models loaded in KoboldCpp do **not** support function/tool calling natively. Skales provides a toggle to disable tool-calling for providers that do not support it.

1. In **Settings → AI Provider**, locate the **Tool Calling** toggle.
2. **Disable** it when using KoboldCpp with standard chat models. This prevents Skales from sending `tools` / `functions` fields that KoboldCpp would reject or mishandle.
3. **Enable** it only if your model and KoboldCpp version explicitly support the OpenAI tools API (some fine-tuned models with `--format chatml` may support basic function calling).

> **Tip:** If you see errors like `"Unknown parameter: tools"` in the KoboldCpp console, the tool calling toggle is the fix.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Test Connection fails | Confirm KoboldCpp is running and the port matches. Check firewall rules. |
| No models listed | Manually type the model name in the model field. |
| Garbled or repetitive output | Set the correct prompt format in KoboldCpp (`--format`). |
| Vision not working | Ensure `--mmproj` is set and a LLaVA-compatible model is loaded. |
| Tool calling errors | Disable the Tool Calling toggle in Settings. |
| Slow responses | Increase GPU offload layers (`--gpulayers`) or reduce context size (`--contextsize`). |

---

## Example: Full Launch Command

```bash
python koboldcpp.py \
  --model mistral-7b-instruct-v0.2.Q4_K_M.gguf \
  --port 5001 \
  --gpulayers 32 \
  --format chatml \
  --contextsize 4096
```

Skales endpoint URL: `http://localhost:5001/v1`
