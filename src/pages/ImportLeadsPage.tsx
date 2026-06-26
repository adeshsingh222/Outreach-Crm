import React, { useState } from 'react';
import Papa from 'papaparse';
import { UploadCloud, X, Check, Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';

export type ImportedLead = {
  id: string;
  name: string;
  website: string;
  phone: string;
  address: string;
  category: string;
  rating?: number;
  reviews?: number;
  placeId?: string;
  googleMapsUrl?: string;
  imageUrl?: string;
  isDeleted: boolean;
  isDuplicate: boolean; // true = already exists in DB
};

export default function ImportLeadsPage() {
  const navigate = useNavigate();
  const { addCompanies } = useAppStore();
  const [leads, setLeads] = useState<ImportedLead[]>([]);
  const [csvText, setCsvText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = () => {
    if (!csvText.trim()) return;
    setIsParsing(true);
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let parsedLeads: ImportedLead[] = results.data.map((row: any, index) => {
          return {
            id: `import-${Date.now()}-${index}`,
            name: row.name || row['Company Name'] || 'Unknown',
            website: row.website || row.Website || '',
            phone: row.phone || row.Phone || '',
            address: row.address || row.Address || '',
            category: row.category || row.Category || row.type || '',
            rating: Number(row.rating || row.Rating) || undefined,
            reviews: Number(row.reviews || row.Reviews) || undefined,
            placeId: row.placeId || row.place_id || row.google_id || '',
            googleMapsUrl: row.location_link || row.googleMapsUrl || row.google_maps_url || '',
            imageUrl: row.photo || row.photo1 || row.image || row.image_url || row.imageUrl || '',
            isDeleted: false,
            isDuplicate: false,
          };
        }).filter(lead => lead.name !== 'Unknown');

        const seenNames = new Set<string>();
        const seenPlaceIds = new Set<string>();
        
        parsedLeads = parsedLeads.filter(lead => {
          const isDuplicateName = seenNames.has(lead.name);
          const isDuplicatePlaceId = lead.placeId ? seenPlaceIds.has(lead.placeId) : false;
          
          if (isDuplicateName || isDuplicatePlaceId) {
            return false; // Skip intra-csv duplicates entirely
          }
          
          seenNames.add(lead.name);
          if (lead.placeId) seenPlaceIds.add(lead.placeId);
          return true;
        });

        try {
          const names = Array.from(seenNames);
          const placeIds = Array.from(seenPlaceIds);
          
          const res = await fetch('/api/companies/check-duplicates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',  // FIX: send auth cookie
            body: JSON.stringify({ names, placeIds })
          });
          
          if (res.ok) {
            const result = await res.json();
            const dbDuplicates = Array.isArray(result) ? result : (result.data || []);
            
            const toSlug = (s: string) => (s || '').toLowerCase().trim().replace(/\s+/g, '-');
            const duplicateMetaNames = new Set(dbDuplicates.map((d: any) => toSlug(d.name)));
            const duplicatePlaceIds = new Set(dbDuplicates.map((d: any) => (d.placeId || '').toLowerCase().trim()).filter(Boolean));
            
            parsedLeads = parsedLeads.map(lead => {
              const leadMeta = toSlug(lead.name);
              const leadPlaceId = (lead.placeId || '').toLowerCase().trim();
              
              if (duplicateMetaNames.has(leadMeta) || (leadPlaceId && duplicatePlaceIds.has(leadPlaceId))) {
                return { ...lead, isDuplicate: true, isDeleted: true };
              }
              return lead;
            });
          } else {
            console.error('Duplicate check API failed:', res.status, await res.text());
          }
        } catch (error) {
          console.error('Failed to check duplicates', error);
        }

        setLeads(parsedLeads);
        setIsParsing(false);
      },
      error: () => {
        setIsParsing(false);
        alert("Failed to parse CSV");
      }
    });
  };

  const toggleDelete = (id: string) => {
    setLeads(prev => prev.map(lead => 
      lead.id === id ? { ...lead, isDeleted: !lead.isDeleted } : lead
    ));
  };

  const handleImport = () => {
    const validLeads = leads.filter(l => !l.isDeleted);
    const newCompanies = validLeads.map(lead => ({
      id: lead.id,
      name: lead.name,
      website: lead.website,
      phone: lead.phone,
      address: lead.address,
      category: lead.category,
      rating: lead.rating,
      reviews: lead.reviews,
      placeId: lead.placeId,
      googleMapsUrl: lead.googleMapsUrl,
      imageUrl: lead.imageUrl,
      status: 'Not Started',
      priority: 'Low',
      lastContact: '-',
      enriched: false,
    }));
    addCompanies(newCompanies);
    navigate('/companies');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result;
      if (typeof text === 'string') {
        setCsvText(text);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-full flex flex-col">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/companies')}
          className="p-2 -ml-2 text-foreground-muted hover:bg-secondary rounded-md transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Import Leads from CSV</h2>
          <p className="text-foreground-muted text-[13px] mt-1">Paste or upload Google Maps CSV data to create your lead pipeline.</p>
        </div>
      </div>

      <div className="bg-surface rounded-xl shadow-sm border border-border flex flex-col overflow-hidden flex-1">
        <div className="flex-1 overflow-y-auto p-6">
          {leads.length === 0 ? (
            <div className="space-y-4 max-w-3xl mx-auto">
              <label className="bg-secondary/30 border border-border border-dashed rounded-lg p-8 text-center flex flex-col items-center cursor-pointer hover:bg-secondary/50 transition-colors group">
                <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="text-[15px] font-medium text-foreground">Click to upload CSV or Paste below</h3>
                <p className="text-[13px] text-foreground-muted max-w-md mt-2">
                  Export your leads from Outscraper or Google Maps. We'll automatically map the columns.
                </p>
              </label>
              <textarea 
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="query,name,website,phone,category..."
                className="w-full h-64 p-4 bg-surface border border-border rounded-lg text-sm text-foreground font-mono resize-y focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm placeholder:text-foreground-faint"
              />
              <div className="flex justify-end">
                <button 
                  onClick={handleParse}
                  disabled={!csvText.trim() || isParsing}
                  className="px-5 py-2.5 bg-primary text-white text-[13px] font-medium rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
                >
                  {isParsing ? 'Parsing...' : 'Preview Data'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-medium text-foreground text-[15px]">
                    Review Leads ({leads.filter(l => !l.isDeleted).length} new, {leads.filter(l => l.isDuplicate).length} already in DB)
                  </h3>
                  <p className="text-[13px] text-foreground-muted mt-0.5">Companies marked "Already in DB" won't be imported again.</p>
                </div>
              </div>

              <div className="border border-border rounded-lg overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
                <div className="overflow-x-auto overflow-y-auto flex-1">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-secondary text-foreground-muted text-[12px] uppercase font-semibold tracking-wider sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="px-4 py-3 border-b border-border bg-secondary w-[110px]">Status</th>
                        <th className="px-4 py-3 border-b border-border bg-secondary w-[200px] max-w-[200px]">Company</th>
                        <th className="px-4 py-3 border-b border-border bg-secondary">Category</th>
                        <th className="px-4 py-3 border-b border-border bg-secondary">Website</th>
                        <th className="px-4 py-3 border-b border-border bg-secondary text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {leads.map((lead) => (
                        <tr key={lead.id} className={cn(
                          "transition-colors",
                          lead.isDuplicate ? "bg-amber-500/5 text-foreground-muted" :
                          lead.isDeleted ? "bg-error-bg/30 text-foreground-muted" :
                          "hover:bg-secondary/50 text-foreground"
                        )}>
                          <td className="px-4 py-3">
                            {lead.isDuplicate ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-[11px] font-medium whitespace-nowrap">
                                Already in DB
                              </span>
                            ) : lead.isDeleted ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-error-bg text-error-text text-[11px] font-medium">
                                <X className="w-3 h-3" /> Skipped
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-success-bg text-success-text text-[11px] font-medium">
                                <Check className="w-3 h-3" /> Ready
                              </span>
                            )}
                          </td>
                          <td className={cn("px-4 py-3 font-medium w-[200px] max-w-[200px]", (lead.isDeleted || lead.isDuplicate) && "line-through opacity-50")}>
                            <span className="block truncate" title={lead.name}>{lead.name}</span>
                          </td>
                          <td className={cn("px-4 py-3 text-[13px]", (lead.isDeleted || lead.isDuplicate) && "opacity-50")}>
                            {lead.category || '-'}
                          </td>
                          <td className={cn("px-4 py-3 text-[13px]", (lead.isDeleted || lead.isDuplicate) && "opacity-50")}>
                            {lead.website ? (
                              <a href={lead.website} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate max-w-[200px] inline-block">
                                {lead.website}
                              </a>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {lead.isDuplicate ? (
                              <span className="text-[12px] text-foreground-muted px-2 py-1">—</span>
                            ) : lead.isDeleted ? (
                              <button 
                                onClick={() => toggleDelete(lead.id)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary hover:text-primary-hover px-2 py-1 rounded hover:bg-primary/10 transition-colors"
                              >
                                <RotateCcw className="w-3.5 h-3.5" /> Revert
                              </button>
                            ) : (
                              <button 
                                onClick={() => toggleDelete(lead.id)}
                                className="inline-flex items-center gap-1.5 text-[12px] font-medium text-error-text hover:text-red-700 px-2 py-1 rounded hover:bg-error-bg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {leads.length > 0 && (
          <div className="p-5 border-t border-border bg-secondary/50 flex justify-between items-center shrink-0">
            <button 
              onClick={() => setLeads([])}
              className="px-4 py-2 text-[13px] font-medium text-foreground-muted hover:text-foreground transition-colors"
            >
              Back to Paste
            </button>
            <div className="flex gap-3">
              <button 
                onClick={() => navigate('/companies')}
                className="px-4 py-2 text-[13px] font-medium text-foreground-muted hover:text-foreground transition-colors bg-surface border border-border rounded-md shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleImport}
                className="px-6 py-2 bg-primary text-white text-[13px] font-medium rounded-md hover:bg-primary-hover transition-colors shadow-sm"
              >
                Import {leads.filter(l => !l.isDeleted).length} Leads
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
