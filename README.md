# Taiwanese Anime Sticker Maker 🇹🇼✨

# 台灣風格動漫貼圖產生器 (Taiwanese Anime Sticker Generator)

<div align="center">
  <p><strong>結合台灣在地文化與動漫美學的 AI 貼圖生成工具，由 Google Gemini 強力驅動。</strong></p>
  <p><strong>Experience the fusion of Taiwanese culture and anime aesthetics. Powered by Google Gemini AI.</strong></p>
</div>

---

## 🌟 核心特色 (Core Features)

### 🇹🇼 繁體中文

* **Google Gemini 指令驅動**: 使用最先進的 Gemini Pro Vision 模型生成高品質圖像。
* **在地化主題 (Localized Themes)**:
  * **🇹🇼 Taiwanese (台灣味)**: 結合霓虹燈、夜市、宮廟等台灣視覺元素。
  * **🌸 Literary (文青風)**: 柔和色調、手寫質感，適合日常對話。
  * **💖 Romantic (浪漫風)**: 專為情侶設計的甜蜜互動風格。
* **一鍵生成 (One-Click Generation)**: 選擇風格 -> 選擇慣用語 -> 立即生成。
* **智慧去背 (Smart Removal)**: 針對綠幕 (Green Screen) 優化的自動去背演算法，保留細節。
* **批次製作 (Batch Mode)**: 支援一次生成 1~40 張貼圖，滿足整組貼圖包製作需求。
* **BYOK 模式**: "Bring Your Own Key"，直接在瀏覽器端輸入您的 API Key，安全且無須後端伺服器。

### 🇺🇸 English

* **Powered by Google Gemini**: Utilizes the advanced Gemini Pro Vision model for high-quality generation.
* **Localized Themes**:
  * **Taiwanese**: Vibrant neon lights, night markets, and temple aesthetics.
  * **Literary**: Soft tones and handwritten vibes, perfect for daily casual chat.
  * **Romantic**: Sweet interactions designed for couples.
* **One-Click Generation**: Select Style -> Select Phrase -> Generate Instantly.
* **Smart Background Removal**: Optimized algorithms for green screen removal that preserve fine details.
* **Batch Mode**: Generate 1 to 40 stickers at once to create full sticker packs efficiently.
* **BYOK Mode**: "Bring Your Own Key" architecture. Enter your API Key directly in the browser; no backend server required.

---

## 🚀 使用教學 (User Guide)

### 1. 設置 API Key / Setup API Key

* 首次進入時，系統會要求輸入 **Google Gemini API Key**。
* 您的 Key 僅會儲存在瀏覽器的 `localStorage` 中，不會傳送到任何第三方伺服器。
* *Enter your Google Gemini API Key on first launch. It is stored locally in your browser for security.*

### 2. 選擇主題與風格 / Phase 1 & 2: Theme & Style

* 在頂部選擇主題（如 `Taiwanese` 或 `Romantic`）。
* 選擇該主題下的具體畫風（例如 `Vibrant Neon`, `Soft Pastel` 等）。
* *Select a theme at the top, then choose a specific art style within that theme.*

### 3. 設定慣用語 / Phase 3: Phrase

* **預設詞庫**: 點擊預設的常用語（如「呷飽沒」、「剛下班」）。
* **自訂文字**: 也可以直接輸入您想要的文字。
* *Click a preset phrase (e.g., "Have you eaten?") or type your own custom text.*

### 4. 生成與下載 / Phase 4: Generate & Download

* **Batch Size**: 設定一次要生成幾張（建議測試時選 1，量產時選 8 或更多）。
* **Smart Remove BG**: 建議保持開啟，AI 會自動去除背景。
* 點擊 **Generate Stickers** 開始魔法！
* 完成後，可單獨下載每張貼圖，或點擊 **Download ZIP** 打包下載。
* *Set batch size and keep "Smart Remove BG" on. Click Generate to start. Download individual stickers or the entire ZIP pack.*

---

## 🛠️ 開發與安裝 (Development)

### 前置需求 (Prerequisites)

* Node.js (v18+)
* Gemini API Key ([Get it here](https://ai.google.dev/))

### 安裝專案 (Installation)

```bash
git clone <repository_url>
cd taiwanese-anime-sticker-maker
npm install
```

### 啟動 (Start)

```bash
npm run dev
```

Open `http://localhost:3000`

### 環境變數 (Environment Variables)

雖然支援 BYOK，開發時也可在專案根目錄建立 `.env` 檔案預先寫入 Key方便測試：
*Although BYOK is supported, you can create a `.env` file for development convenience:*

```env
VITE_GEMINI_API_KEY=your_api_key_here
```

---

## 🏗️ 技術架構 (Tech Stack)

* **Frontend**: React 19, TypeScript, Vite
* **Styling**: Tailwind CSS
* **AI Integration**: Google Generative AI SDK (@google/genai)
* **Icons**: Lucide React

---

<div align="center">
  Built with ❤️ by TingYu
</div>
