import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, UserCheck, ShieldCheck, LogOut, Loader2, XCircle, CheckCircle, Vote, Landmark } from 'lucide-react';
import { AdminDashboard } from './components/AdminDashboard';
import { VotingBooth } from './components/VotingBooth';
import { useElection } from './hooks/useElection';
import { LivenessCheck } from './components/LivenessCheck';
import { verifyVoter } from './utils/voterVerification';

function App() {
  const {
    db,
    updateDb,
    addParty,
    castVote,
    updateSettings,
    hasVoted
  } = useElection();
  const [view, setView] = useState('landing');
  const [epicNumber, setEpicNumber] = useState('');
  const [voterName, setVoterName] = useState('');
  const [adminLoginData, setAdminLoginData] = useState({ username: '', password: '' });
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');

  const showAlert = (message: string, type = 'error') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const handleAdminLogin = () => {
    if (!db) return;
    if (adminLoginData.username === db.admin.username && adminLoginData.password === db.admin.password) {
      setView('admin-dashboard');
    } else {
      showAlert('Invalid Admin Credentials');
    }
  };

  const handleEpicCheck = async () => {
    if (!epicNumber) {
      showAlert('Please enter EPIC Number / தயவுசெய்து EPIC எண்ணை உள்ளிடவும்');
      return;
    }

    // Check if Election is Active
    if (!db?.electionSettings.isActive) {
      showAlert('Election is NOT Active. Please wait for the administrator to start polling.', 'error');
      return;
    }

    // Check for Double Voting
    if (hasVoted(epicNumber)) {
      showAlert('You have already voted! / நீங்கள் ஏற்கனவே வாக்களித்துவிட்டீர்கள்', 'error');
      return;
    }

    setLoading(true);
    try {
      const name = await verifyVoter(epicNumber);
      if (!name) {
        showAlert('EPIC Number not found / EPIC எண் பட்டியலில் இல்லை');
        setLoading(false);
        return;
      }
      setVoterName(name);
      setView('liveness');
    } catch (error) {
      console.error(error);
      showAlert('Error verifying voter.');
    } finally {
      setLoading(false);
    }
  };

  const handleLivenessVerified = () => {
    setView('voting');
  };

  const handleVote = async (partyName: string) => {
    if (!db) return;
    setLoading(true);

    try {
      // 1. Generate Secure Random Transaction Hash (Ethereum/Ganache Style)
      // We use crypto.getRandomValues for cryptographic security (unpredictable).
      // This ensures the hash cannot be reverse-engineered to reveal the vote.
      const array = new Uint8Array(32);
      crypto.getRandomValues(array);
      const realTxHash = '0x' + Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');

      console.log(`Casting vote for ${partyName} with Secure Hash: ${realTxHash}`);

      // 2. Submit to Backend (Database + Ledger)
      await castVote({
        userId: epicNumber,
        partyName,
        boothId: 'ONLINE',
        hash: realTxHash
      });

      setTxHash(realTxHash);
      setView('success');

    } catch (error: any) {
      console.error('Voting Error:', error);
      showAlert(error.message || 'Voting Failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (view === 'voting') {
      timer = setTimeout(() => {
        showAlert('Session Timed Out / அமர்வு நேரம் முடிந்தது', 'error');
        handleLogout();
      }, 60000); // 60 seconds
    }
    return () => clearTimeout(timer);
  }, [view]);

  const handleLogout = () => {
    setEpicNumber('');
    setVoterName('');
    setView('landing');
    setAdminLoginData({ username: '', password: '' });
  };

  if (!db) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-amber-50 gap-6">
        <Landmark className="h-16 w-16 text-amber-600 animate-pulse" />
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800">தமிழ்நாடு மாநில தேர்தல் ஆணையம்</h2>
          <p className="text-slate-500 font-medium">Tamil Nadu State Election Commission</p>
          <p className="text-xs text-amber-600 mt-2 tracking-widest uppercase">Initializing Secure System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-amber-50/50 font-sans text-slate-800 relative overflow-x-hidden">

      {/* TN Govt Theme Header Stripe */}
      <div className="fixed top-0 inset-x-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-black z-50"></div>

      {/* Background Motifs */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: "url('https://upload.wikimedia.org/wikipedia/commons/8/81/TamilNadu_Logo.svg')", backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundSize: '50%' }}></div>

      <div className="relative z-10">
        {alert.show && (
          <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-right fade-in duration-300">
            <Alert className={`shadow-xl border-l-8 ${alert.type === 'error' ? 'bg-white border-l-red-600 text-red-900' : 'bg-white border-l-green-600 text-green-900'}`}>
              <AlertDescription className="font-bold flex items-center gap-3 text-lg">
                {alert.type === 'error' ? <XCircle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
                {alert.message}
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* HEADER */}
        {view !== 'admin-dashboard' && (
          <header className="bg-white/90 backdrop-blur-md border-b border-amber-100 p-4 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center gap-4">
              <div className="p-2 bg-amber-50 rounded-full border border-amber-100">
                <Landmark className="w-8 h-8 text-amber-700" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  தமிழ்நாடு மாநில தேர்தல் ஆணையம்
                </h1>
                <p className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">
                  Tamil Nadu State Election Commission
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="hidden md:flex flex-col items-end mr-4">
                  <span className="text-xs font-bold text-slate-400 uppercase">Secure Connection</span>
                  <span className="text-xs font-mono text-green-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> ENCRYPTED
                  </span>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Landing / Voter Entry */}
        {(view === 'landing' || view === 'admin-login') && (
          <div className="min-h-[calc(100vh-100px)] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg bg-white shadow-2xl border-t-4 border-t-amber-500">
              <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-200 to-transparent"></div>
                <h2 className="text-3xl font-black text-white relative z-10 mb-2">
                  {view === 'landing' ? 'வாக்காளர் உள்நுழைவு' : 'நிர்வாக உள்நுழைவு'}
                </h2>
                <p className="text-amber-400 font-medium uppercase tracking-widest text-xs relative z-10">
                  {view === 'landing' ? 'Voter Portal Entry' : 'Administrative Access'}
                </p>
              </div>

              <CardContent className="p-8 space-y-8">

                {view === 'landing' && (
                  <>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-slate-600 font-bold uppercase text-xs flex justify-between">
                          <span>EPIC Number / EPIC எண்</span>
                          <span className="text-amber-600">Required *</span>
                        </Label>
                        <div className="relative">
                          <Input
                            className="pl-12 h-14 text-xl font-mono tracking-widest uppercase bg-slate-50 border-slate-200 focus:border-amber-500 focus:ring-amber-500/20 transition-all"
                            placeholder="ABC1234567"
                            value={epicNumber}
                            onChange={(e) => setEpicNumber(e.target.value.toUpperCase())}
                          />
                          <UserCheck className="absolute left-4 top-4 text-slate-400 w-6 h-6" />
                        </div>
                        <p className="text-xs text-slate-400 text-center">
                          உங்கள் வாக்காளர் அடையாள அட்டை எண்ணை உள்ளிடவும்
                        </p>
                      </div>
                    </div>

                    <Button
                      className="w-full h-14 text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-800 hover:from-amber-600 hover:to-amber-700 text-white shadow-lg shadow-slate-900/20 transition-all duration-300"
                      onClick={handleEpicCheck}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin mr-3" />
                          சரிபார்க்கிறது... (Verifying...)
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="mr-3 h-6 w-6" />
                          சரிபார்த்து தொடரவும் (Verify)
                        </>
                      )}
                    </Button>
                  </>
                )}

                {view === 'admin-login' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input
                          className="h-12 bg-slate-50"
                          value={adminLoginData.username}
                          onChange={(e) => setAdminLoginData({ ...adminLoginData, username: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input
                          type="password"
                          className="h-12 bg-slate-50"
                          value={adminLoginData.password}
                          onChange={(e) => setAdminLoginData({ ...adminLoginData, password: e.target.value })}
                        />
                      </div>
                    </div>
                    <Button
                      className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white font-bold"
                      onClick={handleAdminLogin}
                    >
                      Login to Dashboard
                    </Button>
                  </div>
                )}

                <div className="pt-4 border-t border-slate-100 text-center">
                  {view === 'landing' ? (
                    <button
                      onClick={() => setView('admin-login')}
                      className="text-xs font-bold text-slate-400 hover:text-amber-600 flex items-center justify-center gap-2 mx-auto uppercase tracking-wider"
                    >
                      <Lock className="w-3 h-3" /> Official Login
                    </button>
                  ) : (
                    <button
                      onClick={() => setView('landing')}
                      className="text-sm font-medium text-slate-500 hover:text-slate-800"
                    >
                      &larr; Back to Voter Portal
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'liveness' && (
          <LivenessCheck
            onVerified={handleLivenessVerified}
            onCancel={() => setView('landing')}
          />
        )}

        {view === 'voting' && (
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-xl shadow-lg border-l-4 border-amber-500">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Welcome Voter</p>
                <h2 className="text-2xl font-black text-slate-800">{voterName}</h2>
              </div>
              <div className="flex flex-col items-end">
                <div className="px-4 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Verified
                </div>
                <p className="text-xs text-slate-400 mt-1 font-mono">{epicNumber}</p>
              </div>
            </div>

            <VotingBooth
              parties={db.parties}
              onVote={handleVote}
              onViewPartyInfo={() => { }}
            />
          </div>
        )}

        {view === 'success' && (
          <div className="min-h-[80vh] flex items-center justify-center p-4">
            <Card className="w-full max-w-lg border-none shadow-2xl relative overflow-hidden bg-white">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-green-500 via-white to-orange-500"></div>
              <CardContent className="text-center pt-16 pb-12 px-8 space-y-8">
                <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mx-auto shadow-inner mb-6">
                  <Vote className="w-16 h-16 text-green-600" />
                </div>

                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">வாக்களித்ததிற்கு நன்றி</h2>
                  <p className="text-lg text-slate-600 font-medium">Thank you for Voting</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-left relative">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-200 pb-2">Digital Receipt</p>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-500">Voter Name</span>
                      <span className="text-sm font-bold text-slate-800">{voterName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-500">EPIC No</span>
                      <span className="text-sm font-bold text-slate-800 font-mono">{epicNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-slate-500">Hash</span>
                      <span className="text-[10px] font-mono text-amber-600 max-w-[150px] truncate">{txHash || "Processing..."}</span>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleLogout}
                  className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-bold tracking-wider uppercase"
                >
                  Return to Home
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {view === 'admin-dashboard' && (
          <AdminDashboard
            db={db}
            updateDb={updateDb}
            addParty={addParty}
            updateSettings={updateSettings}
            onLogout={handleLogout}
            showAlert={showAlert}
          />
        )}
      </div>
    </div>
  );
}

export default App;
