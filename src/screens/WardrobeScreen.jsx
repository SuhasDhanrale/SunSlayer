import React, { useState } from 'react';
import { Persistence } from '../core/Persistence.js';
import { CHARACTERS } from '../data/characters.js';
import { SLASHES } from '../data/slashes.js';

function CatalogSection({ title, kind, items, onChange }) {
  const ownedKey = kind === 'character' ? 'ownedCharacterIds' : 'ownedSlashIds';
  const equippedKey = kind === 'character' ? 'equippedCharacterId' : 'equippedSlashId';

  const act = (item) => {
    const owned = Persistence.data[ownedKey].includes(item.id);
    if (!owned) {
      const purchase = Persistence.purchaseCosmetic(kind, item.id);
      if (!purchase.ok) { onChange(purchase.reason); return; }
    }
    const equip = Persistence.equipCosmetic(kind, item.id);
    onChange(equip.ok ? null : equip.reason);
  };

  return (
    <section className="min-w-0">
      <h3 className="text-3xl font-bold mb-4 tracking-widest">{title}</h3>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.map((item) => {
          const owned = Persistence.data[ownedKey].includes(item.id);
          const equipped = Persistence.data[equippedKey] === item.id;
          return (
            <article key={item.id} className="border-4 border-[#1c1917] bg-washi p-5 shadow-card flex flex-col gap-3">
              <div className="flex justify-between gap-4 items-start">
                <div>
                  <div className="text-xl font-bold">{item.name}</div>
                  <div className="text-sm italic text-[#78716c]">{item.rarity || item.breath}</div>
                </div>
                <span className="w-6 h-6 rounded-full border-2 border-[#1c1917] shrink-0" style={{ backgroundColor: item.accentColor }} />
              </div>
              <p className="text-sm text-[#44403c] grow">{item.description}</p>
              <button
                type="button"
                disabled={equipped}
                onClick={() => act(item)}
                className="px-4 py-2 border-2 border-[#1c1917] font-bold tracking-wider disabled:opacity-50 bg-[#1c1917] text-[#f4f1ea] hover:bg-[#b91c1c]"
              >
                {equipped ? 'EQUIPPED' : owned ? 'EQUIP' : `BUY · ${item.unlockCost}`}
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function WardrobeScreen({ setGameState }) {
  const [, setRevision] = useState(0);
  const [message, setMessage] = useState(null);
  const refresh = (reason) => {
    setMessage(reason === 'insufficient-funds' ? 'Not enough coins.' : reason ? 'That item is unavailable.' : null);
    setRevision((value) => value + 1);
  };

  return (
    <div className="absolute inset-0 z-20 bg-washi/95 text-[#1c1917] pointer-events-auto overflow-y-auto p-6 md:p-10">
      <header className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h2 className="text-5xl font-bold italic tracking-widest">Wardrobe</h2>
          <p className="text-[#78716c] mt-2">Cosmetics only. Your blade earns no gameplay advantage.</p>
        </div>
        <div className="flex items-center gap-3 text-3xl font-bold text-[#a16207]">
          <span className="inline-block w-6 h-6 rounded-full bg-[#facc15] border-2 border-[#a16207]" />
          {Persistence.data.walletCoins}
        </div>
      </header>

      {message && <div className="max-w-6xl mx-auto mb-4 text-[#b91c1c] font-bold">{message}</div>}

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 pb-24">
        <CatalogSection title="Characters" kind="character" items={CHARACTERS} onChange={refresh} />
        <CatalogSection title="Blade Trails" kind="slash" items={SLASHES} onChange={refresh} />
      </main>

      <button
        type="button"
        onClick={() => setGameState('START')}
        className="fixed bottom-6 right-6 px-10 py-3 bg-[#b91c1c] text-[#f4f1ea] border-4 border-[#1c1917] font-bold tracking-widest shadow-card"
      >
        RETURN
      </button>
    </div>
  );
}
