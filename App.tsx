
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Download, Plus, Sparkles, Image as ImageIcon, Key, ExternalLink, Cpu, Settings, Palette, Type, Ban, FileArchive, Layers, Info, AlertTriangle, ExternalLink as LinkIcon, Scissors, Check, X } from 'lucide-react';
import JSZip from 'jszip';
import Button from './components/Button';
import { generateSticker } from './services/geminiService';
import { COMMON_PHRASES, STICKER_STYLES, Sticker } from './types';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash-image');
  const [image, setImage] = useState<string | null>(null);
  const [selectedPhrase, setSelectedPhrase] = useState<string>('');
  const [customPhrase, setCustomPhrase] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string>(STICKER_STYLES[0].id);
  const [includeText, setIncludeText] = useState<boolean>(false);
  const [autoRemoveBg, setAutoRemoveBg] = useState<boolean>(true);
  const [batchSize, setBatchSize] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    } else {
      setShowKeyModal(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (!tempKey.trim()) {
      setError("請輸入有效的 API Key");
      return;
    }
    setApiKey(tempKey.trim());
    localStorage.setItem('gemini_api_key', tempKey.trim());
    setShowKeyModal(false);
    setError(null);
  };

  const handleClearKey = () => {
    setApiKey('');
    localStorage.removeItem('gemini_api_key');
    setTempKey('');
    setShowKeyModal(true);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModel(e.target.value);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * SMART CHROMA KEY REMOVAL
   * Optimized for #00FF00 background. 
   * Uses Flood Fill to preserve white eyes and internal details.
   */
  const smartRemoveBackground = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const width = img.width;
        const height = img.height;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const isBg = new Uint8Array(width * height);

        // 1. Detect if the background is actually green
        const corners = [[0, 0], [width - 1, 0], [0, height - 1], [width - 1, height - 1]];

        // 2. Flood Fill starting from corners
        const queue: [number, number][] = [...corners as [number, number][]];
        const visited = new Uint8Array(width * height);

        const isGreen = (r: number, g: number, b: number) => {
          // Chroma Key logic: Green channel must be dominant
          // We allow for noise: g is high, and at least 15% higher than r and b
          return g > 80 && g > r * 1.15 && g > b * 1.15;
        };

        while (queue.length > 0) {
          const [x, y] = queue.shift()!;
          const idx = y * width + x;
          if (visited[idx]) continue;
          visited[idx] = 1;

          const i = idx * 4;
          if (isGreen(data[i], data[i + 1], data[i + 2])) {
            isBg[idx] = 1;
            // Scan neighbors
            if (x > 0) queue.push([x - 1, y]);
            if (x < width - 1) queue.push([x + 1, y]);
            if (y > 0) queue.push([x, y - 1]);
            if (y < height - 1) queue.push([x, y + 1]);
          }
        }

        // 3. Dilation (Halo Cleanup)
        // We eat 1 pixel into the subject to remove the green fringe
        const expandedBg = new Uint8Array(isBg);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            if (isBg[idx] === 0) {
              // Check 4-connectivity
              if (isBg[idx - 1] || isBg[idx + 1] || isBg[idx - width] || isBg[idx + width]) {
                expandedBg[idx] = 1;
              }
            }
          }
        }

        // 4. Final Alpha Application
        for (let i = 0; i < width * height; i++) {
          if (expandedBg[i]) {
            data[i * 4 + 3] = 0;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = base64;
    });
  };

  const handleGenerate = async () => {
    if (!apiKey) {
      setShowKeyModal(true);
      return;
    }
    if (!image) {
      setError("請先上傳照片！");
      return;
    }

    const singlePhrase = customPhrase || selectedPhrase;
    if (batchSize === 1 && !singlePhrase) {
      setError("請選擇或輸入一個慣用語！");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress({ current: 0, total: batchSize });

    const style = STICKER_STYLES.find(s => s.id === selectedStyleId) || STICKER_STYLES[0];

    try {
      for (let i = 0; i < batchSize; i++) {
        let phraseToUse = '';
        if (batchSize === 1) {
          phraseToUse = singlePhrase;
        } else {
          phraseToUse = i < COMMON_PHRASES.length ? COMMON_PHRASES[i].text : COMMON_PHRASES[i % COMMON_PHRASES.length].text;
        }

        let resultImageUrl = await generateSticker(
          apiKey,
          image,
          phraseToUse,
          selectedModel,
          style.promptSnippet,
          includeText
        );

        // Apply auto background removal if selected
        if (autoRemoveBg) {
          resultImageUrl = await smartRemoveBackground(resultImageUrl);
        }

        const newSticker: Sticker = {
          id: `${Date.now()}-${i}`,
          imageUrl: resultImageUrl,
          phrase: phraseToUse,
          timestamp: Date.now()
        };

        setStickers(prev => [newSticker, ...prev]);
        setProgress(prev => ({ ...prev, current: i + 1 }));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "KEY_NOT_FOUND" || err.message?.includes("403") || err.message?.includes("401")) { // Expanded error check
        setError("API Key 無效或過期，請重新輸入。");
        setShowKeyModal(true);
      } else {
        setError(`生成失敗，錯誤訊息: ${err.message || '未知錯誤'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleIndividualBgRemoval = async (stickerId: string) => {
    const sticker = stickers.find(s => s.id === stickerId);
    if (!sticker) return;

    const transparentUrl = await smartRemoveBackground(sticker.imageUrl);
    setStickers(prev => prev.map(s => s.id === stickerId ? { ...s, imageUrl: transparentUrl } : s));
  };

  const downloadImage = (url: string, phrase: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `sticker_${phrase}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAllAsZip = async () => {
    if (stickers.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      stickers.forEach((sticker, index) => {
        const base64Data = sticker.imageUrl.split(',')[1];
        const safePhrase = sticker.phrase.replace(/[^\w\u4e00-\u9fa5]/g, '_');
        zip.file(`sticker_${index + 1}_${safePhrase}.png`, base64Data, { base64: true });
      });
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = "taiwan_stickers_pack.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error creating ZIP:", err);
      setError("打包下載失敗。");
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#D1E9E9] pb-20 relative">

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-100 p-3 rounded-full text-green-600">
                <Key size={24} />
              </div>
              <h2 className="text-2xl font-black text-gray-800">設定 API Key</h2>
            </div>

            <p className="text-gray-500 mb-6 font-medium">
              本應用程式需要 Google Gemini API Key 才能運作。您的 Key 僅會儲存在您的瀏覽器中，不會傳送到我們的伺服器。
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">API Key</label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Paste your Gemini API Key here"
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors font-mono text-sm"
                />
              </div>

              <Button onClick={handleSaveKey} className="w-full text-lg py-3 rounded-xl">
                儲存並開始使用
              </Button>

              <div className="text-center mt-4">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm font-bold hover:underline flex items-center justify-center gap-1">
                  沒有 Key 嗎？在此獲取 <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="bg-[#285E61] shadow-sm sticky top-0 z-50 border-b border-[#285E61]">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between relative">
          {/* Left: Back Home Link */}
          <div className="flex-shrink-0 z-10">
            <a href="https://tingyusdeco.com/" className="text-[#F7FAFC] font-bold text-sm hover:underline flex items-center gap-1" aria-label="Back Home">
              <LinkIcon size={18} /> <span className="hidden sm:inline">Back Home</span>
            </a>
          </div>

          {/* Center: Title */}
          <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 w-max pointer-events-none">
            <div className="bg-green-500 p-1.5 sm:p-2 rounded-xl text-white shadow-lg shadow-green-900/20">
              <Sparkles size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-lg sm:text-xl font-black text-[#F7FAFC] tracking-tight">
              台漫<span className="text-[#D1E9E9]">貼圖王</span>
            </h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 z-10">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-gray-400">
                <Cpu size={14} />
              </div>
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="pl-9 pr-8 py-2 bg-[#F7FAFC] border border-gray-300 rounded-full text-xs font-bold text-gray-700 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer max-w-[100px] sm:max-w-none truncate"
              >
                <option value="gemini-2.5-flash-image">標準模式</option>
                <option value="gemini-3-pro-image-preview">專業模式</option>
              </select>
            </div>
            <button
              onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}
              className={`p-2 rounded-full transition-all border ${apiKey ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600 animate-pulse'}`}
              title="設定 API Key"
            >
              <Key size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* 重要公告 */}
        <section className="bg-blue-50 rounded-3xl p-6 border-2 border-blue-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 p-2 rounded-xl text-white mt-1">
              <Info size={24} />
            </div>
            <div className="space-y-3">
              <h2 className="text-lg font-black text-blue-900">貼圖製作指南</h2>
              <ul className="text-sm text-blue-800 space-y-2 font-medium">
                <li>● <strong>API Key 設定</strong>：點擊右上角鑰匙圖示，輸入您的 Google Gemini API Key 即可開始使用。</li>
                <li>● <strong>上傳照片</strong>：請上傳清晰的人像照片，AI 將會以此作為角色面部特徵的參考。</li>
                <li>● <strong>風格與台詞</strong>：選擇喜歡的貼圖風格，並搭配內建台語慣用語或自訂台詞。</li>
                <li>● <strong>邊框設定</strong>：除了「寫實貼紙」風格帶白框，其餘風格均為乾淨切邊。</li>
                <li>● <strong>綠幕去背</strong>：採用智慧 Flood Fill 技術，自動移除背景並保留細節。</li>
                <li>● <strong>打包下載</strong>：生成完成後，可單張下載或將整組貼圖打包成 ZIP 檔。</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Step 1: Upload */}
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
            <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-sm font-black">STEP 1</span>
            上傳照片
          </h2>
          {!image ? (
            <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-blue-50 rounded-2xl py-12 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 transition-colors">
              <div className="bg-blue-100 p-4 rounded-full text-blue-500 mb-4 shadow-inner">
                <Upload size={40} />
              </div>
              <p className="text-gray-500 font-black">點擊或拖放照片</p>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border-2 border-gray-100">
              <img src={image} alt="Preview" className="w-full max-h-[300px] object-contain bg-slate-900" />
              <button onClick={() => setImage(null)} className="absolute top-4 right-4 bg-red-500 text-white p-3 rounded-full shadow-xl">
                <Trash2 size={20} />
              </button>
            </div>
          )}
        </section>

        {/* Step 2: Style */}
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
            <span className="bg-purple-100 text-purple-600 px-2 py-0.5 rounded text-sm font-black">STEP 2</span>
            選擇風格
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {STICKER_STYLES.map((style) => (
              <button key={style.id} onClick={() => setSelectedStyleId(style.id)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${selectedStyleId === style.id ? 'border-purple-500 bg-purple-50 text-purple-600 scale-105' : 'border-gray-50 text-gray-500'}`}>
                <div className={`p-2 rounded-full mb-1 ${selectedStyleId === style.id ? 'bg-purple-500 text-white' : 'bg-gray-100'}`}><Palette size={16} /></div>
                <span className="text-xs font-black">{style.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Step 3: Phrase */}
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
            <span className="bg-green-100 text-green-600 px-2 py-0.5 rounded text-sm font-black">STEP 3</span>
            選擇慣用語
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
            {COMMON_PHRASES.map((phrase) => (
              <button key={phrase.text} onClick={() => { setSelectedPhrase(phrase.text); setCustomPhrase(''); setBatchSize(1); }} className={`p-3 rounded-2xl border-2 transition-all text-sm font-bold ${selectedPhrase === phrase.text && batchSize === 1 ? 'border-green-500 bg-green-50 text-green-600 shadow-md' : 'border-gray-50 text-gray-500'}`}>
                {phrase.text}
              </button>
            ))}
          </div>
          <input type="text" placeholder="或是自訂台詞..." className={`w-full px-4 py-3 bg-gray-50 rounded-2xl border-2 font-bold ${customPhrase && batchSize === 1 ? 'border-green-500 bg-white shadow-lg' : 'border-transparent'}`} value={customPhrase} onChange={(e) => { setCustomPhrase(e.target.value); setSelectedPhrase(''); setBatchSize(1); }} />
        </section>

        {/* Step 4: Quantity */}
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
            <span className="bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded text-sm font-black">STEP 4</span>
            生成數量
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {[1, 8, 16, 24, 36, 40].map((num) => (
              <button key={num} onClick={() => setBatchSize(num)} className={`p-3 rounded-2xl border-2 transition-all flex flex-col items-center ${batchSize === num ? 'border-indigo-500 bg-indigo-50 text-indigo-600 scale-105 shadow-md' : 'border-gray-50 text-gray-500'}`}>
                <div className="font-black text-lg">{num}</div>
                <div className="text-[10px] opacity-60 font-bold">{num === 1 ? '單張' : '張批次'}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Step 5: Advanced Settings */}
        <section className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-700">
            <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-sm font-black">STEP 5</span>
            輸出設定
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-500 px-1">文字顯示</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setIncludeText(true)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 ${includeText ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-50 text-gray-400'}`}>
                  <Type size={20} /><span className="font-black text-sm">加上文字</span>
                </button>
                <button onClick={() => setIncludeText(false)} className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 ${!includeText ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-50 text-gray-400'}`}>
                  <Ban size={20} /><span className="font-black text-sm">不加文字</span>
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-black text-gray-500 px-1">背景處理</label>
              <div onClick={() => setAutoRemoveBg(!autoRemoveBg)} className={`p-4 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${autoRemoveBg ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-50 bg-gray-50 text-gray-400'}`}>
                <div className="flex items-center gap-3">
                  <Scissors size={20} />
                  <div>
                    <div className="font-black text-sm">智慧綠幕去背</div>
                    <div className="text-[10px] font-bold opacity-60">自動優化動漫切邊與貼紙白框</div>
                  </div>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${autoRemoveBg ? 'bg-green-500 text-white' : 'bg-gray-300 text-white'}`}>
                  {autoRemoveBg && <Check size={14} />}
                </div>
              </div>
            </div>
          </div>
        </section>

        {error && (
          <div className="bg-red-50 text-red-600 p-6 rounded-3xl border-2 border-red-100 text-center space-y-2">
            <div className="flex justify-center mb-1"><AlertTriangle size={32} /></div>
            <div className="font-black text-lg">發生錯誤</div>
            <div className="font-bold">{error}</div>
          </div>
        )}

        <div className="sticky bottom-6 flex justify-center z-40 px-4">
          <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!image || (batchSize === 1 && !selectedPhrase && !customPhrase)} className="w-full max-w-sm h-16 text-xl shadow-2xl rounded-3xl">
            {isGenerating ? `生成中 (${progress.current}/${batchSize})` : batchSize > 1 ? `啟動批次生成 (${batchSize}張)` : '生成單一貼圖'}
          </Button>
        </div>

        {stickers.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-2xl font-black text-gray-800">我的貼圖包 ({stickers.length})</h2>
              <Button variant="outline" onClick={downloadAllAsZip} isLoading={isZipping} className="px-4 py-2 text-sm border-blue-500 text-blue-600 hover:bg-blue-50">
                <FileArchive size={18} /> 打包下載 (ZIP)
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stickers.map((sticker) => (
                <div key={sticker.id} className="bg-white rounded-3xl p-3 shadow-lg border border-gray-100 group animate-in zoom-in-95 duration-300">
                  <div className="aspect-square rounded-2xl bg-gray-50 overflow-hidden relative shadow-inner" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 8 8\'%3E%3Cpath fill=\'%23e5e7eb\' d=\'M0 0h4v4H0zm4 4h4v4H4z\'/%3E%3C/svg%3E")' }}>
                    <img src={sticker.imageUrl} alt={sticker.phrase} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center backdrop-blur-sm">
                      <div className="flex gap-2">
                        <button onClick={() => downloadImage(sticker.imageUrl, sticker.phrase)} title="下載單張" className="bg-white p-3 rounded-full text-green-500 hover:scale-110 shadow-xl transition-all">
                          <Download size={20} />
                        </button>
                        <button onClick={() => handleIndividualBgRemoval(sticker.id)} title="手動去背" className="bg-white p-3 rounded-full text-blue-500 hover:scale-110 shadow-xl transition-all">
                          <Scissors size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 text-center font-black text-gray-700 tracking-wider text-sm truncate">{sticker.phrase}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {isGenerating && (
          <div className="fixed inset-0 bg-white/90 backdrop-blur-lg z-[60] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
            <div className="relative w-40 h-40 mb-8">
              <div className="absolute inset-0 border-[10px] border-green-50 rounded-full"></div>
              <div className="absolute inset-0 border-[10px] border-green-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-green-500">
                <Palette size={56} className="animate-pulse" />
              </div>
            </div>
            <h3 className="text-3xl font-black text-gray-800 mb-2">{batchSize > 1 ? `批次生成中 (${progress.current}/${batchSize})` : '正在覺醒中二魂...'}</h3>
            <p className="text-gray-500 font-bold max-w-xs text-sm">正在繪製貼圖並處理綠幕背景...</p>
            {batchSize > 1 && (
              <div className="w-full max-w-xs bg-gray-100 h-2 rounded-full mt-6 overflow-hidden">
                <div className="bg-green-500 h-full transition-all duration-500" style={{ width: `${(progress.current / batchSize) * 100}%` }}></div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-[#285E61] py-8 text-center text-[#F7FAFC]">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-sm font-bold opacity-80">
            &copy; {new Date().getFullYear()} 台漫貼圖王
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
