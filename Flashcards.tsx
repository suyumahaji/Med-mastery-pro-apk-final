import React, { useState, useEffect } from 'react';
import { FLASHCARD_DATA } from './constants.tsx';
import { Flashcard } from './types.ts';

const Flashcards: React.FC = () => {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const savedCards = localStorage.getItem('med_mastery_flashcards');
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    } else {
      setCards(FLASHCARD_DATA.map(c => ({
        ...c,
        nextReview: Date.now(),
        interval: 0,
        repetition: 0,
        efactor: 2.5
      })));
    }
  }, []);

  const currentCards = cards.filter(c => !c.nextReview || c.nextReview <= Date.now());
  const card = currentCards[index] || cards[0];

  const updateSRS = (quality: number) => {
    const updatedCards = [...cards];
    const cardIndex = updatedCards.findIndex(c => c.id === card.id);
    const target = updatedCards[cardIndex];

    // SM-2 Algorithm
    let interval = target.interval ?? 0;
    let repetition = target.repetition ?? 0;
    let efactor = target.efactor ?? 2.5;

    if (quality >= 3) {
      if (repetition === 0) {
        interval = 1;
      } else if (repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * efactor);
      }
      repetition += 1;
    } else {
      repetition = 0;
      interval = 1;
    }

    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) efactor = 1.3;

    target.interval = interval;
    target.repetition = repetition;
    target.efactor = efactor;
    target.nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    setCards(updatedCards);
    localStorage.setItem('med_mastery_flashcards', JSON.stringify(updatedCards));
    
    setFlipped(false);
    setTimeout(() => {
      if (index >= currentCards.length - 1) {
        setIndex(0);
      } else {
        setIndex(index + 1);
      }
    }, 150);
  };

  if (!card) return <div className="p-8 text-center font-black text-slate-400">All caught up! Check back later.</div>;

  return (
    <div className="p-8 h-full flex flex-col items-center bg-slate-50 overflow-y-auto custom-scrollbar">
      <header className="w-full mb-12 text-center">
        <h2 className="text-3xl font-black text-slate-900">Study Decks</h2>
        <p className="text-slate-500 font-medium">Master high-yield scores, mnemonics, and anatomy</p>
        <p className="text-[10px] font-black text-blue-500 uppercase mt-2">Due Today: {currentCards.length}</p>
      </header>

      <div className="w-full max-w-xl perspective-1000 h-[380px]">
        <div 
          onClick={() => setFlipped(!flipped)}
          className={`relative w-full h-full transition-all duration-500 transform-style-preserve-3d cursor-pointer ${flipped ? 'rotate-y-180' : ''}`}
        >
          {/* Front */}
          <div className="absolute inset-0 bg-white rounded-[3rem] border-2 border-slate-100 shadow-2xl flex flex-col items-center justify-center p-12 backface-hidden">
            <span className="absolute top-8 left-8 text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase tracking-[0.2em] border border-blue-100">
              {card.category}
            </span>
            <p className="text-2xl font-black text-slate-800 text-center leading-relaxed">
              {card.front}
            </p>
            <div className="absolute bottom-10 flex flex-col items-center gap-2">
               <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Tap to flip</p>
               <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce"></div>
            </div>
          </div>

          {/* Back */}
          <div className="absolute inset-0 bg-slate-900 rounded-[3rem] border-2 border-slate-800 shadow-2xl flex flex-col items-center justify-center p-12 backface-hidden rotate-y-180">
            <div className="absolute top-8 right-8 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">VERIFIED ANSWER</div>
            <p className="text-xl text-blue-100 font-bold text-center leading-relaxed whitespace-pre-wrap">
              {card.back}
            </p>
            <p className="absolute bottom-10 text-[10px] text-slate-600 font-bold uppercase tracking-widest">Rate Difficulty</p>
          </div>
        </div>
      </div>

      {flipped && (
        <div className="mt-12 flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          {[
            { label: 'Again', q: 0, c: 'bg-red-500' },
            { label: 'Hard', q: 2, c: 'bg-orange-500' },
            { label: 'Good', q: 4, c: 'bg-blue-500' },
            { label: 'Easy', q: 5, c: 'bg-emerald-500' }
          ].map(btn => (
            <button 
              key={btn.label}
              onClick={(e) => { e.stopPropagation(); updateSRS(btn.q); }}
              className={`${btn.c} text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-12 flex items-center gap-10">
        <div className="flex flex-col items-center">
          <span className="text-slate-900 font-black text-lg tracking-widest">{index + 1}</span>
          <div className="w-12 h-1 bg-blue-500 rounded-full mt-1"></div>
          <span className="text-[10px] text-slate-400 font-black uppercase mt-1">OF {currentCards.length}</span>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Flashcards;
