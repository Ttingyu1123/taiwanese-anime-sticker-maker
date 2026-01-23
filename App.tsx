
import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Trash2, Download, Plus, Sparkles, Image as ImageIcon, Key, ExternalLink, Cpu, Settings, Palette, Type, Ban, FileArchive, Layers, Info, AlertTriangle, ExternalLink as LinkIcon, Scissors, Check, X, RefreshCw, Wand2, Star, ChevronRight, ShieldCheck, Ruler, Move } from 'lucide-react';
import JSZip from 'jszip';
import Button from './components/Button';
import { generateSticker } from './services/geminiService';
import { COMMON_PHRASES, STICKER_STYLES, Sticker } from './types';

const Stepper = ({ label, value, min, max, onChange }: { label: string, value: number, min: number, max: number, onChange: (val: number) => void }) => (
  <div className="space-y-1">
    <label className="text-[10px] font-bold text-[#9A8C98] uppercase tracking-wider">{label}</label>
    <div className="flex items-center bg-[#F2EFE9] border border-[#E6E2DE] rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => onChange(Math.max(min, value - 1))}
        className="p-3 text-[#9A8C98] hover:bg-[#E6E2DE] active:bg-[#D8D4CF] transition-colors"
        disabled={value <= min}
      >
        <span className="text-sm font-bold">-</span>
      </button>
      <input
        type="number"
        value={value}
        readOnly
        className="w-full py-2 text-center bg-transparent font-bold text-sm outline-none appearance-none text-[#5E503F]"
      />
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="p-3 text-[#5E503F] hover:bg-[#E6E2DE] active:bg-[#D8D4CF] transition-colors"
        disabled={value >= max}
      >
        <span className="text-sm font-bold">+</span>
      </button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');

  const [selectedModel, setSelectedModel] = useState<string>('gemini-3-pro-image-preview');
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
  const [isDragging, setIsDragging] = useState(false);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
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
        const expandedBg = new Uint8Array(isBg);
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            if (isBg[idx] === 0) {
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
      if (err.message === "KEY_NOT_FOUND" || err.message?.includes("403") || err.message?.includes("401")) {
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
    <div className="min-h-screen pb-20 select-none bg-[#FAF7F5] font-sans text-[#5E503F]">

      {/* API Key Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white ring-1 ring-[#E6E2DE]">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-[#B5838D] p-3 rounded-2xl text-white shadow-lg shadow-[#B5838D]/20">
                <Key size={24} />
              </div>
              <h2 className="text-2xl font-black text-[#6D6875]">設定 API Key</h2>
            </div>
            <p className="text-[#9A8C98] mb-6 font-bold text-sm leading-relaxed">
              本應用程式需要 Google Gemini API Key。Key 僅儲存於瀏覽器，絕不傳送至伺服器。
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-[#9A8C98] uppercase tracking-wider mb-2">API Key</label>
                <input
                  type="password"
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  placeholder="Paste Gemini API Key here"
                  className="w-full px-4 py-3 bg-[#F2EFE9] border border-[#E6E2DE] rounded-xl focus:border-[#B5838D] focus:ring-2 focus:ring-[#B5838D]/20 focus:outline-none transition-all font-mono text-sm text-[#5E503F]"
                />
              </div>
              <Button onClick={handleSaveKey} className="w-full text-lg py-3 rounded-2xl shadow-lg shadow-[#B5838D]/20">
                儲存並開始
              </Button>
              <div className="text-center mt-4">
                <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[#B5838D] text-xs font-bold hover:underline flex items-center justify-center gap-1">
                  沒有 Key 嗎？在此獲取 <ExternalLink size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="glass-card border-b border-[#E6E2DE]/50 sticky top-0 z-50 px-6 py-4 shadow-sm bg-white/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#B5838D] p-2.5 rounded-2xl text-white shadow-lg shadow-[#B5838D]/20"><Sparkles size={20} /></div>
            <div>
              <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[#B5838D] to-[#6D6875] tracking-tight leading-none">台漫貼圖王</h1>
              <span className="text-[9px] font-bold text-[#9A8C98] uppercase tracking-[0.2em]">Taiwanese Anime Sticker</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-4">
              <a href="https://tingyusdeco.com/" className="text-[10px] font-bold text-[#9A8C98] hover:text-[#B5838D] flex items-center gap-1 transition-colors">
                <LinkIcon size={12} /> Back Home
              </a>
            </div>
            <div className="relative group">
              <select
                value={selectedModel}
                onChange={handleModelChange}
                className="pl-3 pr-8 py-2 bg-[#F2EFE9] border border-[#E6E2DE] hover:border-[#B5838D]/30 rounded-xl text-[10px] font-bold text-[#6D6875] appearance-none focus:outline-none cursor-pointer transition-all shadow-sm"
              >
                <option value="gemini-3-pro-image-preview">Nanobanana Pro (Image Gen)</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9A8C98] pointer-events-none"><Cpu size={12} /></div>
            </div>
            <button
              onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}
              className={`p-2 rounded-xl transition-all border ${apiKey ? 'bg-[#F2EFE9] border-[#E6E2DE] text-[#B5838D]' : 'bg-red-50 border-red-200 text-red-500 animate-pulse'}`}
            >
              <Key size={16} />
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 mt-8 space-y-8">

        {/* Info Card */}
        <section className="bg-white rounded-[2rem] border border-[#E6E2DE] shadow-sm p-6 flex flex-col sm:flex-row gap-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#FAF7F5] rounded-full opacity-50 pointer-events-none" />
          <div className="bg-[#E5989B] p-4 rounded-2xl text-white shadow-lg shadow-[#E5989B]/20 flex items-center justify-center h-fit z-10">
            <Info size={24} />
          </div>
          <div className="space-y-2 z-10">
            <h2 className="text-sm font-black text-[#6D6875] uppercase tracking-wider">貼圖製作指南</h2>
            <p className="text-xs font-bold text-[#9A8C98] leading-relaxed max-w-2xl">
              歡迎使用台漫貼圖王！請確認已設定 <span className="text-[#B5838D]">API Key</span>。上傳清晰人像，選擇喜愛的風格與台詞，AI 將為您生成去背完美的 LINE/Telegram 貼圖。支援批次生成與 ZIP 打包。
            </p>
          </div>
        </section>

        {/* Upload Section */}
        <section className="bg-white rounded-[2rem] border border-[#E6E2DE] shadow-sm p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-black flex items-center gap-2 text-[#6D6875] uppercase tracking-wider"><ImageIcon size={18} className="text-[#B5838D]" /> 階段一：上傳照片</h2>
            {image && <button onClick={() => setImage(null)} className="text-[10px] font-bold text-red-400 hover:text-red-500 flex items-center gap-1"><Trash2 size={12} /> 移除重選</button>}
          </div>

          {!image ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group border-4 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 min-h-[300px] ${isDragging ? 'drag-active border-[#B5838D] bg-[#B5838D]/5' : 'border-[#E6E2DE] bg-[#FAF7F5] hover:border-[#B5838D]/30 hover:bg-[#F2EFE9]'}`}
            >
              <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
              <div className="bg-white p-6 rounded-full group-hover:scale-110 transition-transform duration-500 shadow-sm border border-[#E6E2DE] text-[#B5838D] mb-6">
                <Upload size={32} />
              </div>
              <h3 className="text-lg font-black text-[#6D6875] tracking-tight">點擊或拖曳照片至此</h3>
              <p className="mt-2 text-[#9A8C98] font-bold text-xs tracking-wide">支援 JPG, PNG, WebP</p>
            </div>
          ) : (
            <div className="relative rounded-[2rem] overflow-hidden border border-[#E6E2DE] bg-[#FAF7F5] shadow-inner max-h-[500px] flex items-center justify-center p-4">
              <img src={image} alt="Preview" className="max-w-full max-h-full object-contain rounded-xl drop-shadow-xl" />
            </div>
          )}
        </section>

        {/* Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Style Selection */}
          <section className="bg-white rounded-[2rem] border border-[#E6E2DE] shadow-sm p-8 space-y-6">
            <h2 className="text-sm font-black flex items-center gap-2 text-[#6D6875] uppercase tracking-wider"><Palette size={18} className="text-[#B5838D]" /> 階段二：風格選擇</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {STICKER_STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyleId(style.id)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 text-center group ${selectedStyleId === style.id ? 'bg-[#FAF7F5] border-[#B5838D] shadow-inner' : 'bg-white border-[#E6E2DE] hover:border-[#B5838D]/30'}`}
                >
                  <div className={`p-2 rounded-full transition-colors ${selectedStyleId === style.id ? 'bg-[#B5838D] text-white shadow-sm' : 'bg-[#F2EFE9] text-[#9A8C98]'}`}>
                    <Palette size={16} />
                  </div>
                  <span className={`text-xs font-black ${selectedStyleId === style.id ? 'text-[#B5838D]' : 'text-[#6D6875]'}`}>{style.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Phrase Selection */}
          <section className="bg-white rounded-[2rem] border border-[#E6E2DE] shadow-sm p-8 space-y-6">
            <h2 className="text-sm font-black flex items-center gap-2 text-[#6D6875] uppercase tracking-wider"><Type size={18} className="text-[#B5838D]" /> 階段三：慣用語</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_PHRASES.map((phrase) => (
                <button
                  key={phrase.text}
                  onClick={() => { setSelectedPhrase(phrase.text); setCustomPhrase(''); setBatchSize(1); }}
                  className={`py-2 px-3 rounded-xl border text-[10px] font-bold transition-all ${selectedPhrase === phrase.text && batchSize === 1 ? 'bg-[#E5989B] text-white border-[#E5989B] shadow-md' : 'bg-white text-[#6D6875] border-[#E6E2DE] hover:border-[#E5989B]/50'}`}
                >
                  {phrase.text}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="或是自訂台詞..."
              value={customPhrase}
              onChange={(e) => { setCustomPhrase(e.target.value); setSelectedPhrase(''); setBatchSize(1); }}
              className="w-full px-4 py-3 bg-[#F2EFE9] border border-[#E6E2DE] rounded-2xl font-bold text-xs outline-none focus:border-[#B5838D] focus:ring-2 focus:ring-[#B5838D]/10 text-[#5E503F] shadow-inner placeholder-[#9A8C98]"
            />
          </section>
        </div>

        {/* Generate Options */}
        <section className="bg-white rounded-[2rem] border border-[#E6E2DE] shadow-sm p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black flex items-center gap-2 text-[#6D6875] uppercase tracking-wider"><Settings size={18} className="text-[#B5838D]" /> 階段四：生成設定</h2>
            <span className="text-[9px] font-bold bg-[#FAF7F5] px-3 py-1 rounded-full text-[#B5838D] border border-[#E6E2DE]">{batchSize} 張貼圖</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#9A8C98] uppercase tracking-wider">生成數量 (Batch Size)</label>
              <div className="flex flex-wrap gap-2">
                {[1, 8, 16, 24, 40].map((num) => (
                  <button
                    key={num}
                    onClick={() => setBatchSize(num)}
                    className={`w-10 h-10 rounded-xl font-black text-xs border transition-all flex items-center justify-center ${batchSize === num ? 'bg-[#6D6875] text-white border-[#6D6875] shadow-lg' : 'bg-white border-[#E6E2DE] text-[#9A8C98] hover:border-[#6D6875]/50'}`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#9A8C98] uppercase tracking-wider">文字顯示</label>
              <div className="flex bg-[#F2EFE9] p-1 rounded-xl border border-[#E6E2DE] w-fit">
                <button onClick={() => setIncludeText(true)} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${includeText ? 'bg-white shadow-sm text-[#B5838D]' : 'text-[#9A8C98]'}`}>有文字</button>
                <button onClick={() => setIncludeText(false)} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${!includeText ? 'bg-white shadow-sm text-[#B5838D]' : 'text-[#9A8C98]'}`}>無文字</button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-bold text-[#9A8C98] uppercase tracking-wider">背景處理</label>
              <div onClick={() => setAutoRemoveBg(!autoRemoveBg)} className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${autoRemoveBg ? 'bg-[#F9F8F6] border-[#B5838D]/30 shadow-sm' : 'bg-white border-[#E6E2DE]'}`}>
                <div className="flex items-center gap-3">
                  <Scissors size={16} className={autoRemoveBg ? 'text-[#B5838D]' : 'text-[#C5C6C7]'} />
                  <span className="text-xs font-bold text-[#6D6875]">智慧去背</span>
                </div>
                <div className={`w-8 h-5 rounded-full relative transition-colors ${autoRemoveBg ? 'bg-[#B5838D]' : 'bg-[#E6E2DE]'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all shadow-sm ${autoRemoveBg ? 'right-1' : 'left-1'}`} />
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle size={18} />
              <span className="text-xs font-bold">{error}</span>
            </div>
          )}

          <Button onClick={handleGenerate} isLoading={isGenerating} disabled={!image || (batchSize === 1 && !selectedPhrase && !customPhrase)} className="w-full text-lg h-16 shadow-xl shadow-[#B5838D]/20">
            <Wand2 size={24} /> {isGenerating ? `生成中...` : '立即生成'}
          </Button>
        </section>

        {/* Results Gallery */}
        {stickers.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black flex items-center gap-2 text-[#6D6875] uppercase tracking-wider"><Star size={18} className="text-[#E5989B]" /> 生成結果 ({stickers.length})</h2>
              <button onClick={downloadAllAsZip} disabled={isZipping} className="bg-[#FAF7F5] hover:bg-[#F2EFE9] text-[#6D6875] border border-[#E6E2DE] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all">
                <FileArchive size={14} /> 打包下載
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stickers.map((sticker) => (
                <div key={sticker.id} className="bg-white rounded-3xl p-3 shadow-sm border border-[#E6E2DE] group hover:shadow-md transition-all animate-in zoom-in-95 duration-300">
                  <div className="aspect-square rounded-2xl bg-[#FAF7F5] overflow-hidden relative border border-[#E6E2DE]/50" style={{ backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
                    <img src={sticker.imageUrl} alt={sticker.phrase} className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 items-center justify-center backdrop-blur-sm">
                      <button onClick={() => downloadImage(sticker.imageUrl, sticker.phrase)} className="bg-white p-2.5 rounded-full text-[#B5838D] shadow-lg hover:scale-110 transition-transform"><Download size={18} /></button>
                      <button onClick={() => handleIndividualBgRemoval(sticker.id)} className="bg-white p-2.5 rounded-full text-[#6D6875] shadow-lg hover:scale-110 transition-transform"><Scissors size={18} /></button>
                    </div>
                  </div>
                  <div className="mt-3 text-center font-black text-[#5E503F] tracking-wider text-xs truncate opacity-80">{sticker.phrase}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="mt-20 py-8 border-t border-[#E6E2DE] text-center bg-white/50 backdrop-blur-sm">
        <p className="text-[9px] text-[#9A8C98] font-bold uppercase tracking-[0.2em]">&copy; {new Date().getFullYear()} StickerMaster AI</p>
      </footer>

      {/* Loading Overlay */}
      {isGenerating && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-lg z-[60] flex flex-col items-center justify-center p-6 text-center animate-in fade-in">
          <div className="relative w-24 h-24 mb-6">
            <div className="absolute inset-0 border-4 border-[#F2EFE9] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-[#B5838D] rounded-full border-t-transparent animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center text-[#B5838D]">
              <Sparkles size={32} className="animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-black text-[#6D6875] mb-2">{batchSize > 1 ? `批次生成中 (${progress.current}/${batchSize})` : 'AI 繪製中...'}</h3>
          <p className="text-[#9A8C98] font-bold text-xs tracking-wide">正在施展綠幕魔法與去背工藝</p>
          {batchSize > 1 && (
            <div className="w-64 bg-[#F2EFE9] h-1.5 rounded-full mt-6 overflow-hidden">
              <div className="bg-[#B5838D] h-full transition-all duration-300" style={{ width: `${(progress.current / batchSize) * 100}%` }}></div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
