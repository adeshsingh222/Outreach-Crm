import React, { useState } from 'react';
import { ExternalLink, Sparkles, Building2, MapPin, Globe, Phone as PhoneIcon, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RichTextNote, Note } from '@/components/ui/RichTextNote';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companies, updateCompany } = useAppStore();
  
  const company = companies.find(c => c.id === id);
  const [notes, setNotes] = useState<Note[]>([]);
  const [isEnriching, setIsEnriching] = useState(false);

  // Swipe to go back logic
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isRightSwipe = distance < -50; // swipe right distance
    
    if (isRightSwipe) {
      navigate('/companies');
    }
  };

  React.useEffect(() => {
    if (id) {
      fetch(`/api/companies/${id}/notes`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            // Map db Note model to UI Note model if necessary
            setNotes(data.map((n: any) => ({
              id: n.id,
              content: n.content,
              timestamp: n.createdAt
            })));
          }
        })
        .catch(err => console.error("Failed to fetch notes", err));
    }
  }, [id]);

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <p className="text-foreground-muted">Company not found.</p>
        <button onClick={() => navigate('/companies')} className="text-primary hover:underline">
          Back to Pipeline
        </button>
      </div>
    );
  }

  const handleAddNote = async (content: string) => {
    // Optimistic update
    const tempId = Date.now().toString();
    const newNote: Note = {
      id: tempId,
      content,
      timestamp: new Date().toISOString()
    };
    setNotes([newNote, ...notes]);

    try {
      const res = await fetch(`/api/companies/${company!.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });
      if (res.ok) {
        const savedNote = await res.json();
        // Update with real ID
        setNotes(prev => prev.map(n => n.id === tempId ? {
          id: savedNote.id,
          content: savedNote.content,
          timestamp: savedNote.createdAt
        } : n));
      } else {
        console.error("Failed to save note to DB");
      }
    } catch (err) {
      console.error("Failed to post note", err);
    }
  };

  const handleEnrich = () => {
    setIsEnriching(true);
    // Simulate AI enrichment
    setTimeout(() => {
      setIsEnriching(false);
      updateCompany(company.id, { enriched: true });
    }, 2000);
  };

  return (
    <div 
      className="max-w-5xl mx-auto space-y-6 overflow-x-hidden touch-pan-y"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/companies')}
          className="p-2 -ml-2 text-foreground-muted hover:bg-secondary rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground leading-tight">{company.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn(
                "px-2 py-0.5 text-[11px] font-medium rounded-sm border",
                company.status === 'Not Started' ? "bg-secondary text-foreground-muted border-border" : "bg-success-bg text-success-text border-transparent"
              )}>
                {company.status || 'Not Started'}
              </span>
              <select 
                value={company.priority || 'Low'}
                onChange={(e) => updateCompany(company.id, { priority: e.target.value })}
                className={cn(
                  "px-2 py-0.5 text-[11px] font-medium rounded-sm border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 text-center text-center-last",
                  company.priority === 'High' ? 'text-error-text bg-error-bg border-transparent' 
                  : company.priority === 'Medium' ? 'text-warning-text bg-warning-bg border-transparent'
                  : 'text-foreground-muted bg-secondary border-border'
                )}
              >
                <option value="Low" className="text-foreground bg-surface">Low Priority</option>
                <option value="Medium" className="text-foreground bg-surface">Medium Priority</option>
                <option value="High" className="text-foreground bg-surface">High Priority</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Enrichment */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-border rounded-xl shadow-sm p-5 space-y-5">
            <h3 className="text-[15px] font-semibold text-foreground">Company Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium mb-1">Phone</p>
                <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <PhoneIcon className="w-3.5 h-3.5 text-foreground-faint" />
                  {company.phone || 'Not available'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium mb-1">Category</p>
                <p className="text-sm font-medium text-foreground truncate" title={company.category}>
                  {company.category || 'Not categorized'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-foreground-muted uppercase tracking-wider font-medium mb-1">Address</p>
                <p className="text-sm font-medium text-foreground flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-foreground-faint shrink-0 mt-0.5" />
                  {company.address || 'Not available'}
                </p>
              </div>
            </div>

            <div className="pt-5 border-t border-border flex flex-col gap-3">
              {company.website && (
                <a 
                  href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-surface border border-border text-foreground text-sm font-medium rounded-md hover:bg-secondary transition-colors shadow-sm"
                >
                  <Globe className="w-4 h-4 text-foreground-muted" />
                  Visit Site
                </a>
              )}
              <button 
                onClick={handleEnrich}
                disabled={isEnriching || company.enriched}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-purple-500 text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity shadow-sm disabled:opacity-70"
              >
                <Sparkles className={cn("w-4 h-4", isEnriching && "animate-spin")} />
                {company.enriched ? 'Enriched' : isEnriching ? 'AI is extracting...' : 'Enrich via AI'}
              </button>
            </div>
          </div>

          {company.enriched && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h3 className="text-[15px] font-semibold text-foreground">AI Enriched Data</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[11px] text-primary/70 uppercase tracking-wider font-medium mb-1">HR / Recruiter</p>
                  <p className="text-sm font-medium text-foreground">Sarah Jenkins</p>
                  <p className="text-[12px] text-foreground-muted">sarah.j@{company.website?.replace('https://', '').replace('www.', '') || 'company.com'}</p>
                </div>
                <div>
                  <p className="text-[11px] text-primary/70 uppercase tracking-wider font-medium mb-1">Hiring Manager</p>
                  <p className="text-sm font-medium text-foreground">David Chen</p>
                  <p className="text-[12px] text-foreground-muted">VP of Engineering</p>
                </div>
              </div>
              <div className="pt-3 border-t border-primary/10 flex flex-col gap-2">
                <a href="#" className="text-[13px] font-medium text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> Careers Page
                </a>
                <a href="#" className="text-[13px] font-medium text-primary hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3.5 h-3.5" /> LinkedIn Company
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Notes */}
        <div className="lg:col-span-2">
          <RichTextNote notes={notes} onAddNote={handleAddNote} className="bg-surface rounded-xl border border-border p-6 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
