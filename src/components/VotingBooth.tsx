import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Party } from '../types';
import { Check, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface VotingBoothProps {
  parties: Party[];
  onVote: (partyName: string) => void;
  onViewPartyInfo: (party: Party) => void;
}

export function VotingBooth({ parties, onVote }: VotingBoothProps) {
  const [selectedParty, setSelectedParty] = useState<string | null>(null);
  const [viewingManifesto, setViewingManifesto] = useState<Party | null>(null);

  const handleVote = () => {
    if (selectedParty) {
      onVote(selectedParty);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="w-full bg-slate-900 border-b border-yellow-500 shadow-md mb-12 py-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 mb-4 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-yellow-500">
            {/* Emblem Placeholder - Using Landmark as simplified emblem */}
            <div className="text-slate-900"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" x2="21" y1="22" y2="22" /><line x1="6" x2="6" y1="22" y2="12" /><line x1="18" x2="18" y1="22" y2="12" /><path d="M6 12L12 2L18 12" /></svg></div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 uppercase tracking-wider">
            TAMIL NADU STATE ELECTION COMMISSION
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-yellow-500 mb-2">
            தமிழ்நாடு மாநில தேர்தல் ஆணையம்
          </h2>
          <div className="px-4 py-1 bg-slate-800 rounded text-slate-300 text-sm font-mono tracking-widest border border-slate-700">
            SECURE VOTING TERMINAL • 2026
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-32 px-6">
        {parties.map((party, index) => {
          const isSelected = selectedParty === party.name;
          return (
            <motion.div
              key={party.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                relative bg-white rounded-xl overflow-hidden transition-all duration-200
                ${isSelected
                  ? 'ring-4 ring-blue-700 shadow-xl transform scale-[1.01]'
                  : 'border border-slate-200 shadow-sm hover:shadow-md'}
              `}
            >
              <div className="p-6 flex flex-col h-full items-center text-center">

                {/* Checkmark Overlay */}
                {isSelected && (
                  <div className="absolute top-4 right-4 bg-blue-700 text-white p-1 rounded-full shadow-lg">
                    <Check className="w-5 h-5" />
                  </div>
                )}

                {/* Image Area */}
                <div className="w-32 h-32 mb-6 rounded-full border-4 border-slate-100 shadow-inner bg-slate-50 flex items-center justify-center overflow-hidden">
                  {party.imageUrl ? (
                    <img src={party.imageUrl} alt={party.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl font-bold text-slate-300">{party.name[0]}</span>
                  )}
                </div>

                {/* Text Info */}
                <h3 className="text-xl font-bold text-slate-800 mb-2 uppercase">{party.name}</h3>
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-6">
                  Official Candidate
                </div>

                <div className="w-full mt-auto space-y-3">
                  <Button
                    onClick={() => setViewingManifesto(party)}
                    variant="outline"
                    className="w-full border-slate-300 text-slate-600 hover:bg-slate-50 text-xs uppercase tracking-wider font-bold"
                  >
                    View Manifesto / தேர்தல் அறிக்கை
                  </Button>
                  <Button
                    onClick={() => setSelectedParty(party.name)}
                    className={`w-full h-12 text-sm font-bold uppercase tracking-widest ${isSelected ? 'bg-blue-700 hover:bg-blue-800' : 'bg-slate-800 hover:bg-slate-900'}`}
                  >
                    {isSelected ? 'SELECTED' : 'VOTE / வாக்களி'}
                  </Button>
                </div>

              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Floating Confirm Bar */}
      <AnimatePresence>
        {selectedParty && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-indigo-100 p-6 z-50 shadow-2xl"
          >
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
              <div className="hidden md:block">
                <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">You have selected</p>
                <h3 className="text-3xl font-black text-indigo-900">{selectedParty}</h3>
              </div>
              <Button
                onClick={handleVote}
                className="flex-1 md:flex-none md:w-64 h-16 text-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-xl shadow-green-500/20 rounded-xl"
              >
                CONFIRM VOTE <ChevronRight className="w-6 h-6 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Manifesto Dialog */}
      <Dialog open={!!viewingManifesto} onOpenChange={(open) => !open && setViewingManifesto(null)}>
        <DialogContent className="max-w-2xl bg-white/95 backdrop-blur-lg border-none shadow-2xl">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-4">
              {viewingManifesto?.imageUrl ? (
                <img src={viewingManifesto.imageUrl} className="w-16 h-16 rounded-full object-cover border-2 border-indigo-100" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-3xl">
                  {viewingManifesto?.symbol}
                </div>
              )}
              <div>
                <DialogTitle className="text-2xl font-bold">{viewingManifesto?.name}</DialogTitle>
                <DialogDescription>Official Election Manifesto 2026</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-100 max-h-[60vh] overflow-y-auto">
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {viewingManifesto?.manifesto || "No manifesto information available for this candidate."}
            </p>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={() => setViewingManifesto(null)} variant="secondary">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VotingBooth;
