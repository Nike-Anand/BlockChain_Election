import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Party } from '../types';
import { Check, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface VotingBoothProps {
    parties: Party[];
    onVote: (partyName: string) => void;
    onViewPartyInfo: (party: Party) => void;
    isLoading?: boolean;
}

export function VotingBooth({ parties, onVote, isLoading = false }: VotingBoothProps) {
    const [selectedParty, setSelectedParty] = useState<string | null>(null);
    const [viewingManifesto, setViewingManifesto] = useState<Party | null>(null);

    const handleVote = () => {
        if (selectedParty && !isLoading) {
            onVote(selectedParty);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center py-6 px-4">
            {/* Minimal Modern Header for Voting Booth */}
            <div className="w-full max-w-6xl flex justify-between items-center mb-8 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-md border border-[#003366]/10 p-1 overflow-hidden">
                        <img src="/tn-emblem.png" alt="TN Emblem" className="w-full h-full object-contain" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-[#003366] uppercase tracking-tighter">TN State Election Commission</h2>
                        <p className="text-[10px] font-bold text-[#FF9933] uppercase">Secure Digital Voting Unit</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-green-700 rounded-full">
                    <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest leading-none">Live Connection</span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
                {parties.map((party, index) => {
                    const isSelected = selectedParty === party.name;
                    return (
                        <motion.div
                            key={party.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className={`
                relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-300
                ${isSelected
                                    ? 'ring-4 ring-[#FF9933] shadow-2xl scale-[1.02]'
                                    : 'border border-slate-200 shadow-lg hover:border-[#003366]/30 hover:shadow-xl'}
              `}
                            onClick={() => setSelectedParty(party.name)}
                        >
                            <div className="p-6 flex flex-col h-full items-center text-center">
                                {/* Selection Badge */}
                                {isSelected && (
                                    <div className="absolute top-3 right-3 bg-[#FF9933] text-white p-1 rounded-full shadow-lg z-10">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}

                                {/* Image Area */}
                                <div className={`w-28 h-28 mb-4 rounded-xl border-2 p-1 transition-all duration-300 ${isSelected ? 'border-[#FF9933] bg-orange-50' : 'border-slate-100 bg-slate-50'}`}>
                                    <div className="w-full h-full rounded-lg overflow-hidden flex items-center justify-center bg-white shadow-inner">
                                        {party.imageUrl ? (
                                            <img src={party.imageUrl} alt={party.name} className="w-full h-full object-contain p-2" />
                                        ) : (
                                            <span className="text-4xl font-black text-[#003366]">{party.name[0]}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Text Info */}
                                <h3 className="text-lg font-black text-[#003366] mb-1 uppercase tracking-tight leading-tight">{party.name}</h3>
                                <div className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-6 ${isSelected ? 'text-[#FF9933]' : 'text-slate-400'}`}>
                                    Registered Party
                                </div>

                                <div className="w-full mt-auto space-y-2">
                                    <Button
                                        onClick={(e) => { e.stopPropagation(); setViewingManifesto(party); }}
                                        variant="outline"
                                        className="w-full border-slate-200 text-[#003366] hover:bg-slate-50 text-[10px] uppercase tracking-widest font-black h-10"
                                    >
                                        Manifesto / அறிக்கை
                                    </Button>
                                    <div
                                        className={`w-full h-12 flex items-center justify-center rounded-lg text-xs font-black uppercase tracking-widest transition-all duration-300 ${isSelected ? 'bg-[#FF9933] text-white' : 'bg-[#003366] text-white hover:bg-[#002244]'}`}
                                    >
                                        {isSelected ? 'SELECTED' : 'SELECT CANDIDATE'}
                                    </div>
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
                        className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-4xl bg-white/95 backdrop-blur-xl border border-[#003366]/10 p-4 z-50 shadow-[0_20px_50px_rgba(0,51,102,0.2)] rounded-2xl"
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-[#003366] rounded-xl flex items-center justify-center shadow-lg">
                                    <Check className="w-6 h-6 text-[#FF9933]" />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ready to Cast</p>
                                    <h3 className="text-xl font-black text-[#003366] uppercase">{selectedParty}</h3>
                                </div>
                            </div>
                            <Button
                                onClick={handleVote}
                                disabled={isLoading}
                                className={`w-full md:w-72 h-14 text-lg font-black uppercase tracking-widest bg-[#FF9933] hover:bg-[#e68a2e] text-white shadow-xl shadow-orange-500/20 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 ${isLoading ? 'opacity-50' : 'hover:scale-[1.02]'}`}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" /> PROVISIONING...
                                    </>
                                ) : (
                                    <>
                                        CONFIRM VOTE <ChevronRight className="w-5 h-5" />
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Manifesto Dialog */}
            <Dialog open={!!viewingManifesto} onOpenChange={(open) => !open && setViewingManifesto(null)}>
                <DialogContent className="max-w-2xl bg-white border-2 border-[#003366]/5 shadow-2xl rounded-3xl p-0 overflow-hidden">
                    <DialogHeader className="p-8 bg-[#003366] text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 rounded-2xl bg-white p-2 shadow-inner flex items-center justify-center">
                                {viewingManifesto?.imageUrl ? (
                                    <img src={viewingManifesto.imageUrl} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-4xl font-black text-[#003366]">{viewingManifesto?.name[0]}</span>
                                )}
                            </div>
                            <div className="text-left">
                                <DialogTitle className="text-3xl font-black uppercase tracking-tight">{viewingManifesto?.name}</DialogTitle>
                                <DialogDescription className="text-[#FF9933] font-bold uppercase tracking-widest text-xs">Official 2026 Manifesto</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-8">
                        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 max-h-[40vh] overflow-y-auto">
                            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed font-medium">
                                {viewingManifesto?.manifesto || "Election manifesto content will be available shortly."}
                            </p>
                        </div>
                        <div className="flex justify-end pt-6">
                            <Button onClick={() => setViewingManifesto(null)} className="btn-primary rounded-xl">Dismiss</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default VotingBooth;
