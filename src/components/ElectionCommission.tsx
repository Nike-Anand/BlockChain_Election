import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { LogOut, Activity, MapPin, ChevronRight, Award, Trophy, Info } from 'lucide-react';

interface ElectionCommissionProps {
    db: any;
    onLogout: () => void;
    showAlert: (message: string, type: string) => void;
}

export function ElectionCommission({ db, onLogout }: ElectionCommissionProps) {
    const [activeTab, setActiveTab] = useState<'results' | 'reports'>('results');
    const [locationData, setLocationData] = useState<any[]>([]);
    const [finalTally, setFinalTally] = useState<any>(null);

    const isElectionEnded = () => {
        if (db.electionSettings.isActive) return false;
        if (!db.electionSettings.endTime) return false;
        const now = new Date();
        const endTime = new Date(db.electionSettings.endTime);
        return now > endTime;
    };

    const resultsAvailable = isElectionEnded();

    useEffect(() => {
        fetch('http://localhost:8000/api/analytics/location-turnout')
            .then(res => res.json())
            .then(data => {
                if (data.data) setLocationData(data.data);
            })
            .catch(err => console.error("Analytics Error:", err));

        if (resultsAvailable) {
            fetch('http://localhost:8000/api/commission/final-results')
                .then(res => res.json())
                .then(data => {
                    if (data.tally) setFinalTally(data.tally);
                });
        }
    }, [db.votes, resultsAvailable]);

    const menuItems = [
        { id: 'results', label: 'ELECTION OUTCOME', icon: Trophy },
        { id: 'reports', label: 'ANALYTICS ENGINE', icon: Activity },
    ];

    const COLORS = ['#003366', '#FF9933', '#006400', '#D32F2F', '#9C27B0', '#FFC107'];

    return (
        <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-80 bg-[#003366] text-white flex flex-col shadow-2xl z-20 border-r border-[#FF9933]/50">
                <div className="p-8 bg-[#002244] border-b border-[#FF9933]/30">
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 rounded-full shadow-lg flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/8/81/TamilNadu_Logo.svg" alt="TN Logo" className="w-10 h-10 object-contain" />
                        </div>
                        <div>
                            <h1 className="font-black text-lg tracking-tighter uppercase leading-none">COMMISSION</h1>
                            <p className="text-[10px] text-[#FF9933] font-black uppercase tracking-widest mt-1">SEC Regulatory Portal</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 mt-6 space-y-3">
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center p-4 rounded-2xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id
                                ? 'bg-white/10 text-white shadow-lg border-2 border-[#FF9933]/50'
                                : 'text-slate-300 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <item.icon className={`w-5 h-5 mr-4 ${activeTab === item.id ? 'text-[#FF9933]' : 'text-slate-400 group-hover:text-[#FF9933]'}`} />
                            <div className="text-left flex-1">
                                <span className="block font-black text-xs tracking-[0.1em] uppercase">{item.label}</span>
                            </div>
                            {activeTab === item.id && <ChevronRight className="w-4 h-4 text-[#FF9933]" />}
                        </button>
                    ))}
                </nav>

                <div className="p-6 mt-auto border-t border-white/10 bg-[#002244]/50">
                    <Button onClick={onLogout} variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white border-0 shadow-lg uppercase font-black text-[10px] tracking-[0.2em] rounded-xl h-12">
                        <LogOut className="w-4 h-4 mr-2" /> Secure Logout
                    </Button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 relative bg-slate-50 overflow-hidden flex flex-col">
                <header className="h-24 bg-white border-b border-slate-200 flex items-center justify-between px-10 shadow-sm shrink-0">
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black text-[#003366] uppercase tracking-tighter">Election Results Authority</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-[#006400] animate-pulse"></span>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Final Tally Verification Engine</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {!resultsAvailable && (
                            <div className="px-5 py-2 rounded-2xl bg-[#FF9933]/10 border-2 border-[#FF9933]/30 text-[#FF9933] flex items-center gap-2">
                                <Info className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Election Conclusion</span>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="max-w-6xl mx-auto"
                        >
                            {activeTab === 'results' && (
                                <div className="space-y-10">
                                    {!resultsAvailable ? (
                                        <Card className="bg-white border-none shadow-2xl rounded-[3rem] p-16 text-center">
                                            <div className="w-32 h-32 bg-slate-50 rounded-full mx-auto mb-8 flex items-center justify-center animate-pulse">
                                                <Activity className="w-16 h-16 text-slate-200" />
                                            </div>
                                            <h3 className="text-4xl font-black text-[#003366] uppercase tracking-tighter mb-4">Polling in Progress</h3>
                                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs max-w-sm mx-auto leading-relaxed">
                                                Final results will be calculated and displayed once the polling station is officially closed by the Chief Commissioner.
                                            </p>
                                        </Card>
                                    ) : (
                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                            <div className="lg:col-span-1 space-y-8">
                                                <Card className="bg-[#003366] text-white rounded-[2.5rem] p-8 shadow-2xl border-none relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16"></div>
                                                    <Award className="w-12 h-12 text-[#FF9933] mb-6" />
                                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-black">Winner Declared</h3>
                                                    <div className="mt-8 p-6 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-md">
                                                        <p className="text-[10px] font-black text-[#FF9933] uppercase tracking-widest mb-1">Leading party</p>
                                                        <p className="text-4xl font-black uppercase text-black truncate">
                                                            {finalTally ? Object.entries(finalTally).sort((a: any, b: any) => b[1] - a[1])[0][0] : "Calculating..."}
                                                        </p>
                                                    </div>
                                                </Card>

                                                <Card className="bg-white rounded-[2.5rem] p-8 border-none shadow-xl">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Vote Share Chart</h4>
                                                    <div className="h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={finalTally ? Object.entries(finalTally).map(([name, val]) => ({ name, value: val })) : []}
                                                                    dataKey="value"
                                                                    innerRadius={60}
                                                                    outerRadius={80}
                                                                    paddingAngle={5}
                                                                >
                                                                    {finalTally && Object.entries(finalTally).map((_, index) => (
                                                                        <Cell key={`cell-winner-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </Card>
                                            </div>

                                            <div className="lg:col-span-2">
                                                <Card className="bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden">
                                                    <div className="p-8 bg-slate-50 border-b border-slate-100">
                                                        <h3 className="font-black text-[#003366] uppercase tracking-widest text-sm">Official Tally Record</h3>
                                                    </div>
                                                    <div className="p-8 space-y-6">
                                                        {finalTally && Object.entries(finalTally).sort((a: any, b: any) => b[1] - a[1]).map(([party, votes], idx) => (
                                                            <div key={party} className="flex items-center gap-6 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                                                                <div className="w-12 h-12 flex items-center justify-center rounded-xl font-black text-white shadow-lg" style={{ backgroundColor: COLORS[idx % COLORS.length] }}>
                                                                    {idx + 1}
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="text-lg font-black text-[#003366] uppercase">{party}</h4>
                                                                    <div className="w-full h-3 bg-slate-100 rounded-full mt-2 overflow-hidden shadow-inner">
                                                                        <motion.div
                                                                            initial={{ width: 0 }}
                                                                            animate={{ width: `${((votes as number) / (Object.values(finalTally).reduce((a: any, b: any) => a + b, 0) as number)) * 100}%` }}
                                                                            className="h-full"
                                                                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                                                                        ></motion.div>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right">
                                                                    <div className="text-2xl font-black text-[#003366]">{votes as number}</div>
                                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mandates</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Card>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'reports' && (
                                <div className="space-y-10">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <Card className="bg-white border-none shadow-xl rounded-[2.5rem] p-10">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Participating Districts</h4>
                                            <div className="h-[400px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={locationData}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                        <XAxis dataKey="location" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: '900', fill: '#003366' }} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                                                        <Tooltip />
                                                        <Bar dataKey="voted" name="Verified Voted" radius={[8, 8, 0, 0]} barSize={40}>
                                                            {locationData.map((_, index) => (
                                                                <Cell key={`cell-dist-${index}`} fill={index % 2 === 0 ? '#003366' : '#FF9933'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>

                                        <Card className="bg-white border-none shadow-xl rounded-[2.5rem] p-10">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Participation Heatmap</h4>
                                            <div className="h-[400px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={locationData}
                                                            dataKey="voted"
                                                            nameKey="location"
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={80}
                                                            outerRadius={120}
                                                            paddingAngle={10}
                                                        >
                                                            {locationData.map((_, index) => (
                                                                <Cell key={`cell-pie-ana-${index}`} fill={index % 2 === 0 ? '#003366' : '#FF9933'} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip />
                                                        <Legend wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }} />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </Card>
                                    </div>

                                    <Card className="bg-white border-none shadow-2xl rounded-[3rem] overflow-hidden">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#003366] text-white text-[10px] font-black uppercase tracking-[0.3em]">
                                                <tr>
                                                    <th className="p-8 border-r border-white/5">Verification Point</th>
                                                    <th className="p-8 text-center border-r border-white/5">Registrants</th>
                                                    <th className="p-8 text-center border-r border-white/5">Verified Casts</th>
                                                    <th className="p-8 text-center">Intensity</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {locationData.map((loc, i) => (
                                                    <tr key={i} className="hover:bg-slate-50/80 transition-all group">
                                                        <td className="p-8 font-black text-[#003366] flex items-center gap-3">
                                                            <MapPin className="w-5 h-5 text-[#FF9933]" /> {loc.location}
                                                        </td>
                                                        <td className="p-8 text-center font-mono text-slate-400 font-bold">{loc.total}</td>
                                                        <td className="p-8 text-center">
                                                            <span className="bg-[#003366] text-white px-5 py-2 rounded-xl font-black text-xs shadow-lg shadow-blue-900/20">{loc.voted}</span>
                                                        </td>
                                                        <td className="p-8 text-center">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                                                                    <div className={`h-full rounded-full transition-all duration-1000 ${(loc as any).percentage > 75 ? 'bg-[#006400]' : 'bg-[#FF9933]'}`} style={{ width: `${(loc as any).percentage}%` }}></div>
                                                                </div>
                                                                <span className="text-sm font-black text-[#003366] min-w-[3rem] tracking-tighter">{loc.percentage}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </Card>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}

export default ElectionCommission;
