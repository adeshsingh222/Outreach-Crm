import { 
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
} from '@tanstack/react-table';
import { 
  Building2, 
  Search, 
  ExternalLink, 
  ChevronLeft, 
  ChevronRight,
  Phone,
  Linkedin,
  Mail,
  FileText,
  Clock,
  UploadCloud,
  Sparkles,
  Star,
  MessageCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useAppStore, Company } from '@/lib/store';
import { useEffect } from 'react';

export default function Companies() {
  const navigate = useNavigate();
  const { companies, totalCompanies, currentPage, limit, setPage, setLimit, fetchCompanies, updateCompany } = useAppStore();

  useEffect(() => {
    fetchCompanies(currentPage, limit);
  }, [currentPage, limit, fetchCompanies]);

  const columnHelper = createColumnHelper<Company>();

  const columns = [
    columnHelper.accessor('name', {
      header: 'Company',
      cell: info => {
        const website = info.row.original.website;
        const domain = website ? website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] : null;
        
        return (
          <div className="relative group/hovercard inline-block max-w-full">
            <button 
              onClick={() => navigate(`/companies/${info.row.original.id}`)}
              className="font-medium text-foreground flex items-center gap-2 hover:text-primary transition-colors text-left max-w-[200px]"
              title={info.getValue() as string}
            >
              <Building2 className="w-4 h-4 text-foreground-faint shrink-0" /> 
              <span className="truncate">{info.getValue()}</span>
              {info.row.original.enriched && <Sparkles className="w-3.5 h-3.5 text-primary ml-1 shrink-0" />}
            </button>
            {domain && (
              <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden group-hover/hovercard:flex z-[9999] animate-in fade-in zoom-in-95 duration-200 shadow-2xl rounded-xl">
                <div className="bg-surface border border-border rounded-xl p-2 w-[400px] h-[400px] flex items-center justify-center overflow-hidden">
                  <img 
                    src={info.row.original.imageUrl || `https://logo.clearbit.com/${domain}?size=400`} 
                    alt={`${info.getValue()} logo`}
                    className="w-full h-full object-contain bg-white rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      },
    }),
    columnHelper.accessor('website', {
      header: 'Website',
      cell: info => {
        const val = info.getValue();
        if (!val) return <span className="text-foreground-faint">-</span>;
        const url = val.startsWith('http') ? val : `https://${val}`;
        return <a href={url} target="_blank" rel="noreferrer" className="text-foreground-muted hover:text-primary transition-colors flex items-center gap-1 truncate max-w-[150px]" onClick={e => e.stopPropagation()}>{val} <ExternalLink className="w-3 h-3" /></a>
      },
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => (
        <select 
          value={info.getValue() || 'Not Started'}
          onChange={(e) => {
            e.stopPropagation();
            updateCompany(info.row.original.id, { status: e.target.value });
          }}
          onClick={e => e.stopPropagation()}
          className={cn(
            "px-2 py-0.5 bg-secondary text-foreground-muted text-[11px] rounded-sm font-medium border border-border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 text-center text-center-last",
            info.getValue() === 'Not Started' ? "bg-secondary text-foreground-muted" : "bg-success-bg text-success-text border-transparent"
          )}
        >
          <option value="Not Started" className="bg-surface text-foreground">Not Started</option>
          <option value="Contacted" className="bg-surface text-foreground">Contacted</option>
          <option value="Pitched" className="bg-surface text-foreground">Pitched</option>
          <option value="Follow-up" className="bg-surface text-foreground">Follow-up</option>
          <option value="Connected" className="bg-surface text-foreground">Connected</option>
          <option value="Lost" className="bg-surface text-foreground">Lost</option>
        </select>
      ),
    }),
    columnHelper.accessor('priority', {
      header: 'Priority',
      cell: info => {
        const p = info.getValue() || 'Low';
        const color = p === 'High' ? 'text-error-text bg-error-bg border-transparent' : p === 'Medium' ? 'text-warning-text bg-warning-bg border-transparent' : 'text-foreground-muted bg-secondary border-border';
        return (
          <select 
            value={p}
            onChange={(e) => {
              e.stopPropagation();
              updateCompany(info.row.original.id, { priority: e.target.value });
            }}
            onClick={e => e.stopPropagation()}
            className={cn("px-2 py-0.5 rounded-sm text-[11px] font-medium border appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/50 text-center text-center-last w-[70px]", color)}
          >
            <option value="Low" className="text-foreground bg-surface">Low</option>
            <option value="Medium" className="text-foreground bg-surface">Medium</option>
            <option value="High" className="text-foreground bg-surface">High</option>
          </select>
        );
      },
    }),
    columnHelper.accessor('lastContact', {
      header: 'Last Contact',
      cell: info => <span className="text-foreground-muted">{info.getValue() || '-'}</span>,
    }),
    columnHelper.accessor('rating', {
      header: 'Rating',
      cell: info => {
        const rating = info.getValue();
        return rating ? (
          <div className="flex items-center gap-1 text-warning-text font-medium">
            <Star className="w-3.5 h-3.5 fill-current" />
            {rating.toFixed(1)}
          </div>
        ) : (
          <span className="text-foreground-faint">-</span>
        );
      },
    }),
    columnHelper.accessor('reviews', {
      header: 'Reviews',
      cell: info => <span className="text-foreground-muted">{info.getValue() ? `${info.getValue()} rev.` : '-'}</span>,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Quick Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
          <button onClick={() => navigate(`/companies/${row.original.id}`)} className="p-1.5 text-foreground-faint hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="View Details">
            <FileText className="w-3.5 h-3.5" />
          </button>
          {!row.original.enriched && (
            <button onClick={() => navigate(`/companies/${row.original.id}`)} className="p-1.5 text-foreground-faint hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Enrich Data">
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              updateCompany(row.original.id, { status: 'Contacted' });
              window.open(`tel:${row.original.phone?.replace(/\D/g, '') || ''}`, '_self');
            }}
            className="p-1.5 text-foreground-faint hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Call Contact">
            <Phone className="w-3.5 h-3.5" />
          </button>
          {/* 
          <button className="p-1.5 text-foreground-faint hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Open LinkedIn">
            <Linkedin className="w-3.5 h-3.5" />
          </button>
          */}
          <button 
            onClick={() => window.open(`https://wa.me/${row.original.phone?.replace(/\D/g, '')}?text=Hi`, '_blank')}
            className="p-1.5 text-foreground-faint hover:text-[#25D366] hover:bg-[#25D366]/10 rounded-md transition-colors" title="Send WhatsApp">
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
          {/*
          <button className="p-1.5 text-foreground-faint hover:text-primary hover:bg-primary/10 rounded-md transition-colors" title="Set Reminder">
            <Clock className="w-3.5 h-3.5" />
          </button>
          */}
        </div>
      )
    })
  ];

  const totalPages = Math.ceil(totalCompanies / limit);

  const table = useReactTable({
    data: companies,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Leads Pipeline</h2>
          <p className="text-foreground-muted text-[13px] mt-1">Manage your targeted list of companies and leads.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select 
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="bg-surface border border-border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm text-foreground"
          >
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-faint" />
            <input 
              type="text" 
              placeholder="Filter leads..." 
              className="w-full sm:w-64 pl-9 pr-4 py-1.5 bg-surface border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm text-foreground placeholder:text-foreground-faint"
            />
          </div>
          <button 
            onClick={() => navigate('/import')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary text-foreground text-sm font-medium rounded-md hover:bg-secondary/80 border border-border transition-colors shadow-sm whitespace-nowrap"
          >
            <UploadCloud className="w-4 h-4" />
            Import CSV
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
        <div className="overflow-x-auto relative">
          <table className="w-full text-sm text-left">
            <thead className="bg-secondary text-foreground-muted font-medium border-b border-border">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th 
                      key={header.id} 
                      className={cn(
                        "px-6 py-3 whitespace-nowrap text-[13px]",
                        header.id === 'actions' && "sticky right-0 bg-secondary border-l border-border z-20"
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="divide-y divide-border">
              {table.getRowModel().rows.map(row => (
                <tr key={row.id} className="group">
                  {row.getVisibleCells().map(cell => (
                    <td 
                      key={cell.id} 
                      className={cn(
                        "px-6 py-3.5 whitespace-nowrap text-[13px] text-foreground bg-surface group-hover:bg-secondary transition-colors",
                        cell.column.id === 'actions' && "sticky right-0 border-l border-border z-20"
                      )}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-[13px] text-foreground-muted">
          <div className="flex items-center gap-4">
            <span>Showing {companies.length > 0 ? (currentPage - 1) * limit + 1 : 0} - {Math.min(currentPage * limit, totalCompanies)} of {totalCompanies} entries</span>
          </div>
          <div className="flex gap-1.5 items-center">
            <span className="mr-2 text-xs">Page {currentPage} of {totalPages || 1}</span>
            <button 
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1 border border-border rounded disabled:opacity-50 text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="p-1 border border-border rounded disabled:opacity-50 text-foreground hover:bg-secondary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
