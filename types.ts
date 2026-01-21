
export interface Sticker {
  id: string;
  imageUrl: string;
  phrase: string;
  timestamp: number;
}

export interface PhraseOption {
  text: string;
  description: string;
}

export interface StickerStyle {
  id: string;
  name: string;
  description: string;
  promptSnippet: string;
}

export const COMMON_PHRASES: PhraseOption[] = [
  { text: "歸剛欸", description: "整天都在搞這個（煩躁/搞笑）" },
  { text: "修但幾勒", description: "等一下（日文/台語諧音）" },
  { text: "我就爛", description: "自暴自棄的自信" },
  { text: "是在哈囉", description: "到底在搞什麼" },
  { text: "笑死", description: "超級好笑" },
  { text: "母湯喔", description: "不行喔、母湯（台語）" },
  { text: "真的假的", description: "驚訝、懷疑" },
  { text: "哭惹", description: "想哭、委屈" },
  { text: "水啦", description: "太棒了（台語）" },
  { text: "有料喔", description: "很有實力、內容扎實" },
  { text: "沒毛病", description: "沒問題、很完美" },
  { text: "太超過了", description: "太誇張了" },
  { text: "甘溫拿", description: "感恩啊（台語）" },
  { text: "眼神死", description: "無奈、放棄治療" },
  { text: "哩供蝦毀", description: "你說什麼（台語）" },
  { text: "爽啦", description: "心情愉悅" }
];

export const STICKER_STYLES: StickerStyle[] = [
  {
    id: 'cel-shaded',
    name: '賽璐璐動漫',
    description: '經典、乾淨、無邊框',
    promptSnippet: 'Modern high-quality Japanese "Cel-Shaded" anime art. Clean black ink lines. STRICT RULE: NO WHITE BORDER, NO OUTLINE, NO GLOW. The character must be a raw sprite with edges touching the green background directly. Render as a character asset for a video game.'
  },
  {
    id: 'chibi',
    name: 'Q版可愛',
    description: '大頭小身體，無邊框',
    promptSnippet: 'Japanese "Chibi" style. Large head, tiny body. STRICT RULE: NO WHITE BORDER, NO OUTLINE, NO OFFSET. The character edges must be clean and sharp against the green background. Render as a raw character sprite.'
  },
  {
    id: 'realistic-sticker',
    name: '寫實貼紙',
    description: '保留照片感，具備厚白邊',
    promptSnippet: 'Photorealistic high-quality style. KEEP THE ORIGINAL FACE exactly as shown. MANDATORY: Add a THICK, SOLID WHITE STICKER-STYLE OFFSET BORDER around the entire character. This is the ONLY style that should have a white border.'
  },
  {
    id: 'retro-90s',
    name: '90年代復古',
    description: '懷舊畫質，無邊框',
    promptSnippet: '1990s retro anime aesthetic. Slightly muted colors. STRICT RULE: NO WHITE BORDER, NO OUTLINE, NO WHITE RADIANCE. The character must be rendered directly onto the green background like a cell animation layer.'
  },
  {
    id: 'pop-art',
    name: '波普風',
    description: '強烈對比，無邊框',
    promptSnippet: 'Bold Pop Art style. Vibrant colors, dot patterns. STRICT RULE: NO WHITE BORDER, NO OUTLINE. The character must be a clean-cut graphic element with NO border against the green background.'
  }
];
