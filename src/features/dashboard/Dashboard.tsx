import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import { AlertTriangle, Mail, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { theme, user } = useAppStore();
  
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    async function loadData() {
      try {
        const [statsRes, actRes, followRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/activity'),
          fetch('/api/dashboard/follow-ups')
        ]);
        
        if (statsRes.ok && actRes.ok && followRes.ok) {
          const statsData = await statsRes.json();
          const actData = await actRes.json();
          const followData = await followRes.json();
          
          setStats(statsData);
          setActivities(actData);
          setFollowUps(followData);
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  const funnelColors = theme === 'dark' 
    ? ['#3B2A6B', '#4C3392', '#6D28D9', '#8B5CF6']
    : ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC'];
    
  const barColor = theme === 'dark' ? '#8B5CF6' : '#7C3AED';
  const axisColor = theme === 'dark' ? '#71717A' : '#94A3B8';
  const tooltipBg = theme === 'dark' ? '#181C24' : '#FFFFFF';
  const tooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#ECEEF3';

  // Format statistics grid
  const statsList = [
    { label: 'Total Leads', value: stats?.total ?? 0 },
    { label: 'Not Started', value: stats?.notStarted ?? 0 },
    { label: 'Contacted', value: stats?.contacted ?? 0 },
    { label: 'Not Connected', value: stats?.notConnected ?? 0 },
    { label: 'Pitched', value: stats?.pitched ?? 0 },
    { label: 'Follow-up', value: stats?.followUp ?? 0 },
    { label: 'Connected', value: stats?.connected ?? 0 },
    { label: 'Resume Sent', value: stats?.resumeSent ?? 0 },
    { label: 'Lost', value: stats?.lost ?? 0 },
  ];

  // Calculate conversion funnel values (progressive stages)
  const totalVal = stats?.total ?? 0;
  const contactedVal = (stats?.contacted ?? 0) + (stats?.pitched ?? 0) + (stats?.followUp ?? 0) + (stats?.connected ?? 0);
  const pitchedVal = (stats?.pitched ?? 0) + (stats?.followUp ?? 0) + (stats?.connected ?? 0);
  const connectedVal = stats?.connected ?? 0;

  const funnelData = [
    { name: 'Total Leads', value: totalVal },
    { name: 'Contacted', value: contactedVal },
    { name: 'Pitched', value: pitchedVal },
    { name: 'Connected', value: connectedVal },
  ].map((item, index) => ({
    ...item,
    fill: funnelColors[index]
  }));

  // Activity chart data
  const chartData = stats?.activityChart || [];

  // Helper for due date logic
  const getDueLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    
    const d1 = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const d2 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = d1.getTime() - d2.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return `Overdue (${Math.abs(diffDays)}d)`;
    } else if (diffDays === 0) {
      return 'Due Today';
    } else if (diffDays === 1) {
      return 'Due Tomorrow';
    } else {
      return `Due in ${diffDays}d`;
    }
  };

  // Helper for initial avatar
  const getInitial = (name: string) => {
    return name ? name.trim().charAt(0).toUpperCase() : 'C';
  };

  // Helper for timeline time ago
  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  const userName = user?.name || 'User';

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back, {userName}.</h2>
        <p className="text-foreground-muted mt-1">Here is your daily outreach summary.</p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {statsList.map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-lg p-5 flex flex-col justify-between shadow-card">
            <span className="text-[10px] font-semibold text-foreground-faint uppercase tracking-widest leading-normal">{stat.label}</span>
            <span className="text-3xl font-bold text-foreground mt-3 tracking-tight">{stat.value}</span>
          </div>
        ))}
        {/* Highlighted Stat */}
        <div className="bg-surface-secondary border border-border rounded-lg p-5 flex flex-col justify-between relative overflow-hidden shadow-card">
          <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest flex items-center gap-1.5 leading-normal">
            <AlertTriangle className="w-3.5 h-3.5 text-warning-text shrink-0" /> Action Required
          </span>
          <div className="flex items-end gap-2 mt-3">
            <span className="text-3xl font-bold text-foreground tracking-tight">{stats?.overdue ?? 0}</span>
            <span className="text-xs text-foreground-faint mb-1 leading-normal">To Follow-up</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
              <h3 className="text-[15px] font-semibold text-foreground mb-6">Outreach Funnel</h3>
              <div className="h-56">
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <FunnelChart>
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: tooltipBg, borderRadius: '6px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Funnel dataKey="value" data={funnelData} isAnimationActive>
                        <LabelList position="right" fill={axisColor} stroke="none" dataKey="name" fontSize={12} fontWeight={500} />
                      </Funnel>
                    </FunnelChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-lg p-6 shadow-card">
              <h3 className="text-[15px] font-semibold text-foreground mb-6">Activity Over Time</h3>
              <div className="h-56">
                {mounted && chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: axisColor }} dy={10} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: tooltipBg, borderRadius: '6px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-foreground-faint">
                    No recent activities recorded.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Follow-up Reminders List */}
          <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-foreground">Follow-up Reminders</h3>
              <a href="/companies" className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
                 View All <ArrowRight className="w-3 h-3" />
              </a>
            </div>
            <div className="divide-y divide-border">
              {followUps.length > 0 ? (
                followUps.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-secondary transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bg-secondary text-foreground">
                        {getInitial(item.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-[13px] text-foreground-muted mt-0.5">Status: {item.status} | Priority: {item.priority}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className={cn(
                        "text-[11px] font-medium px-2 py-0.5 rounded-sm",
                        getDueLabel(item.nextFollowUp).includes('Overdue') ? "bg-error-bg text-error-text" : "bg-warning-bg text-warning-text"
                      )}>
                        {getDueLabel(item.nextFollowUp)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-sm text-foreground-faint">
                  No upcoming follow-up reminders.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (Timeline) */}
        <div className="lg:col-span-4 h-full lg:max-h-[calc(100vh-200px)] lg:min-h-[600px]">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-card h-full flex flex-col">
            <h3 className="text-[15px] font-semibold text-foreground mb-8 shrink-0">Recent Activity</h3>
            <div className="flex-1 relative overflow-y-auto min-h-0 pr-2">
              <div className="border-l border-border ml-2.5 space-y-8 pb-4">
                {activities.length > 0 ? (
                  activities.map((timeline, i) => (
                    <div key={i} className="relative pl-6">
                      <div className="absolute w-2 h-2 bg-primary rounded-full -left-[4.5px] top-1.5 ring-4 ring-surface"></div>
                      <p className="text-[13px] font-medium text-foreground">{timeline.type}</p>
                      <p className="text-[13px] text-foreground-muted leading-snug mt-1">
                        {timeline.description} {timeline.company ? `(${timeline.company.name})` : ''}
                      </p>
                      <span className="text-[11px] text-foreground-faint font-medium mt-1.5 block uppercase tracking-wider">
                        {timeAgo(timeline.createdAt)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-foreground-faint pl-6">
                    No recent activity logged.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
