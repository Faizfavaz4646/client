'use client';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smile, Sticker, Image as ImageIcon } from 'lucide-react';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';

// Public generic fallback key for development (replace via env later)
const gf = new GiphyFetch(process.env.NEXT_PUBLIC_GIPHY_API_KEY || 'sXpGFDGpz0Dv1V2i5sEQVjkT82S9ZInT');

interface MediaPickerPopoverProps {
  onClose: () => void;
  onEmojiSelect?: (emojiNative: string) => void;
  onStickerSelect?: (url: string) => void;
  onGifSelect?: (url: string) => void;
}

export default function MediaPickerPopover({ onClose, onEmojiSelect, onStickerSelect, onGifSelect }: MediaPickerPopoverProps) {
  const [activeTab, setActiveTab] = useState<'emoji' | 'stickers' | 'gifs'>('emoji');
  const [search, setSearch] = useState('');

  // Giphy fetch functions
  const fetchStickers = (offset: number) => {
    return search 
      ? gf.search(search, { offset, limit: 20, type: 'stickers' })
      : gf.trending({ offset, limit: 20, type: 'stickers' });
  };

  const fetchGifs = (offset: number) => {
    return search 
      ? gf.search(search, { offset, limit: 20, type: 'gifs' })
      : gf.trending({ offset, limit: 20, type: 'gifs' });
  };

  const handleGiphyClick = (gif: any, e: React.SyntheticEvent<HTMLElement, Event>) => {
    e.preventDefault();
    if (activeTab === 'stickers' && onStickerSelect) {
      onStickerSelect(gif.images.original.url);
    } else if (activeTab === 'gifs' && onGifSelect) {
      onGifSelect(gif.images.original.url);
    }
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="absolute bottom-16 right-0 w-[350px] h-[450px] bg-[#11183a]/95 backdrop-blur-xl border border-indigo-500/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-[100]"
    >
      {/* Header & Tabs */}
      <div className="flex flex-col bg-[#0b0f1f] border-b border-indigo-500/20 shrink-0">
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <h3 className="text-sm font-bold text-white px-1">Media</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex h-10">
          <button 
            onClick={() => setActiveTab('emoji')}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${activeTab === 'emoji' ? 'bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Smile className="w-4 h-4" /> Emojis
          </button>
          <button 
            onClick={() => setActiveTab('stickers')}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${activeTab === 'stickers' ? 'bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <Sticker className="w-4 h-4" /> Stickers
          </button>
          <button 
            onClick={() => setActiveTab('gifs')}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold transition-colors ${activeTab === 'gifs' ? 'bg-indigo-500/20 text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
          >
            <ImageIcon className="w-4 h-4" /> GIFs
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          
          {activeTab === 'emoji' && (
            <motion.div 
              key="emoji"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 emoji-picker-wrapper"
              style={{ paddingBottom: '0' }}
            >
              <Picker 
                data={data} 
                onEmojiSelect={(emoji: any) => {
                  if (onEmojiSelect) onEmojiSelect(emoji.native);
                }} 
                theme="dark"
                previewPosition="none"
                navPosition="bottom"
                skinTonePosition="none"
                style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
              />
              {/* Internal styling override for Emoji-Mart to blend with our deep indigo theme */}
              <style dangerouslySetInnerHTML={{__html: `
                em-emoji-picker {
                  --border-radius: 0;
                  --background: transparent;
                  --category-icon-color: #6366f1;
                  --category-icon-color-active: #818cf8;
                  --border-color: rgba(255,255,255,0.05);
                }
              `}} />
            </motion.div>
          )}

          {(activeTab === 'stickers' || activeTab === 'gifs') && (
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col bg-[#11183a]"
            >
              <div className="p-3 shrink-0 border-b border-indigo-500/20">
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${activeTab === 'stickers' ? 'Stickers' : 'GIFs'}...`}
                  className="w-full bg-[#0b0f1f] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                <Grid 
                  width={330} 
                  columns={3} 
                  fetchGifs={activeTab === 'stickers' ? fetchStickers : fetchGifs} 
                  key={search} // Remounts grid on search change
                  onGifClick={handleGiphyClick}
                  noResultsMessage="No results found."
                  hideAttribution={true}
                />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </motion.div>
  );
}
