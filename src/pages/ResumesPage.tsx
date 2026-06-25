import React, { useEffect, useState } from 'react';
import { useAppStore, Asset } from '@/lib/store';
import { FileText, Link as LinkIcon, Github, Linkedin, Briefcase, Plus, Copy, Trash2, Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ResumesPage() {
  const { assets, fetchAssets, addAsset, deleteAsset } = useAppStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newAsset, setNewAsset] = useState<Partial<Asset>>({ type: 'PDF' });
  const [file, setFile] = useState<File | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.title || !newAsset.type) return;
    if (newAsset.type === 'PDF' && !file) return;
    if (newAsset.type !== 'PDF' && !newAsset.url) return;
    
    const assetPayload = { ...newAsset };
    if (newAsset.type === 'PDF' && file) {
      (assetPayload as any).file = file;
    }
    
    await addAsset(assetPayload as Omit<Asset, 'id' | 'createdAt' | 'url'> & { url?: string; file?: File });
    setIsAdding(false);
    setNewAsset({ type: 'PDF' });
    setFile(null);
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'PDF': return <FileText className="w-5 h-5 text-error-text" />;
      case 'GitHub': return <Github className="w-5 h-5 text-foreground" />;
      case 'LinkedIn': return <Linkedin className="w-5 h-5 text-primary" />;
      case 'Portfolio': return <Briefcase className="w-5 h-5 text-warning-text" />;
      default: return <LinkIcon className="w-5 h-5 text-foreground-muted" />;
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resumes & Assets</h1>
          <p className="text-foreground-muted mt-1">Manage your resume variations and portfolio links for quick sharing.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Asset
        </button>
      </div>

      {/* Add Asset Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-xl p-6 shadow-sm space-y-4 animate-in slide-in-from-top-4 duration-300">
          <h3 className="font-semibold text-foreground">Add New Asset</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted uppercase">Title</label>
              <input 
                required
                placeholder="e.g., Frontend Resume 2026"
                value={newAsset.title || ''}
                onChange={e => setNewAsset({...newAsset, title: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted uppercase">
                {newAsset.type === 'PDF' ? 'Upload PDF' : 'URL Link'}
              </label>
              {newAsset.type === 'PDF' ? (
                <input 
                  required
                  type="file"
                  accept=".pdf"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-1.5 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                />
              ) : (
                <input 
                  required
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={newAsset.url || ''}
                  onChange={e => setNewAsset({...newAsset, url: e.target.value})}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted uppercase">Type</label>
              <select 
                value={newAsset.type}
                onChange={e => setNewAsset({...newAsset, type: e.target.value as Asset['type']})}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary"
              >
                <option value="PDF">PDF Resume</option>
                <option value="Portfolio">Portfolio Website</option>
                <option value="GitHub">GitHub Profile</option>
                <option value="LinkedIn">LinkedIn Profile</option>
                <option value="Other">Other Link</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground-muted uppercase">Description (Optional)</label>
              <input 
                placeholder="e.g., Tailored for React roles"
                value={newAsset.description || ''}
                onChange={e => setNewAsset({...newAsset, description: e.target.value})}
                className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => { setIsAdding(false); setFile(null); }} className="px-4 py-2 text-sm text-foreground-muted hover:text-foreground">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:bg-foreground/90 transition-colors">Save Asset</button>
          </div>
        </form>
      )}

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* The "Coming Soon" Live Web Resume Card */}
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Globe className="w-24 h-24 text-primary" />
          </div>
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Live Web Resume</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">Coming Soon</span>
              </div>
            </div>
            <p className="text-sm text-foreground-muted flex-grow">
              We are building a highly aesthetic, completely responsive web version of your resume hosted directly on this CRM. You'll be able to send companies a custom link to impress them instantly.
            </p>
            <div className="mt-6">
              <button disabled className="w-full py-2 bg-surface border border-border text-foreground-muted rounded-lg text-sm font-medium cursor-not-allowed">
                Builder locked
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Assets */}
        {assets.map(asset => (
          <div key={asset.id} className="bg-surface border border-border rounded-xl p-6 flex flex-col hover:border-primary/50 hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                  {getIcon(asset.type)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground line-clamp-1" title={asset.title}>{asset.title}</h3>
                  <p className="text-xs text-foreground-muted">{asset.type}</p>
                </div>
              </div>
              <button 
                onClick={() => deleteAsset(asset.id)}
                className="text-foreground-faint hover:text-error-text transition-colors opacity-0 group-hover:opacity-100"
                title="Delete Asset"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {asset.description && (
              <p className="text-sm text-foreground-muted mb-6 flex-grow">{asset.description}</p>
            )}
            {!asset.description && <div className="flex-grow"></div>}

            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
              <button 
                onClick={() => handleCopy(asset.url, asset.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-background border border-border hover:bg-secondary rounded-lg text-sm font-medium transition-colors text-foreground"
              >
                {copiedId === asset.id ? (
                  <span className="text-success-text flex items-center gap-2">Copied!</span>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy Link</>
                )}
              </button>
              <a 
                href={asset.url}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 flex items-center justify-center bg-background border border-border hover:bg-secondary rounded-lg text-foreground-muted hover:text-primary transition-colors"
                title="Open Link"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
