import { useEffect, useState } from 'react';
import { 
  BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer,
  FunnelChart, Funnel, LabelList
} from 'recharts';
import { AlertTriangle, Mail, Calendar, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/lib/store';

// Mock Data
const STATS = [
  { label: 'Total Leads', value: 128 },
  { label: 'Contacted', value: 45 },
  { label: 'Pitches Sent', value: 32 },
  { label: 'Connected', value: 12 },
  { label: 'Meetings', value: 5 },
  { label: 'Conversions', value: 1 },
];

const FUNNEL_DATA = [
  { name: 'Contacted', value: 128, fill: '#f4f4f5' },
  { name: 'Replied', value: 45, fill: '#e4e4e7' },
  { name: 'Connected', value: 12, fill: '#d4d4d8' },
  { name: 'Meetings', value: 5, fill: '#18181b' },
];

const ACTIVITY_DATA = [
  { name: 'Mon', count: 12 },
  { name: 'Tue', count: 24 },
  { name: 'Wed', count: 8 },
  { name: 'Thu', count: 42 },
  { name: 'Fri', count: 18 },
];

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const { theme } = useAppStore();
  
  useEffect(() => { setMounted(true) }, []);

  const funnelColors = theme === 'dark' 
    ? ['#3B2A6B', '#4C3392', '#6D28D9', '#8B5CF6']
    : ['#F3E8FF', '#E9D5FF', '#D8B4FE', '#C084FC'];
    
  const barColor = theme === 'dark' ? '#8B5CF6' : '#7C3AED';
  const axisColor = theme === 'dark' ? '#71717A' : '#94A3B8';
  const tooltipBg = theme === 'dark' ? '#181C24' : '#FFFFFF';
  const tooltipBorder = theme === 'dark' ? 'rgba(255,255,255,0.06)' : '#ECEEF3';

  const funnelDataWithColors = FUNNEL_DATA.map((item, index) => ({
    ...item,
    fill: funnelColors[index]
  }));

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">Welcome back, Alex.</h2>
        <p className="text-foreground-muted mt-1">Here is your daily outreach summary.</p>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-surface border border-border rounded-lg p-5 flex flex-col justify-between shadow-card">
            <span className="text-[10px] font-semibold text-foreground-faint uppercase tracking-widest">{stat.label}</span>
            <span className="text-3xl font-bold text-foreground mt-3 tracking-tight">{stat.value}</span>
          </div>
        ))}
        {/* Highlighted Stat */}
        <div className="bg-surface-secondary border border-border rounded-lg p-5 flex flex-col justify-between relative overflow-hidden shadow-card">
          <span className="text-[10px] font-semibold text-foreground-muted uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-warning-text" /> Action Required
          </span>
          <div className="flex items-end gap-2 mt-3">
            <span className="text-3xl font-bold text-foreground tracking-tight">8</span>
            <span className="text-sm text-foreground-faint mb-1">To Follow-up</span>
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
                      <Funnel dataKey="value" data={funnelDataWithColors} isAnimationActive>
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
                {mounted && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ACTIVITY_DATA}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: axisColor }} dy={10} />
                      <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ backgroundColor: tooltipBg, borderRadius: '6px', border: `1px solid ${tooltipBorder}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Follow-up Reminders List */}
          <div className="bg-surface border border-border rounded-lg shadow-card overflow-hidden">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <h3 className="text-[15px] font-semibold text-foreground">Follow-up Reminders</h3>
              <button className="text-sm font-medium text-foreground-muted hover:text-foreground transition-colors flex items-center gap-1">
                 View All <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {[
                { initial: 'A', name: 'Acme Corp - Demo Scheduled', desc: 'Sent Pitch on Oct 12. Need to prepare deck.', due: 'Overdue (2d)', icon: Mail },
                { initial: 'G', name: 'Global Tech - VP of Engineering', desc: 'Connected on LinkedIn. Schedule call.', due: 'Due Today', icon: Calendar },
                { initial: 'S', name: 'Stark Industries - Follow up', desc: 'Post-meeting thank you email.', due: 'Due Today', icon: Mail },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 px-6 hover:bg-secondary transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm bg-secondary text-foreground">
                      {item.initial}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="text-[13px] text-foreground-muted mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className={cn(
                      "text-[11px] font-medium px-2 py-0.5 rounded-sm",
                      item.due.includes('Overdue') ? "bg-error-bg text-error-text" : "bg-warning-bg text-warning-text"
                    )}>
                      {item.due}
                    </span>
                    <button className="text-foreground-faint hover:text-foreground transition-colors">
                      <item.icon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Timeline) */}
        <div className="lg:col-span-4 h-full">
          <div className="bg-surface border border-border rounded-lg p-6 shadow-card h-full flex flex-col">
            <h3 className="text-[15px] font-semibold text-foreground mb-8">Recent Activity</h3>
            <div className="flex-1 relative border-l border-border ml-2.5 space-y-8 pb-4">
              {[
                { title: 'Email opened', desc: 'Sarah from DesignCorp opened your pitch.', time: '10 mins ago' },
                { title: 'LinkedIn Connection Accepted', desc: 'John Doe (VP at TechNova) accepted your request.', time: '2 hours ago' },
                { title: 'Note Added', desc: 'Added note: "Interested but budget is tight for Q3".', time: 'Yesterday, 4:30 PM' },
                { title: 'Pitch Sent', desc: 'Sent outreach to "Frontend Dev Team" at Innovate Ltd.', time: 'Yesterday, 10:15 AM' },
              ].map((timeline, i) => (
                <div key={i} className="relative pl-6">
                  <div className="absolute w-2 h-2 bg-primary rounded-full -left-[4.5px] top-1.5 ring-4 ring-surface"></div>
                  <p className="text-[13px] font-medium text-foreground">{timeline.title}</p>
                  <p className="text-[13px] text-foreground-muted leading-snug mt-1">{timeline.desc}</p>
                  <span className="text-[11px] text-foreground-faint font-medium mt-1.5 block uppercase tracking-wider">{timeline.time}</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-2.5 bg-secondary hover:opacity-80 border border-border rounded-md text-foreground-muted text-sm font-medium transition-colors">
              Load More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
